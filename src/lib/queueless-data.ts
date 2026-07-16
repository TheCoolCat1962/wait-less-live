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
  { level: "short", label: "5–15 min", range: "Short line", minutes: 10, emoji: "🟡", tone: "caution" },
  { level: "medium", label: "15–30 min", range: "Moderate", minutes: 22, emoji: "🟠", tone: "warn" },
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
  supermarket: "🛒", grocery_store: "🛒",
  convenience_store: "🏪",
  department_store: "🏬", discount_store: "🏬", shopping_mall: "🏬",
  warehouse_store: "📦", wholesaler: "📦",
  clothing_store: "🛍️", shoe_store: "👟", electronics_store: "🔌",
  home_improvement_store: "🔨", furniture_store: "🛋️", book_store: "📚",
  cafe: "☕", coffee_shop: "☕",
  restaurant: "🍽️", fast_food_restaurant: "🍔", meal_takeaway: "🥡",
  bakery: "🥐", sandwich_shop: "🥪", pizza_restaurant: "🍕",
  hamburger_restaurant: "🍔", ice_cream_shop: "🍦", bar: "🍺",
  bank: "🏦", atm: "🏧", post_office: "📮",
  local_government_office: "🪪", city_hall: "🏛️", courthouse: "⚖️",
  hospital: "🏥", pharmacy: "💊", drugstore: "💊", medical_lab: "🩺",
  airport: "✈️", gas_station: "⛽",
  movie_theater: "🎬", amusement_park: "🎢",
  gym: "🏋️", fitness_center: "🏋️",
};

export function emojiForBusiness(b: Pick<Business, "primary_type" | "category">): string {
  if (b.primary_type && PRIMARY_TYPE_EMOJI[b.primary_type]) return PRIMARY_TYPE_EMOJI[b.primary_type];
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
  if (key.includes("mall") || key.includes("department") || key.includes("retail") || key.includes("store")) return "🏬";
  if (key.includes("warehouse")) return "📦";
  if (key.includes("government") || key.includes("dmv")) return "🪪";
  return "📍";
}

// Legacy alias kept so any older imports keep compiling.
export function emojiForCategory(category: string): string {
  return emojiForBusiness({ primary_type: null, category });
}

// Haversine distance in miles
export function distanceMiles(a: Coords, b: Coords): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
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
