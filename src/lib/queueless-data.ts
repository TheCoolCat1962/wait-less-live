// Static reference data + pure helpers. All live business data now lives in
// the Cloud database and is fetched via `queueless.functions.ts`.

export type WaitLevel = "none" | "short" | "medium" | "long" | "very_long";

export const WAIT_OPTIONS: Array<{
  level: WaitLevel;
  label: string;
  range: string;
  minutes: number;
  tone: "safe" | "caution" | "danger";
}> = [
  { level: "none", label: "No wait", range: "0–5 min", minutes: 3, tone: "safe" },
  { level: "short", label: "Short", range: "5–15 min", minutes: 10, tone: "safe" },
  { level: "medium", label: "Medium", range: "15–30 min", minutes: 22, tone: "caution" },
  { level: "long", label: "Long", range: "30–60 min", minutes: 45, tone: "danger" },
  { level: "very_long", label: "Very long", range: "60+ min", minutes: 75, tone: "danger" },
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
  phone: string | null;
}

export interface WaitReport {
  id: string;
  minutes: number;
  minutesAgo: number;
  contributor: string;
}

export interface BusinessWithWait extends Business {
  currentMinutes: number | null;
  updatedMinutesAgo: number | null;
  contributors: number;
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

export function emojiForCategory(category: string): string {
  const key = category.toLowerCase();
  if (key.includes("grocery") || key.includes("supermarket")) return "🛒";
  if (key.includes("coffee") || key.includes("cafe")) return "☕";
  if (key.includes("pharma") || key.includes("drug")) return "💊";
  if (key.includes("bank") || key.includes("atm")) return "🏦";
  if (key.includes("gym") || key.includes("fitness")) return "🏋️";
  if (key.includes("dmv") || key.includes("government") || key.includes("city_hall")) return "🪪";
  if (key.includes("post")) return "📮";
  if (key.includes("bar") || key.includes("pub")) return "🍺";
  if (key.includes("restaurant") || key.includes("meal") || key.includes("food")) return "🍽️";
  if (key.includes("store") || key.includes("shop") || key.includes("retail")) return "🏬";
  if (key.includes("hospital") || key.includes("clinic") || key.includes("doctor")) return "🏥";
  if (key.includes("gas")) return "⛽";
  return "📍";
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

// Local reporter fingerprint — used so users can't spam their own reports
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
