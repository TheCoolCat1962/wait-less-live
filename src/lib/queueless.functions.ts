import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase server client (publishable/anon key — RLS allows public read/insert)
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  // Cast to any so newly-added tables (not yet in generated types) are usable.
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
  if (!lovableKey || !gmKey) {
    throw new Error("Google Maps connector is not configured.");
  }
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
          "Google Maps server key does not allow this API. Add this API to the key's allowed-APIs list.",
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
// Category mapping from Google Place types → app-friendly label
// ---------------------------------------------------------------------------
const CATEGORY_MAP: Array<[string, string]> = [
  ["supermarket", "Grocery"],
  ["grocery_store", "Grocery"],
  ["convenience_store", "Grocery"],
  ["cafe", "Coffee"],
  ["coffee_shop", "Coffee"],
  ["pharmacy", "Pharmacy"],
  ["drugstore", "Pharmacy"],
  ["bank", "Bank"],
  ["atm", "Bank"],
  ["gym", "Gym"],
  ["fitness_center", "Gym"],
  ["local_government_office", "Government"],
  ["city_hall", "Government"],
  ["post_office", "Government"],
  ["restaurant", "Restaurant"],
  ["meal_takeaway", "Restaurant"],
  ["fast_food_restaurant", "Restaurant"],
  ["bar", "Restaurant"],
  ["hospital", "Health"],
  ["doctor", "Health"],
  ["gas_station", "Gas"],
  ["department_store", "Store"],
  ["clothing_store", "Store"],
  ["store", "Store"],
];

function categoryFromTypes(types: string[] | undefined): string {
  if (!types) return "Place";
  for (const [key, label] of CATEGORY_MAP) {
    if (types.includes(key)) return label;
  }
  return "Place";
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

    // Places API (New) — Nearby Search
    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: gwHeaders({
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents,places.internationalPhoneNumber",
      }),
      body: JSON.stringify({
        maxResultCount: 20,
        rankPreference: "DISTANCE",
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
        addressComponents?: Array<{ types: string[]; shortText?: string; longText?: string }>;
        internationalPhoneNumber?: string;
      }>;
    };
    const places = json.places ?? [];

    // Upsert businesses into DB
    const rows = places
      .filter((p) => p.id && p.location && p.displayName?.text)
      .map((p) => {
        const comps = (p.addressComponents ?? []).map((c) => ({
          types: c.types,
          short_name: c.shortText,
          long_name: c.longText,
        }));
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
          category: categoryFromTypes(p.types),
          phone: p.internationalPhoneNumber ?? null,
          updated_at: new Date().toISOString(),
        };
      });

    if (rows.length) {
      const { error } = await supabase
        .from("businesses")
        .upsert(rows, { onConflict: "google_place_id" });
      if (error) console.error("upsert businesses failed:", error);
    }

    // Read back stored ids (needed to attach wait aggregates)
    const placeIds = rows.map((r) => r.google_place_id);
    const { data: storedRaw, error: readErr } = await supabase
      .from("businesses")
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, phone")
      .in("google_place_id", placeIds);
    if (readErr) throw new Error(readErr.message);
    const stored = (storedRaw ?? []) as Array<{
      id: string; google_place_id: string; name: string;
      address: string | null; city: string | null; state: string | null; zip: string | null;
      lat: number; lng: number; category: string; phone: string | null;
    }>;

    const ids = stored.map((b) => b.id);
    const { data: reportsRaw } = await supabase
      .from("wait_reports")
      .select("business_id, minutes, created_at")
      .in("business_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });
    const reports = (reportsRaw ?? []) as Array<{
      business_id: string; minutes: number; created_at: string;
    }>;

    const byBiz = new Map<string, { minutes: number[]; latest: string; count: number }>();
    for (const r of reports) {
      const agg = byBiz.get(r.business_id) ?? { minutes: [], latest: r.created_at, count: 0 };
      agg.minutes.push(r.minutes);
      if (r.created_at > agg.latest) agg.latest = r.created_at;
      agg.count += 1;
      byBiz.set(r.business_id, agg);
    }

    return stored.map((b) => {
      const agg = byBiz.get(b.id);
      const avg = agg
        ? Math.round(agg.minutes.reduce((s, x) => s + x, 0) / agg.minutes.length)
        : null;
      const updatedMinutesAgo = agg
        ? Math.max(0, (Date.now() - new Date(agg.latest).getTime()) / 60_000)
        : null;
      return {
        ...b,
        currentMinutes: avg,
        updatedMinutesAgo,
        contributors: agg?.count ?? 0,
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
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, phone")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!business) throw new Error("Business not found");

    const { data: reportsRaw } = await supabase
      .from("wait_reports")
      .select("id, minutes, created_at, reporter_key")
      .eq("business_id", data.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const reports = (reportsRaw ?? []) as Array<{
      id: string; minutes: number; created_at: string; reporter_key: string | null;
    }>;

    const recent = reports.filter(
      (r) => Date.now() - new Date(r.created_at).getTime() <= 60 * 60 * 1000,
    );
    const avg =
      recent.length > 0
        ? Math.round(recent.reduce((s, r) => s + r.minutes, 0) / recent.length)
        : null;
    const latest = reports[0];
    const updatedMinutesAgo = latest
      ? Math.max(0, (Date.now() - new Date(latest.created_at).getTime()) / 60_000)
      : null;

    return {
      ...(business as Record<string, unknown>),
      currentMinutes: avg,
      updatedMinutesAgo,
      contributors: recent.length,
      reports: reports.map((r) => ({
        id: r.id,
        minutes: r.minutes,
        minutesAgo: Math.max(0, (Date.now() - new Date(r.created_at).getTime()) / 60_000),
        contributor: (r.reporter_key ?? "anon").slice(0, 2).toUpperCase(),
      })),
    };
  });

// ---------------------------------------------------------------------------
// Submit a wait-time report
// ---------------------------------------------------------------------------
export const submitWaitReport = createServerFn({ method: "POST" })
  .inputValidator((data: { businessId: string; minutes: number; reporterKey: string }) => {
    const id = String(data?.businessId ?? "");
    const m = Number(data?.minutes);
    const key = String(data?.reporterKey ?? "").slice(0, 64);
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid business id");
    if (!Number.isFinite(m) || m < 0 || m > 240) throw new Error("Invalid wait time");
    return { businessId: id, minutes: Math.round(m), reporterKey: key };
  })
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("wait_reports").insert({
      business_id: data.businessId,
      minutes: data.minutes,
      reporter_key: data.reporterKey || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Look up favorites by id (for the Favorites page)
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
      .select("id, google_place_id, name, address, city, state, zip, lat, lng, category, phone")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
