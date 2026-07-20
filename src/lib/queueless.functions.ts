import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase server client (publishable/anon key — RLS allows public read/insert)
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  }) as any;
}

// Serve the local `businesses` cache instead of calling Google Places when the
// area was last synced within this window. Live wait times always come fresh
// from `wait_reports`, so a long TTL here only avoids repeat (paid) Places calls.
const BUSINESS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Shape of a cached `businesses` row (includes updated_at for freshness checks).
type CachedBusinessRow = {
  id: string;
  google_place_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number;
  lng: number;
  category: string | null;
  primary_type: string | null;
  phone: string | null;
  logo_url: string | null;
  updated_at: string;
};

// Rough lat/lng bounding box around a point for a radius in miles.
function boundingBox(lat: number, lng: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return {
    south: lat - latDelta,
    north: lat + latDelta,
    west: lng - lngDelta,
    east: lng + lngDelta,
  };
}

// Haversine distance in miles (server-side copy of lib/queueless-data helper).
function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = (aLat * Math.PI) / 180;
  const s2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(s1) * Math.cos(s2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------------------
// Google Maps Platform via connector gateway
// ---------------------------------------------------------------------------
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function gwHeaders(extra?: Record<string, string>) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gmKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey || !gmKey) throw new Error("Google Maps connector is not configured.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gmKey,
    ...extra,
  };
}

async function handleGwError(res: Response) {
  const body = await res.text();
  if (res.status === 403) {
    try {
      const parsed = JSON.parse(body);
      const reason = parsed?.error?.details?.find((d: any) => d.reason)?.reason;
      if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
        throw new Error(
          'Google Maps server key is referrer-restricted. In Google Cloud Console, set the server key\'s application restrictions to "None" or "IP addresses".',
        );
      }
      if (reason === "API_KEY_SERVICE_BLOCKED") {
        throw new Error(
          "Google Maps server key does not allow this API. Add it to the key's allowed-APIs list.",
        );
      }
    } catch {}
  }
  throw new Error(`Google Maps request failed [${res.status}]: ${body}`);
}

// ---------------------------------------------------------------------------
// New Orleans metro focus (V1 launch region)
// ---------------------------------------------------------------------------
// Rough bounding box covering New Orleans, Metairie, Kenner, Gretna, Harvey,
// Marrero, Chalmette, Arabi, Jefferson, Westwego, Harahan, River Ridge,
// Elmwood, Belle Chasse.
const NOLA_BOUNDS = {
  south: 29.82,
  west: -90.35,
  north: 30.15,
  east: -89.55,
};
const NOLA_CENTER = { lat: 29.9511, lng: -90.0715 };

export function isInNolaMetro(lat: number, lng: number) {
  return (
    lat >= NOLA_BOUNDS.south &&
    lat <= NOLA_BOUNDS.north &&
    lng >= NOLA_BOUNDS.west &&
    lng <= NOLA_BOUNDS.east
  );
}

// Whether a lat/lng bounding box overlaps the NOLA launch region at all. Used to
// skip out-of-region nearby lookups (e.g. a user in Covington whose radius never
// reaches the metro) instead of returning/fetching businesses outside the region.
function boxIntersectsNola(box: { south: number; north: number; west: number; east: number }) {
  return (
    box.south <= NOLA_BOUNDS.north &&
    box.north >= NOLA_BOUNDS.south &&
    box.west <= NOLA_BOUNDS.east &&
    box.east >= NOLA_BOUNDS.west
  );
}

