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
// Geocode a user-entered query (ZIP, city, address) → { lat, lng, label }
// ---------------------------------------------------------------------------
export const geocodeQuery = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    const q = String(data?.query ?? "").trim();
    if (!q || q.length > 200) throw new Error("Enter a ZIP code, city, or address.");
    return { query: q };
  })
  .handler(async ({ data }) => {
    const url =
      `${GATEWAY_URL}/maps/api/geocode/json` +
      `?address=${encodeURIComponent(data.query)}&components=country:US`;
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
      throw new Error("We couldn't find that location. Try a ZIP code or a city name.");
    }
    const r = json.results[0];
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      label: r.formatted_address,
    };
  });

// ---------------------------------------------------------------------------
// Business type filtering — inclusive by default. No whitelist. We ask
// Google for every nearby place and only hide categories that clearly are
// not public-facing walk-in businesses (residences, contractors,
// industrial, storage, offices, etc.).
// ---------------------------------------------------------------------------

const EXCLUDED_TYPES_SET = new Set([
  // Lodging
  "lodging", "hotel", "motel", "bed_and_breakfast", "extended_stay_hotel",
  "guest_house", "resort_hotel", "campground", "rv_park",
  // Professional / corporate offices — appointment-only or private
  "real_estate_agency", "lawyer", "accounting", "insurance_agency",
  "corporate_office",
  // Contractors, trades, industrial, storage
  "general_contractor", "roofing_contractor", "plumber", "electrician",
  "painter", "moving_company", "storage", "self_storage",
  // Residential
  "apartment_building", "apartment_complex", "housing_complex",
  "condominium_complex",
  // Agriculture
  "farm", "farmstay",
  // Schools (generally not walk-in public service)
  "school", "primary_school", "secondary_school", "preschool", "university",
  // Places of worship
  "church", "mosque", "synagogue", "hindu_temple", "place_of_worship",
  // Misc
  "cemetery", "funeral_home", "parking",
]);

// Category label + emoji. Anything not listed falls back to a friendly
// generic label so uncommon/local businesses still surface.
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
  store: { label: "Store", emoji: "🛍️" },

  cafe: { label: "Coffee", emoji: "☕" },
  coffee_shop: { label: "Coffee", emoji: "☕" },
  restaurant: { label: "Restaurant", emoji: "🍽️" },
  fast_food_restaurant: { label: "Fast Food", emoji: "🍔" },
  meal_takeaway: { label: "Takeout", emoji: "🥡" },
  meal_delivery: { label: "Takeout", emoji: "🥡" },
  bakery: { label: "Bakery", emoji: "🥐" },
  sandwich_shop: { label: "Sandwiches", emoji: "🥪" },
  pizza_restaurant: { label: "Pizza", emoji: "🍕" },
  hamburger_restaurant: { label: "Burgers", emoji: "🍔" },
  ice_cream_shop: { label: "Ice Cream", emoji: "🍦" },
  dessert_shop: { label: "Dessert", emoji: "🍰" },
  juice_shop: { label: "Juice Bar", emoji: "🧃" },
  food: { label: "Food", emoji: "🍴" },
  food_court: { label: "Food Court", emoji: "🍴" },
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
  doctor: { label: "Clinic", emoji: "🩺" },
  dentist: { label: "Dentist", emoji: "🦷" },
  veterinary_care: { label: "Vet", emoji: "🐾" },

  airport: { label: "Airport", emoji: "✈️" },
  gas_station: { label: "Gas", emoji: "⛽" },
  car_wash: { label: "Car Wash", emoji: "🚗" },
  car_rental: { label: "Car Rental", emoji: "🚙" },
  train_station: { label: "Train", emoji: "🚆" },
  transit_station: { label: "Transit", emoji: "🚉" },
  bus_station: { label: "Bus", emoji: "🚌" },
  subway_station: { label: "Subway", emoji: "🚇" },
  ferry_terminal: { label: "Ferry", emoji: "⛴️" },

  movie_theater: { label: "Movie Theater", emoji: "🎬" },
  amusement_park: { label: "Theme Park", emoji: "🎢" },
  water_park: { label: "Water Park", emoji: "🏊" },
  museum: { label: "Museum", emoji: "🏛️" },
  zoo: { label: "Zoo", emoji: "🦁" },
  aquarium: { label: "Aquarium", emoji: "🐠" },
  stadium: { label: "Stadium", emoji: "🏟️" },
  arena: { label: "Arena", emoji: "🏟️" },
  event_venue: { label: "Event Venue", emoji: "🎟️" },
  tourist_attraction: { label: "Attraction", emoji: "📸" },
  night_club: { label: "Nightclub", emoji: "🎶" },
  casino: { label: "Casino", emoji: "🎰" },
  bowling_alley: { label: "Bowling", emoji: "🎳" },
  park: { label: "Park", emoji: "🌳" },

  gym: { label: "Gym", emoji: "🏋️" },
  fitness_center: { label: "Gym", emoji: "🏋️" },
  spa: { label: "Spa", emoji: "💆" },
  hair_salon: { label: "Salon", emoji: "💇" },
  barber_shop: { label: "Barber", emoji: "💈" },
  beauty_salon: { label: "Salon", emoji: "💅" },
  nail_salon: { label: "Nail Salon", emoji: "💅" },
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
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=128&skipHttpRedirect=false&key=${browserKey}`;
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

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: gwHeaders({
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.addressComponents,places.internationalPhoneNumber,places.photos,places.businessStatus",
      }),
      body: JSON.stringify({
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        // No includedTypes — we want every public-facing business Google
        // knows about. We filter obvious non-walk-in categories out below.
        excludedTypes: Array.from(EXCLUDED_TYPES_SET),
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
        businessStatus?: string;
      }>;
    };
    const places = (json.places ?? []).filter(
      (p) =>
        p.id &&
        p.location &&
        p.displayName?.text &&
        (!p.businessStatus || p.businessStatus === "OPERATIONAL") &&
        !isExcluded(p.primaryType, p.types),
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

    const ids = stored.map((b) => b.id);
    const { data: reportsRaw } = await supabase
      .from("wait_reports")
      .select("business_id, minutes, created_at, source")
      .in("business_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
      .gte("created_at", new Date(Date.now() - 90 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });
    const reports = (reportsRaw ?? []) as Array<{
      business_id: string; minutes: number; created_at: string; source: string | null;
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
