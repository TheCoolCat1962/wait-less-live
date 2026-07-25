// Static reference data + pure helpers. All live business data lives in
// the Cloud database and is fetched via `queueless.functions.ts`.

export type WaitLevel = "none" | "short" | "medium" | "long";
export type ReportSource = "quick" | "exact" | "timer";
export type Trend = "up" | "down" | "stable";

export const WAIT_OPTIONS: Array<{
  level: WaitLevel;
  label: string;
  range: string;
  minutes: number;
  emoji: string;
  tone: "safe" | "caution" | "warn" | "danger";
}> = [
  { level: "none", label: "0–5 min", range: "No wait", minutes: 3, emoji: "🟢", tone: "safe" },
  {
    level: "short",
    label: "5–15 min",
    range: "Short line",
    minutes: 10,
    emoji: "🟡",
    tone: "caution",
  },
  {
    level: "medium",
    label: "15–30 min",
    range: "Moderate",
    minutes: 22,
    emoji: "🟠",
    tone: "warn",
  },
  { level: "long", label: "30+ min", range: "Long wait", minutes: 45, emoji: "🔴", tone: "danger" },
];

export interface Coords {
  lat: number;
  lng: number;
}

export interface Business {
  id: string;
  google_place_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number;
  lng: number;
  category: string;
  primary_type?: string | null;
  phone: string | null;
  logo_url?: string | null;
}

export interface BusinessWithWait extends Business {
  currentMinutes: number | null;
  updatedMinutesAgo: number | null;
  contributors: number;
  trend?: Trend;
  distanceMi?: number;
}

// ---------- helpers ----------

export function toneFromMinutes(m: number | null): "safe" | "caution" | "danger" | "neutral" {
  if (m == null) return "neutral";
  if (m <= 10) return "safe";
  if (m <= 25) return "caution";
  return "danger";
}

export function crowdLabel(m: number | null): string {
  if (m == null) return "No reports yet";
  if (m <= 5) return "No wait";
  if (m <= 15) return "Short line";
  if (m <= 30) return "Moderate wait";
  if (m <= 60) return "Long wait";
  return "Very long wait";
}