// ---------------------------------------------------------------------------
// Geocode a user-entered query (ZIP, city, address, neighborhood) → coords
// Biased to the New Orleans metro so ambiguous queries resolve locally.
// ---------------------------------------------------------------------------
export const geocodeQuery = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    const q = String(data?.query ?? "").trim();
    if (!q || q.length > 200) throw new Error("Enter a ZIP code, city, address, or neighborhood.");
    return { query: q };
  })
  .handler(async ({ data }) => {
    const bounds = `${NOLA_BOUNDS.south},${NOLA_BOUNDS.west}|${NOLA_BOUNDS.north},${NOLA_BOUNDS.east}`;
    const url =
      `${GATEWAY_URL}/maps/api/geocode/json` +
      `?address=${encodeURIComponent(data.query)}` +
      `&components=country:US` +
      `&bounds=${encodeURIComponent(bounds)}`;
    const res = await fetch(url, { headers: gwHeaders() });
    if (!res.ok) await handleGwError(res);
    const json = (await res.json()) as {
      status: string;
      results: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
    };
    if (json.status !== "OK" || !json.results.length) {
      throw new Error("We couldn't find that location. Try a New Orleans ZIP code, neighborhood, or address.");
    }
    // Prefer a result inside the NOLA bounding box when available.
    const inMetro = json.results.find((r) =>
      isInNolaMetro(r.geometry.location.lat, r.geometry.location.lng),
    );
    const r = inMetro ?? json.results[0];
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      label: r.formatted_address,
      inNolaMetro: isInNolaMetro(r.geometry.location.lat, r.geometry.location.lng),
    };
  });


// ---------------------------------------------------------------------------
// Business type filtering — inclusive by default
// ---------------------------------------------------------------------------
// We do NOT restrict discovery to a whitelist anymore. Google Places returns
// any legitimate public-facing place; we only strip out categories where
// customers never wait in line (private residences, industrial sites,
// contractors, warehouses, utility infrastructure, vacant land, etc.).
const EXCLUDED_TYPES_SET = new Set([
  // Private residences / lodging (we still allow hotels? — no, hidden per spec)
  "premise",
  "subpremise",
  "residential",
  "apartment_complex",
  "apartment_building",
  "housing_complex",
  "condominium_complex",
  "lodging",
  "hotel",
  "motel",
  "bed_and_breakfast",
  "extended_stay_hotel",
  "guest_house",
  "resort_hotel",
  "campground",
  "rv_park",
  // Contractors / trades
  "general_contractor",
  "roofing_contractor",
  "plumber",
  "electrician",
  "painter",
  "locksmith",
  "moving_company",
  "hvac_contractor",
  // Industrial / manufacturing / warehousing
  "industrial",
  "factory",
  "manufacturer",
  "warehouse",
  "storage",
  "self_storage",
  // Utility infrastructure
  "utility",
  "electric_vehicle_charging_station",
  "power_plant",
  "water_treatment_plant",
  // Land / raw
  "land_plot",
  "vacant_land",
  "cemetery",
  // Non-public offices (users can still add manually via search)
  "farm",
]);


