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

export type Category =
  | "Grocery"
  | "Coffee"
  | "Restaurant"
  | "Pharmacy"
  | "DMV"
  | "Bank"
  | "Gym"
  | "Government";

export interface WaitReport {
  id: string;
  level: WaitLevel;
  minutes: number;
  minutesAgo: number;
  contributor: string;
}

export interface Business {
  id: string;
  name: string;
  category: Category;
  address: string;
  city: string;
  distanceMi: number;
  hours: string;
  emoji: string;
  currentMinutes: number;
  updatedMinutesAgo: number;
  contributors: number;
  blurb: string;
  reports: WaitReport[];
}

export const CATEGORIES: Category[] = [
  "Grocery",
  "Coffee",
  "Restaurant",
  "Pharmacy",
  "DMV",
  "Bank",
  "Gym",
  "Government",
];

export const BUSINESSES: Business[] = [
  {
    id: "rouses-magazine",
    name: "Rouses Market",
    category: "Grocery",
    address: "701 Baronne St",
    city: "New Orleans",
    distanceMi: 0.4,
    hours: "7:00 AM – 10:00 PM",
    emoji: "🛒",
    currentMinutes: 4,
    updatedMinutesAgo: 2,
    contributors: 34,
    blurb: "Very quiet · Fast checkout",
    reports: [
      { id: "r1", level: "none", minutes: 4, minutesAgo: 2, contributor: "Maya" },
      { id: "r2", level: "short", minutes: 8, minutesAgo: 14, contributor: "Jordan" },
      { id: "r3", level: "none", minutes: 3, minutesAgo: 26, contributor: "Priya" },
    ],
  },
  {
    id: "cc-magazine",
    name: "CC's Coffee House",
    category: "Coffee",
    address: "900 Jefferson St",
    city: "Lafayette",
    distanceMi: 0.1,
    hours: "6:00 AM – 8:00 PM",
    emoji: "☕",
    currentMinutes: 18,
    updatedMinutesAgo: 8,
    contributors: 51,
    blurb: "Busy · Morning rush",
    reports: [
      { id: "r1", level: "medium", minutes: 18, minutesAgo: 8, contributor: "Sam" },
      { id: "r2", level: "medium", minutes: 22, minutesAgo: 21, contributor: "Alex" },
      { id: "r3", level: "short", minutes: 12, minutesAgo: 44, contributor: "Rae" },
    ],
  },
  {
    id: "usps-baton-rouge",
    name: "US Postal Service",
    category: "Government",
    address: "750 Florida Blvd",
    city: "Baton Rouge",
    distanceMi: 1.2,
    hours: "9:00 AM – 5:00 PM",
    emoji: "📮",
    currentMinutes: 55,
    updatedMinutesAgo: 14,
    contributors: 22,
    blurb: "Very busy · 2 windows open",
    reports: [
      { id: "r1", level: "long", minutes: 55, minutesAgo: 14, contributor: "Chris" },
      { id: "r2", level: "long", minutes: 48, minutesAgo: 32, contributor: "Devon" },
    ],
  },
  {
    id: "walgreens-veterans",
    name: "Walgreens Pharmacy",
    category: "Pharmacy",
    address: "3100 Veterans Blvd",
    city: "Metairie",
    distanceMi: 0.7,
    hours: "8:00 AM – 10:00 PM",
    emoji: "💊",
    currentMinutes: 2,
    updatedMinutesAgo: 22,
    contributors: 12,
    blurb: "Empty · Ready for pickup",
    reports: [
      { id: "r1", level: "none", minutes: 2, minutesAgo: 22, contributor: "Lee" },
      { id: "r2", level: "none", minutes: 4, minutesAgo: 61, contributor: "Nina" },
    ],
  },
  {
    id: "popeyes-canal",
    name: "Popeyes Louisiana Kitchen",
    category: "Restaurant",
    address: "1201 Canal St",
    city: "New Orleans",
    distanceMi: 0.5,
    hours: "10:00 AM – 11:00 PM",
    emoji: "🍗",
    currentMinutes: 12,
    updatedMinutesAgo: 6,
    contributors: 40,
    blurb: "Steady lunch line",
    reports: [
      { id: "r1", level: "short", minutes: 12, minutesAgo: 6, contributor: "Owen" },
      { id: "r2", level: "medium", minutes: 20, minutesAgo: 28, contributor: "Kai" },
    ],
  },
  {
    id: "capital-one-shreveport",
    name: "Capital One Bank",
    category: "Bank",
    address: "400 Texas St",
    city: "Shreveport",
    distanceMi: 0.9,
    hours: "9:00 AM – 5:00 PM",
    emoji: "🏦",
    currentMinutes: 25,
    updatedMinutesAgo: 11,
    contributors: 18,
    blurb: "Moderate · 3 tellers",
    reports: [
      { id: "r1", level: "medium", minutes: 25, minutesAgo: 11, contributor: "Ivy" },
    ],
  },
  {
    id: "planet-fitness-lakecharles",
    name: "Planet Fitness",
    category: "Gym",
    address: "3416 Ryan St",
    city: "Lake Charles",
    distanceMi: 0.6,
    hours: "Open 24 hours",
    emoji: "🏋️",
    currentMinutes: 8,
    updatedMinutesAgo: 4,
    contributors: 29,
    blurb: "Free racks available",
    reports: [
      { id: "r1", level: "short", minutes: 8, minutesAgo: 4, contributor: "Theo" },
      { id: "r2", level: "short", minutes: 10, minutesAgo: 19, contributor: "Val" },
    ],
  },
  {
    id: "omv-baton-rouge",
    name: "Louisiana OMV",
    category: "DMV",
    address: "7701 Independence Blvd",
    city: "Baton Rouge",
    distanceMi: 1.4,
    hours: "8:00 AM – 4:30 PM",
    emoji: "🪪",
    currentMinutes: 62,
    updatedMinutesAgo: 3,
    contributors: 46,
    blurb: "Peak hour · Bring a book",
    reports: [
      { id: "r1", level: "very_long", minutes: 62, minutesAgo: 3, contributor: "Reese" },
      { id: "r2", level: "long", minutes: 55, minutesAgo: 24, contributor: "Quinn" },
    ],
  },
  {
    id: "winn-dixie-monroe",
    name: "Winn-Dixie",
    category: "Grocery",
    address: "2701 Louisville Ave",
    city: "Monroe",
    distanceMi: 2.1,
    hours: "7:00 AM – 10:00 PM",
    emoji: "🛒",
    currentMinutes: 9,
    updatedMinutesAgo: 12,
    contributors: 15,
    blurb: "Short lines · Self-checkout open",
    reports: [
      { id: "r1", level: "short", minutes: 9, minutesAgo: 12, contributor: "Cam" },
    ],
  },
  {
    id: "cafe-du-monde",
    name: "Café du Monde",
    category: "Restaurant",
    address: "800 Decatur St",
    city: "New Orleans",
    distanceMi: 0.8,
    hours: "Open 24 hours",
    emoji: "🥐",
    currentMinutes: 35,
    updatedMinutesAgo: 5,
    contributors: 88,
    blurb: "Tourist rush · Beignets flying",
    reports: [
      { id: "r1", level: "long", minutes: 35, minutesAgo: 5, contributor: "Tasha" },
      { id: "r2", level: "medium", minutes: 28, minutesAgo: 18, contributor: "Marc" },
    ],
  },
];

export function toneFromMinutes(min: number): "safe" | "caution" | "danger" {
  if (min <= 15) return "safe";
  if (min <= 30) return "caution";
  return "danger";
}

export function crowdLabel(min: number): string {
  if (min <= 5) return "Very quiet";
  if (min <= 15) return "Light crowd";
  if (min <= 30) return "Moderate";
  if (min <= 60) return "Busy";
  return "Very busy";
}

export function getBusiness(id: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}

export function formatUpdated(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${Math.round(min)}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}