export function formatUpdated(minutesAgo: number | null): string {
  if (minutesAgo == null) return "no reports";
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${Math.round(minutesAgo)} min ago`;
  const h = Math.floor(minutesAgo / 60);
  return `${h}h ago`;
}

export function trendLabel(t: Trend | undefined): { icon: string; label: string; tone: string } {
  if (t === "up") return { icon: "📈", label: "Getting busier", tone: "text-danger" };
  if (t === "down") return { icon: "📉", label: "Getting shorter", tone: "text-safe" };
  return { icon: "➖", label: "Stable", tone: "text-muted-foreground" };
}

// Emoji lookup that first honors the Google Places primary_type, then the
// app-friendly category label as a fallback.
const PRIMARY_TYPE_EMOJI: Record<string, string> = {
  supermarket: "🛒",
  grocery_store: "🛒",
  convenience_store: "🏪",
  department_store: "🏬",
  discount_store: "🏬",
  shopping_mall: "🏬",
  warehouse_store: "📦",
  wholesaler: "📦",
  clothing_store: "🛍️",
  shoe_store: "👟",
  electronics_store: "🔌",
  home_improvement_store: "🔨",
  furniture_store: "🛋️",
  book_store: "📚",
  cafe: "☕",
  coffee_shop: "☕",
  restaurant: "🍽️",
  fast_food_restaurant: "🍔",
  meal_takeaway: "🥡",
  bakery: "🥐",
  sandwich_shop: "🥪",
  pizza_restaurant: "🍕",
  hamburger_restaurant: "🍔",
  ice_cream_shop: "🍦",
  bar: "🍺",
  bank: "🏦",
  atm: "🏧",
  post_office: "📮",
  local_government_office: "🪪",
  city_hall: "🏛️",
  courthouse: "⚖️",
  hospital: "🏥",
  pharmacy: "💊",
  drugstore: "💊",
  medical_lab: "🩺",
  airport: "✈️",
  gas_station: "⛽",
  movie_theater: "🎬",
  amusement_park: "🎢",
  gym: "🏋️",
  fitness_center: "🏋️",
};

// Category-specific gradient colors for placeholder backgrounds
const PRIMARY_TYPE_GRADIENT: Record<string, { from: string; to: string }> = {
  supermarket: { from: "from-emerald-500/20", to: "to-emerald-600/10" },
  grocery_store: { from: "from-emerald-500/20", to: "to-emerald-600/10" },
  convenience_store: { from: "from-orange-500/20", to: "to-orange-600/10" },
  department_store: { from: "from-purple-500/20", to: "to-purple-600/10" },
  discount_store: { from: "from-blue-500/20", to: "to-blue-600/10" },
  shopping_mall: { from: "from-pink-500/20", to: "to-pink-600/10" },
  warehouse_store: { from: "from-amber-500/20", to: "to-amber-600/10" },
  clothing_store: { from: "from-rose-500/20", to: "to-rose-600/10" },
  shoe_store: { from: "from-indigo-500/20", to: "to-indigo-600/10" },
  electronics_store: { from: "from-cyan-500/20", to: "to-cyan-600/10" },
  home_improvement_store: { from: "from-orange-500/20", to: "to-orange-600/10" },
  furniture_store: { from: "from-yellow-500/20", to: "to-yellow-600/10" },
  book_store: { from: "from-amber-500/20", to: "to-amber-600/10" },
  cafe: { from: "from-amber-500/20", to: "to-amber-600/10" },
  coffee_shop: { from: "from-amber-500/20", to: "to-amber-600/10" },
  restaurant: { from: "from-red-500/20", to: "to-red-600/10" },
  fast_food_restaurant: { from: "from-yellow-500/20", to: "to-yellow-600/10" },
  meal_takeaway: { from: "from-orange-500/20", to: "to-orange-600/10" },
  bakery: { from: "from-amber-500/20", to: "to-amber-600/10" },
  sandwich_shop: { from: "from-green-500/20", to: "to-green-600/10" },
  pizza_restaurant: { from: "from-red-500/20", to: "to-red-600/10" },
  hamburger_restaurant: { from: "from-yellow-500/20", to: "to-yellow-600/10" },
  ice_cream_shop: { from: "from-pink-500/20", to: "to-pink-600/10" },
  bar: { from: "from-purple-500/20", to: "to-purple-600/10" },
  bank: { from: "from-slate-500/20", to: "to-slate-600/10" },
  atm: { from: "from-slate-500/20", to: "to-slate-600/10" },
  post_office: { from: "from-blue-500/20", to: "to-blue-600/10" },
  local_government_office: { from: "from-slate-500/20", to: "to-slate-600/10" },
  city_hall: { from: "from-slate-500/20", to: "to-slate-600/10" },
  courthouse: { from: "from-slate-500/20", to: "to-slate-600/10" },
  hospital: { from: "from-red-500/20", to: "to-red-600/10" },
  pharmacy: { from: "from-blue-500/20", to: "to-blue-600/10" },
  drugstore: { from: "from-blue-500/20", to: "to-blue-600/10" },
  medical_lab: { from: "from-teal-500/20", to: "to-teal-600/10" },
  airport: { from: "from-sky-500/20", to: "to-sky-600/10" },
  gas_station: { from: "from-gray-500/20", to: "to-gray-600/10" },
  movie_theater: { from: "from-indigo-500/20", to: "to-indigo-600/10" },
  amusement_park: { from: "from-violet-500/20", to: "to-violet-600/10" },
  gym: { from: "from-orange-500/20", to: "to-orange-600/10" },
  fitness_center: { from: "from-orange-500/20", to: "to-orange-600/10" },
};

export function gradientForBusiness(b: Pick<Business, "primary_type" | "category">): {
  from: string;
  to: string;
} {
  // Check primary type first
  if (b.primary_type && PRIMARY_TYPE_GRADIENT[b.primary_type]) {
    return PRIMARY_TYPE_GRADIENT[b.primary_type];
  }
  // Fall back to category
  const key = (b.category ?? "").toLowerCase();
  if (key.includes("grocery")) return { from: "from-emerald-500/20", to: "to-emerald-600/10" };
  if (key.includes("coffee") || key.includes("cafe"))
    return { from: "from-amber-500/20", to: "to-amber-600/10" };
  if (key.includes("fast food") || key.includes("burger"))
    return { from: "from-yellow-500/20", to: "to-yellow-600/10" };
  if (key.includes("pizza")) return { from: "from-red-500/20", to: "to-red-600/10" };
  if (key.includes("restaurant") || key.includes("takeout") || key.includes("food"))
    return { from: "from-red-500/20", to: "to-red-600/10" };
  if (key.includes("pharmacy")) return { from: "from-blue-500/20", to: "to-blue-600/10" };
  if (key.includes("bank")) return { from: "from-slate-500/20", to: "to-slate-600/10" };
  if (key.includes("hospital") || key.includes("urgent"))
    return { from: "from-red-500/20", to: "to-red-600/10" };
  if (
    key.includes("mall") ||
    key.includes("department") ||
    key.includes("retail") ||
    key.includes("store")
  )
    return { from: "from-purple-500/20", to: "to-purple-600/10" };
  // Default fallback
  return { from: "from-brand/15", to: "to-surface-muted" };
}

export function emojiForBusiness(b: Pick<Business, "primary_type" | "category">): string {
  if (b.primary_type && PRIMARY_TYPE_EMOJI[b.primary_type])
    return PRIMARY_TYPE_EMOJI[b.primary_type];
  const key = (b.category ?? "").toLowerCase();
  if (key.includes("grocery")) return "🛒";
  if (key.includes("coffee")) return "☕";
  if (key.includes("fast food") || key.includes("burger")) return "🍔";
  if (key.includes("pizza")) return "🍕";
  if (key.includes("restaurant") || key.includes("takeout") || key.includes("food")) return "🍽️";
  if (key.includes("pharmacy")) return "💊";
  if (key.includes("bank")) return "🏦";
  if (key.includes("hospital") || key.includes("urgent")) return "🏥";
  if (key.includes("post")) return "📮";
  if (key.includes("airport")) return "✈️";
  if (key.includes("gas")) return "⛽";
  if (key.includes("movie")) return "🎬";
  if (key.includes("theme") || key.includes("park")) return "🎢";
  if (key.includes("gym") || key.includes("fitness")) return "🏋️";
  if (
    key.includes("mall") ||
    key.includes("department") ||
    key.includes("retail") ||
    key.includes("store")
  )
    return "🏬";
  if (key.includes("warehouse")) return "📦";
  if (key.includes("government") || key.includes("dmv")) return "🪪";
  return "📍";
}

// Legacy alias kept so any older imports keep compiling.
export function emojiForCategory(category: string): string {
  return emojiForBusiness({ primary_type: null, category });
}

// Cached Google Places photo URLs bake in a size (maxWidthPx). Reuse the cached
// reference but request the width we actually render — small for cards, larger
// for detail heroes — so we stay crisp without any extra Places API lookups.
export function photoUrlForWidth(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  return /maxWidthPx=\d+/.test(url)
    ? url.replace(/maxWidthPx=\d+/, `maxWidthPx=${Math.round(width)}`)
    : url;
}

// Haversine distance in miles
export function distanceMiles(a: Coords, b: Coords): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getReporterKey(): string {
  if (typeof window === "undefined") return "ssr";
  const k = "queueless.reporter.v1";
  let v = window.localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    window.localStorage.setItem(k, v);
  }
  return v;
}