// Category label + emoji for a given Place. Prefers primary_type.
const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  supermarket: { label: "Grocery", emoji: "🛒" },
  grocery_store: { label: "Grocery", emoji: "🛒" },
  convenience_store: { label: "Convenience", emoji: "🏪" },
  department_store: { label: "Department Store", emoji: "🏬" },
  discount_store: { label: "Discount Store", emoji: "🏬" },
  warehouse_store: { label: "Warehouse Club", emoji: "📦" },
  wholesaler: { label: "Warehouse Club", emoji: "📦" },
  clothing_store: { label: "Retail", emoji: "🛍️" },
  shoe_store: { label: "Retail", emoji: "👟" },
  shopping_mall: { label: "Mall", emoji: "🏬" },
  electronics_store: { label: "Retail", emoji: "🔌" },
  home_improvement_store: { label: "Home Improvement", emoji: "🔨" },
  furniture_store: { label: "Retail", emoji: "🛋️" },
  book_store: { label: "Retail", emoji: "📚" },

  cafe: { label: "Coffee", emoji: "☕" },
  coffee_shop: { label: "Coffee", emoji: "☕" },
  restaurant: { label: "Restaurant", emoji: "🍽️" },
  fast_food_restaurant: { label: "Fast Food", emoji: "🍔" },
  meal_takeaway: { label: "Takeout", emoji: "🥡" },
  bakery: { label: "Bakery", emoji: "🥐" },
  sandwich_shop: { label: "Sandwiches", emoji: "🥪" },
  pizza_restaurant: { label: "Pizza", emoji: "🍕" },
  hamburger_restaurant: { label: "Burgers", emoji: "🍔" },
  ice_cream_shop: { label: "Ice Cream", emoji: "🍦" },
  bar: { label: "Bar", emoji: "🍺" },

  bank: { label: "Bank", emoji: "🏦" },
  atm: { label: "ATM", emoji: "🏧" },
  post_office: { label: "Post Office", emoji: "📮" },
  local_government_office: { label: "Government", emoji: "🪪" },
  city_hall: { label: "Government", emoji: "🏛️" },
  courthouse: { label: "Courthouse", emoji: "⚖️" },

  hospital: { label: "Hospital", emoji: "🏥" },
  pharmacy: { label: "Pharmacy", emoji: "💊" },
  drugstore: { label: "Pharmacy", emoji: "💊" },
  medical_lab: { label: "Urgent Care", emoji: "🩺" },

  airport: { label: "Airport", emoji: "✈️" },
  gas_station: { label: "Gas", emoji: "⛽" },

  movie_theater: { label: "Movie Theater", emoji: "🎬" },
  amusement_park: { label: "Theme Park", emoji: "🎢" },
  water_park: { label: "Water Park", emoji: "🎢" },
  tourist_attraction: { label: "Attraction", emoji: "🎡" },
  zoo: { label: "Zoo", emoji: "🦁" },
  aquarium: { label: "Aquarium", emoji: "🐠" },

  gym: { label: "Gym", emoji: "🏋️" },
  fitness_center: { label: "Gym", emoji: "🏋️" },

  hair_salon: { label: "Salon", emoji: "💇" },
  beauty_salon: { label: "Salon", emoji: "💅" },
  barber_shop: { label: "Barber", emoji: "💈" },
  nail_salon: { label: "Nail Salon", emoji: "💅" },

  dessert_shop: { label: "Dessert", emoji: "🍨" },
  dessert_restaurant: { label: "Dessert", emoji: "🍨" },
  juice_shop: { label: "Juice & Smoothies", emoji: "🥤" },
};

function pickCategory(primaryType: string | undefined, types: string[] | undefined) {
  if (primaryType && CATEGORY_MAP[primaryType]) return { primary: primaryType, ...CATEGORY_MAP[primaryType] };
  if (types) {
    for (const t of types) {
      if (CATEGORY_MAP[t]) return { primary: t, ...CATEGORY_MAP[t] };
    }
  }
  return { primary: primaryType ?? (types?.[0] ?? "place"), label: "Place", emoji: "📍" };
}

function isExcluded(primaryType: string | undefined, types: string[] | undefined) {
  if (primaryType && EXCLUDED_TYPES_SET.has(primaryType)) return true;
  if (types?.some((t) => EXCLUDED_TYPES_SET.has(t))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Wait-propensity: how likely a business is to have customers waiting in line.
// Only walk-in categories where people realistically queue are listed here
// (food, coffee, dessert/snowball stands, grocery/big-box, pharmacies, banks,
// urgent care/hospitals, salons, post offices, theme attractions, etc.).
// This is an allowlist: anything NOT listed — offices, contractors,
// warehouses/industrial, residential, and appointment-only businesses
// (doctors, dentists, lawyers, spas, etc.) — scores 0 and is excluded from
// discovery results. Government offices are intentionally NOT blanket-listed
// (most don't serve walk-in customers); only those whose name matches a known
// public-counter service (DMV/OMV, driver's license, tax collector, clerk of
// court, etc. — see WALKIN_GOV_NAME_RE) are included. Exception: a business
// with real recent wait reports is always included regardless of category
// (see fetchRankedNearby).
// ---------------------------------------------------------------------------
const WAIT_PRONE_WEIGHTS: Record<string, number> = {
  // Food & drink (highest queue frequency)
  restaurant: 3,
  fast_food_restaurant: 3,
  cafe: 3,
  coffee_shop: 3,
  sandwich_shop: 3,
  pizza_restaurant: 3,
  hamburger_restaurant: 3,
  bakery: 3,
  ice_cream_shop: 3,
  dessert_shop: 3,
  dessert_restaurant: 3,
  juice_shop: 3,
  meal_takeaway: 3,
  bar: 2,
  // Health / essential errands
  pharmacy: 3,
  drugstore: 3,
  hospital: 3,
  medical_lab: 3,
  // Government: only post offices are reliably walk-in. Other gov offices
  // (DMV/OMV, tax collector, clerk of court) are included by name via
  // WALKIN_GOV_NAME_RE, not by the broad local_government_office type.
  post_office: 3,
  bank: 3,
  // Grocery & big-box (Costco / Walmart / Target / warehouse clubs)
  supermarket: 3,
  grocery_store: 3,
  warehouse_store: 3,
  wholesaler: 3,
  department_store: 2,
  discount_store: 2,
  shopping_mall: 2,
  // Personal care — walk-in salons/barbers
  hair_salon: 2,
  beauty_salon: 2,
  barber_shop: 2,
  nail_salon: 2,
  // Attractions & entertainment
  amusement_park: 3,
  water_park: 3,
  tourist_attraction: 2,
  zoo: 2,
  aquarium: 2,
  movie_theater: 2,
  airport: 2,
  gym: 2,
  fitness_center: 2,
};

function waitPropensity(primaryType: string | null | undefined): number {
  return (primaryType && WAIT_PRONE_WEIGHTS[primaryType]) || 0;
}

// Government offices vary wildly: DMVs and tax/court public counters have long
// walk-in lines, while most others are appointment-only or back-office. Google
// tags them all as local_government_office, so we detect the walk-in ones by
// name instead of by type.
const WALKIN_GOV_NAME_RE =
  /\b(d\.?m\.?v\.?|o\.?m\.?v\.?|motor vehicles?|driver'?s?\s+licen[sc]e|tax collector|clerk of court|registrar of voters|passport (?:office|acceptance))\b/i;

function isWalkInGovOffice(name: string | null | undefined): boolean {
  return !!name && WALKIN_GOV_NAME_RE.test(name);
}

// Effective wait-propensity for ranking/inclusion: the category weight, or a
// high weight for name-detected walk-in government offices.
function effectivePropensity(b: { primary_type?: string | null; name?: string | null }): number {
  return isWalkInGovOffice(b.name) ? 3 : waitPropensity(b.primary_type);
}

function pickAddressComponent(
  components: Array<{ types: string[]; short_name?: string; long_name?: string }> | undefined,
  type: string,
  short = false,
): string | null {
  if (!components) return null;
  const c = components.find((x) => x.types?.includes(type));
  return c ? ((short ? c.short_name : c.long_name) ?? null) : null;
}

function buildPhotoUrl(photoName: string | undefined): string | null {
  if (!photoName) return null;
  const browserKey = process.env.GOOGLE_MAPS_BROWSER_KEY;
  if (!browserKey) return null;
  // Browser key is authorized for Places API (New); safe to embed in <img src>.
  // Cache at a card/hero-friendly width; the client rewrites maxWidthPx per use.
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=false&key=${browserKey}`;
}

// ---------------------------------------------------------------------------
// Live-wait aggregation helpers
// ---------------------------------------------------------------------------
type StoredReport = { minutes: number; created_at: string; source: string | null };

// Weighted current wait: newer + timer reports weigh more; ignore obvious outliers.
function aggregateReports(reports: StoredReport[]) {
  if (!reports.length) return { current: null as number | null, count: 0, latest: null as string | null, trend: "stable" as "up" | "down" | "stable" };

  const now = Date.now();
  // Only reports within the last 90 minutes count as "current".
  const recent = reports.filter((r) => now - new Date(r.created_at).getTime() <= 90 * 60_000);
  if (!recent.length) return { current: null, count: 0, latest: null, trend: "stable" as const };

  // Outlier removal: drop values >2.5x the median.
  const sortedMins = [...recent.map((r) => r.minutes)].sort((a, b) => a - b);
  const median = sortedMins[Math.floor(sortedMins.length / 2)];
  const kept = recent.filter((r) => median === 0 || r.minutes <= median * 2.5 + 5);

  let weightSum = 0;
  let weighted = 0;
  for (const r of kept) {
    const ageMin = Math.max(0, (now - new Date(r.created_at).getTime()) / 60_000);
    // Recency weight: 1.0 at 0m, ~0.5 at 30m, ~0.1 at 90m
    const recencyW = Math.exp(-ageMin / 30);
    const sourceW = r.source === "timer" ? 1.5 : r.source === "exact" ? 1.2 : 1;
    const w = recencyW * sourceW;
    weighted += r.minutes * w;
    weightSum += w;
  }
  const current = weightSum > 0 ? Math.round(weighted / weightSum) : null;

  // Trend: compare avg of newest half vs older half (chronological).
  const chrono = [...kept].sort((a, b) => a.created_at.localeCompare(b.created_at));
  let trend: "up" | "down" | "stable" = "stable";
  if (chrono.length >= 3) {
    const half = Math.floor(chrono.length / 2);
    const oldAvg = chrono.slice(0, half).reduce((s, r) => s + r.minutes, 0) / half;
    const newAvg = chrono.slice(-half).reduce((s, r) => s + r.minutes, 0) / half;
    if (newAvg - oldAvg >= 4) trend = "up";
    else if (oldAvg - newAvg >= 4) trend = "down";
  }

  const latest = kept.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at;
  return { current, count: kept.length, latest, trend };
}

// Attach aggregated live-wait data (from recent wait_reports) to business rows.
// Shared by the nearby, search and cache-serving paths so they stay identical.
async function withAggregatedWaits<T extends { id: string }>(
  supabase: ReturnType<typeof getSupabase>,
  stored: T[],
) {
  const ids = stored.map((b) => b.id);
  const { data: reportsRaw } = await supabase
    .from("wait_reports")
    .select("business_id, minutes, created_at, source")
    .in("business_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .gte("created_at", new Date(Date.now() - 90 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });
  const reports = (reportsRaw ?? []) as Array<{
    business_id: string;
    minutes: number;
    created_at: string;
    source: string | null;
  }>;

  const byBiz = new Map<string, StoredReport[]>();
  for (const r of reports) {
    const list = byBiz.get(r.business_id) ?? [];
    list.push({ minutes: r.minutes, created_at: r.created_at, source: r.source });
    byBiz.set(r.business_id, list);
  }

  return stored.map((b) => {
    const agg = aggregateReports(byBiz.get(b.id) ?? []);
    return {
      ...b,
      currentMinutes: agg.current,
      updatedMinutesAgo: agg.latest
        ? Math.max(0, (Date.now() - new Date(agg.latest).getTime()) / 60_000)
        : null,
      contributors: agg.count,
      trend: agg.trend,
    };
  });
}

// Turn a pool of nearby candidates into a wait-prioritized result set.
// 1) Keep only wait-prone categories, plus anywhere with real recent reports —
//    so we don't just echo back every Google place.
// 2) Rank: places with live reports first (longest current wait, then most
//    contributors), then by category wait-propensity, distance as tiebreaker.
async function fetchRankedNearby<
  T extends {
    id: string;
    primary_type?: string | null;
    name?: string | null;
    lat: number;
    lng: number;
  },
>(supabase: ReturnType<typeof getSupabase>, candidates: T[], lat: number, lng: number) {
  const near = candidates.slice(0, 60);
  const aggregated = await withAggregatedWaits(supabase, near);
  return aggregated
    .map((b) => ({
      b,
      prop: effectivePropensity(b),
      dist: milesBetween(lat, lng, b.lat, b.lng),
    }))
    .filter((x) => x.prop >= 2 || x.b.contributors > 0)
    .sort((x, y) => {
      const xActive = x.b.contributors > 0 ? 1 : 0;
      const yActive = y.b.contributors > 0 ? 1 : 0;
      if (xActive !== yActive) return yActive - xActive;
      if (xActive) {
        const xm = x.b.currentMinutes ?? 0;
        const ym = y.b.currentMinutes ?? 0;
        if (ym !== xm) return ym - xm;
        if (y.b.contributors !== x.b.contributors) return y.b.contributors - x.b.contributors;
      }
      if (y.prop !== x.prop) return y.prop - x.prop;
      return x.dist - y.dist;
    })
    .map((x) => x.b)
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// Fetch nearby businesses via Places API (New), upsert into DB, and return
// them with aggregated wait-time data.
// ---------------------------------------------------------------------------
export const fetchNearbyBusinesses = createServerFn({ method: "POST" })
  .inputValidator((data: { lat: number; lng: number; radiusMiles?: number }) => {
    const lat = Number(data?.lat);
    const lng = Number(data?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Invalid coords");
    const radiusMiles = Math.min(Math.max(Number(data?.radiusMiles ?? 25), 1), 25);
    return { lat, lng, radiusMiles };
  })
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const radiusMeters = Math.min(Math.round(data.radiusMiles * 1609.34), 50_000);

    // Cache-first: serve businesses already stored for this area when it was
    // synced within the freshness window; only hit Google Places when the area
    // cache is empty or stale. Wait times are always aggregated live below.
    const box = boundingBox(data.lat, data.lng, data.radiusMiles);
    const { data: cachedRaw } = await supabase
      .from("businesses")
      .select(
        "id, google_place_id, name, address, city, state, zip, lat, lng, category, primary_type, phone, logo_url, updated_at",
      )
      .gte("lat", box.south)
      .lte("lat", box.north)
      .gte("lng", box.west)
      .lte("lng", box.east);
    const cachedNearby = ((cachedRaw ?? []) as CachedBusinessRow[])
      .filter(
        (b) =>
          isInNolaMetro(b.lat, b.lng) &&
          milesBetween(data.lat, data.lng, b.lat, b.lng) <= data.radiusMiles,
      )
      .sort(
        (a, b) =>
          milesBetween(data.lat, data.lng, a.lat, a.lng) -
          milesBetween(data.lat, data.lng, b.lat, b.lng),
      );
    if (cachedNearby.length) {
      const newest = cachedNearby.reduce(
        (max, b) => (b.updated_at > max ? b.updated_at : max),
        "",
      );
      const areaFresh = newest && Date.now() - new Date(newest).getTime() < BUSINESS_CACHE_TTL_MS;
      if (areaFresh) {
        const candidates = cachedNearby.map(({ updated_at, ...b }) => b);
        return fetchRankedNearby(supabase, candidates, data.lat, data.lng);
      }
    }

    // Outside the launch region: if the search radius never reaches the NOLA
    // metro, return nothing rather than fetching out-of-region places from
    // Google (e.g. a user in Covington should not see Covington businesses).
    if (!boxIntersectsNola(box)) return [];

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: gwHeaders({
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.addressComponents,places.internationalPhoneNumber,places.photos",
      }),
      body: JSON.stringify({
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        // No includedTypes: Google returns all public-facing places, we then
        // filter out non-public-facing categories client-side.
        locationRestriction: {
          circle: {
            center: { latitude: data.lat, longitude: data.lng },
            radius: radiusMeters,
          },
        },
      }),
    });
    if (!res.ok) await handleGwError(res);
    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        types?: string[];
        primaryType?: string;
        addressComponents?: Array<{ types: string[]; shortText?: string; longText?: string }>;
        internationalPhoneNumber?: string;
        photos?: Array<{ name: string }>;
      }>;
    };
    const places = (json.places ?? []).filter(
      (p) =>
        p.id &&
        p.location &&
        p.displayName?.text &&
        !isExcluded(p.primaryType, p.types) &&
        isInNolaMetro(p.location.latitude, p.location.longitude),
    );

    const rows = places.map((p) => {
      const comps = (p.addressComponents ?? []).map((c) => ({
        types: c.types,
        short_name: c.shortText,
        long_name: c.longText,
      }));
      const cat = pickCategory(p.primaryType, p.types);
      return {
        google_place_id: p.id,
        name: p.displayName!.text,
        address: p.formattedAddress ?? null,
        city:
          pickAddressComponent(comps, "locality") ??
          pickAddressComponent(comps, "sublocality") ??
          pickAddressComponent(comps, "postal_town"),
        state: pickAddressComponent(comps, "administrative_area_level_1", true),
        zip: pickAddressComponent(comps, "postal_code"),
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        category: cat.label,
        primary_type: cat.primary,
        phone: p.internationalPhoneNumber ?? null,
        logo_url: buildPhotoUrl(p.photos?.[0]?.name),
        updated_at: new Date().toISOString(),
      };
    });

    if (rows.length) {
      const { error } = await supabase
        .from("businesses")
        .upsert(rows, { onConflict: "google_place_id" });
      if (error) console.error("upsert businesses failed:", error);
    }

    const placeIds = rows.map((r) => r.google_place_id);
    const { data: storedRaw, error: readErr } = await supabase
      .from("businesses")
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, primary_type, phone, logo_url")
      .in("google_place_id", placeIds.length ? placeIds : ["__none__"]);
    if (readErr) throw new Error(readErr.message);
    const stored = (storedRaw ?? []) as Array<any>;

    return fetchRankedNearby(supabase, stored, data.lat, data.lng);
  });

// ---------------------------------------------------------------------------
// Get a single business with recent reports (for detail page)
// ---------------------------------------------------------------------------
export const getBusinessWithReports = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    const id = String(data?.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid business id");
    return { id };
  })
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: businessRaw, error } = await supabase
      .from("businesses")
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, primary_type, phone, logo_url")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!businessRaw) throw new Error("Business not found");
    const business = businessRaw as any;

    const { data: reportsRaw } = await supabase
      .from("wait_reports")
      .select("id, minutes, created_at, reporter_key, source, comment")
      .eq("business_id", data.id)
      .order("created_at", { ascending: false })
      .limit(30);
    const reports = (reportsRaw ?? []) as Array<{
      id: string; minutes: number; created_at: string; reporter_key: string | null;
      source: string | null; comment: string | null;
    }>;

    const agg = aggregateReports(
      reports.map((r) => ({ minutes: r.minutes, created_at: r.created_at, source: r.source })),
    );

    return {
      ...business,
      currentMinutes: agg.current,
      updatedMinutesAgo: agg.latest
        ? Math.max(0, (Date.now() - new Date(agg.latest).getTime()) / 60_000)
        : null,
      contributors: agg.count,
      trend: agg.trend,
      reports: reports.map((r) => ({
        id: r.id,
        minutes: r.minutes,
        minutesAgo: Math.max(0, (Date.now() - new Date(r.created_at).getTime()) / 60_000),
        contributor: (r.reporter_key ?? "anon").slice(0, 2).toUpperCase(),
        source: (r.source ?? "quick") as "quick" | "exact" | "timer",
        comment: r.comment,
      })),
    };
  });

// ---------------------------------------------------------------------------
// Submit a wait-time report
// ---------------------------------------------------------------------------
export const submitWaitReport = createServerFn({ method: "POST" })
  .inputValidator((data: {
    businessId: string;
    minutes: number;
    reporterKey: string;
    source?: "quick" | "exact" | "timer";
    comment?: string;
  }) => {
    const id = String(data?.businessId ?? "");
    const m = Number(data?.minutes);
    const key = String(data?.reporterKey ?? "").slice(0, 64);
    const source = data?.source && ["quick", "exact", "timer"].includes(data.source)
      ? data.source
      : "quick";
    const comment = data?.comment ? String(data.comment).trim().slice(0, 200) : null;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid business id");
    if (!Number.isFinite(m) || m < 0 || m > 240) throw new Error("Invalid wait time");
    return { businessId: id, minutes: Math.round(m), reporterKey: key, source, comment };
  })
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("wait_reports").insert({
      business_id: data.businessId,
      minutes: data.minutes,
      reporter_key: data.reporterKey || null,
      source: data.source,
      comment: data.comment,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Look up favorites by id
// ---------------------------------------------------------------------------
export const getBusinessesByIds = createServerFn({ method: "POST" })
  .inputValidator((data: { ids: string[] }) => {
    const ids = Array.isArray(data?.ids) ? data.ids.slice(0, 100) : [];
    return { ids: ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)) };
  })
  .handler(async ({ data }) => {
    if (!data.ids.length) return [];
    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from("businesses")
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, primary_type, phone, logo_url")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------------------------------------------------------------------------
// Text search — for business names, keywords, neighborhoods.
// Biased to the user's current coords (or the New Orleans metro by default),
// and always restricted to a wide radius around the bias point.
// ---------------------------------------------------------------------------
export const searchBusinessesByText = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string; lat?: number; lng?: number }) => {
    const query = String(data?.query ?? "").trim();
    if (!query || query.length > 120) throw new Error("Enter a business name or keyword.");
    const lat = Number.isFinite(Number(data?.lat)) ? Number(data!.lat) : NOLA_CENTER.lat;
    const lng = Number.isFinite(Number(data?.lng)) ? Number(data!.lng) : NOLA_CENTER.lng;
    return { query, lat, lng };
  })
  .handler(async ({ data }) => {
    const supabase = getSupabase();

    // Cache-first: match already-cached businesses by name within the NOLA
    // metro; only hit Google Places text search when there is no fresh match.
    const { data: cachedRaw } = await supabase
      .from("businesses")
      .select(
        "id, google_place_id, name, address, city, state, zip, lat, lng, category, primary_type, phone, logo_url, updated_at",
      )
      .ilike("name", `%${data.query}%`)
      .gte("lat", NOLA_BOUNDS.south)
      .lte("lat", NOLA_BOUNDS.north)
      .gte("lng", NOLA_BOUNDS.west)
      .lte("lng", NOLA_BOUNDS.east)
      .limit(20);
    const cachedFresh = ((cachedRaw ?? []) as CachedBusinessRow[]).filter(
      (b) => Date.now() - new Date(b.updated_at).getTime() < BUSINESS_CACHE_TTL_MS,
    );
    if (cachedFresh.length) {
      const stored = cachedFresh
        .map(({ updated_at, ...b }) => b)
        .sort(
          (a, b) =>
            milesBetween(data.lat, data.lng, a.lat, a.lng) -
            milesBetween(data.lat, data.lng, b.lat, b.lng),
        );
      return withAggregatedWaits(supabase, stored);
    }

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: gwHeaders({
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.addressComponents,places.internationalPhoneNumber,places.photos",
      }),
      body: JSON.stringify({
        textQuery: data.query,
        pageSize: 20,
        locationBias: {
          circle: {
            center: { latitude: data.lat, longitude: data.lng },
            radius: 40_000, // ~25 mi bias
          },
        },
      }),
    });
    if (!res.ok) await handleGwError(res);
    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        types?: string[];
        primaryType?: string;
        addressComponents?: Array<{ types: string[]; shortText?: string; longText?: string }>;
        internationalPhoneNumber?: string;
        photos?: Array<{ name: string }>;
      }>;
    };

    const places = (json.places ?? []).filter(
      (p) =>
        p.id &&
        p.location &&
        p.displayName?.text &&
        !isExcluded(p.primaryType, p.types) &&
        isInNolaMetro(p.location.latitude, p.location.longitude),
    );

    const rows = places.map((p) => {
      const comps = (p.addressComponents ?? []).map((c) => ({
        types: c.types,
        short_name: c.shortText,
        long_name: c.longText,
      }));
      const cat = pickCategory(p.primaryType, p.types);
      return {
        google_place_id: p.id,
        name: p.displayName!.text,
        address: p.formattedAddress ?? null,
        city:
          pickAddressComponent(comps, "locality") ??
          pickAddressComponent(comps, "sublocality") ??
          pickAddressComponent(comps, "postal_town"),
        state: pickAddressComponent(comps, "administrative_area_level_1", true),
        zip: pickAddressComponent(comps, "postal_code"),
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        category: cat.label,
        primary_type: cat.primary,
        phone: p.internationalPhoneNumber ?? null,
        logo_url: buildPhotoUrl(p.photos?.[0]?.name),
        updated_at: new Date().toISOString(),
      };
    });

    if (rows.length) {
      const { error } = await supabase
        .from("businesses")
        .upsert(rows, { onConflict: "google_place_id" });
      if (error) console.error("upsert businesses failed:", error);
    }

    const placeIds = rows.map((r) => r.google_place_id);
    const { data: storedRaw, error: readErr } = await supabase
      .from("businesses")
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, primary_type, phone, logo_url")
      .in("google_place_id", placeIds.length ? placeIds : ["__none__"]);
    if (readErr) throw new Error(readErr.message);
    const stored = (storedRaw ?? []) as Array<any>;

    // Preserve Google's relevance ranking.
    const order = new Map(placeIds.map((id, i) => [id, i]));
    stored.sort(
      (a, b) => (order.get(a.google_place_id) ?? 999) - (order.get(b.google_place_id) ?? 999),
    );

    return withAggregatedWaits(supabase, stored);
  });

