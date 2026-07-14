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

export interface Coords {
  lat: number;
  lng: number;
}

export interface Business {
  id: string;
  name: string;
  category: Category;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
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

// US cities anchor coordinates (used for zip/city fallback lookups)
export const US_CITIES: Record<string, { label: string; coords: Coords }> = {
  "new york": { label: "New York, NY", coords: { lat: 40.7506, lng: -73.9972 } },
  "nyc": { label: "New York, NY", coords: { lat: 40.7506, lng: -73.9972 } },
  "manhattan": { label: "Manhattan, NY", coords: { lat: 40.7831, lng: -73.9712 } },
  "brooklyn": { label: "Brooklyn, NY", coords: { lat: 40.6782, lng: -73.9442 } },
  "los angeles": { label: "Los Angeles, CA", coords: { lat: 34.0522, lng: -118.2437 } },
  "la": { label: "Los Angeles, CA", coords: { lat: 34.0522, lng: -118.2437 } },
  "san francisco": { label: "San Francisco, CA", coords: { lat: 37.7749, lng: -122.4194 } },
  "sf": { label: "San Francisco, CA", coords: { lat: 37.7749, lng: -122.4194 } },
  "chicago": { label: "Chicago, IL", coords: { lat: 41.8781, lng: -87.6298 } },
  "houston": { label: "Houston, TX", coords: { lat: 29.7604, lng: -95.3698 } },
  "dallas": { label: "Dallas, TX", coords: { lat: 32.7767, lng: -96.7970 } },
  "austin": { label: "Austin, TX", coords: { lat: 30.2672, lng: -97.7431 } },
  "miami": { label: "Miami, FL", coords: { lat: 25.7617, lng: -80.1918 } },
  "atlanta": { label: "Atlanta, GA", coords: { lat: 33.7490, lng: -84.3880 } },
  "boston": { label: "Boston, MA", coords: { lat: 42.3601, lng: -71.0589 } },
  "seattle": { label: "Seattle, WA", coords: { lat: 47.6062, lng: -122.3321 } },
  "denver": { label: "Denver, CO", coords: { lat: 39.7392, lng: -104.9903 } },
  "phoenix": { label: "Phoenix, AZ", coords: { lat: 33.4484, lng: -112.0740 } },
  "washington": { label: "Washington, DC", coords: { lat: 38.9072, lng: -77.0369 } },
  "dc": { label: "Washington, DC", coords: { lat: 38.9072, lng: -77.0369 } },
  "philadelphia": { label: "Philadelphia, PA", coords: { lat: 39.9526, lng: -75.1652 } },
  "philly": { label: "Philadelphia, PA", coords: { lat: 39.9526, lng: -75.1652 } },
};

// Approximate coords by ZIP3 prefix — anchors ZIP codes to the nearest metro.
export const ZIP3_COORDS: Record<string, { label: string; coords: Coords }> = {
  "100": { label: "New York, NY", coords: { lat: 40.7506, lng: -73.9972 } },
  "101": { label: "New York, NY", coords: { lat: 40.7506, lng: -73.9972 } },
  "112": { label: "Brooklyn, NY", coords: { lat: 40.6782, lng: -73.9442 } },
  "021": { label: "Boston, MA", coords: { lat: 42.3601, lng: -71.0589 } },
  "022": { label: "Boston, MA", coords: { lat: 42.3601, lng: -71.0589 } },
  "191": { label: "Philadelphia, PA", coords: { lat: 39.9526, lng: -75.1652 } },
  "200": { label: "Washington, DC", coords: { lat: 38.9072, lng: -77.0369 } },
  "303": { label: "Atlanta, GA", coords: { lat: 33.7490, lng: -84.3880 } },
  "331": { label: "Miami, FL", coords: { lat: 25.7617, lng: -80.1918 } },
  "606": { label: "Chicago, IL", coords: { lat: 41.8781, lng: -87.6298 } },
  "752": { label: "Dallas, TX", coords: { lat: 32.7767, lng: -96.7970 } },
  "770": { label: "Houston, TX", coords: { lat: 29.7604, lng: -95.3698 } },
  "787": { label: "Austin, TX", coords: { lat: 30.2672, lng: -97.7431 } },
  "802": { label: "Denver, CO", coords: { lat: 39.7392, lng: -104.9903 } },
  "850": { label: "Phoenix, AZ", coords: { lat: 33.4484, lng: -112.0740 } },
  "900": { label: "Los Angeles, CA", coords: { lat: 34.0522, lng: -118.2437 } },
  "941": { label: "San Francisco, CA", coords: { lat: 37.7749, lng: -122.4194 } },
  "981": { label: "Seattle, WA", coords: { lat: 47.6062, lng: -122.3321 } },
};

// Helper to jitter a base coord by ~ a few blocks
const j = (base: number, meters: number) => base + meters / 111_000;

export const BUSINESSES: Business[] = [
  // New York
  {
    id: "trader-joes-chelsea",
    name: "Trader Joe's",
    category: "Grocery",
    address: "675 6th Ave",
    city: "New York", state: "NY", zip: "10010",
    lat: 40.7414, lng: -73.9932,
    hours: "8:00 AM – 10:00 PM", emoji: "🛒",
    currentMinutes: 12, updatedMinutesAgo: 4, contributors: 88,
    blurb: "Steady checkout line",
    reports: [
      { id: "r1", level: "short", minutes: 12, minutesAgo: 4, contributor: "Maya" },
      { id: "r2", level: "medium", minutes: 20, minutesAgo: 22, contributor: "Jordan" },
    ],
  },
  {
    id: "starbucks-times-sq",
    name: "Starbucks Reserve",
    category: "Coffee",
    address: "1500 Broadway",
    city: "New York", state: "NY", zip: "10036",
    lat: 40.7580, lng: -73.9855,
    hours: "5:30 AM – 11:00 PM", emoji: "☕",
    currentMinutes: 28, updatedMinutesAgo: 3, contributors: 142,
    blurb: "Tourist rush · Order ahead",
    reports: [
      { id: "r1", level: "medium", minutes: 28, minutesAgo: 3, contributor: "Alex" },
      { id: "r2", level: "long", minutes: 35, minutesAgo: 18, contributor: "Sam" },
    ],
  },
  {
    id: "nyc-dmv-herald",
    name: "NY DMV — Herald Square",
    category: "DMV",
    address: "1293 Broadway",
    city: "New York", state: "NY", zip: "10001",
    lat: 40.7484, lng: -73.9878,
    hours: "8:30 AM – 4:00 PM", emoji: "🪪",
    currentMinutes: 72, updatedMinutesAgo: 6, contributors: 61,
    blurb: "Very busy · Bring a book",
    reports: [
      { id: "r1", level: "very_long", minutes: 72, minutesAgo: 6, contributor: "Chris" },
    ],
  },
  // Brooklyn
  {
    id: "wholefoods-gowanus",
    name: "Whole Foods Market",
    category: "Grocery",
    address: "214 3rd St",
    city: "Brooklyn", state: "NY", zip: "11215",
    lat: 40.6740, lng: -73.9860,
    hours: "7:00 AM – 10:00 PM", emoji: "🛒",
    currentMinutes: 5, updatedMinutesAgo: 8, contributors: 44,
    blurb: "Light crowd right now",
    reports: [{ id: "r1", level: "short", minutes: 5, minutesAgo: 8, contributor: "Priya" }],
  },
  // Los Angeles
  {
    id: "ralphs-downtown-la",
    name: "Ralphs Fresh Fare",
    category: "Grocery",
    address: "645 W 9th St",
    city: "Los Angeles", state: "CA", zip: "90015",
    lat: 34.0446, lng: -118.2600,
    hours: "6:00 AM – 1:00 AM", emoji: "🛒",
    currentMinutes: 8, updatedMinutesAgo: 5, contributors: 51,
    blurb: "3 registers open",
    reports: [{ id: "r1", level: "short", minutes: 8, minutesAgo: 5, contributor: "Diego" }],
  },
  {
    id: "cvs-hollywood",
    name: "CVS Pharmacy",
    category: "Pharmacy",
    address: "6360 W Sunset Blvd",
    city: "Los Angeles", state: "CA", zip: "90028",
    lat: 34.0980, lng: -118.3287,
    hours: "24 hours", emoji: "💊",
    currentMinutes: 18, updatedMinutesAgo: 11, contributors: 22,
    blurb: "One pharmacist on shift",
    reports: [{ id: "r1", level: "medium", minutes: 18, minutesAgo: 11, contributor: "Lee" }],
  },
  {
    id: "ca-dmv-hollywood",
    name: "CA DMV — Hollywood",
    category: "DMV",
    address: "803 Cole Ave",
    city: "Los Angeles", state: "CA", zip: "90038",
    lat: 34.0899, lng: -118.3273,
    hours: "8:00 AM – 5:00 PM", emoji: "🪪",
    currentMinutes: 95, updatedMinutesAgo: 2, contributors: 78,
    blurb: "Peak hour · appointments only fast",
    reports: [{ id: "r1", level: "very_long", minutes: 95, minutesAgo: 2, contributor: "Reese" }],
  },
  // San Francisco
  {
    id: "blue-bottle-mint",
    name: "Blue Bottle Coffee",
    category: "Coffee",
    address: "66 Mint Plaza",
    city: "San Francisco", state: "CA", zip: "94103",
    lat: 37.7826, lng: -122.4082,
    hours: "6:30 AM – 6:00 PM", emoji: "☕",
    currentMinutes: 15, updatedMinutesAgo: 4, contributors: 63,
    blurb: "Morning rush winding down",
    reports: [{ id: "r1", level: "medium", minutes: 15, minutesAgo: 4, contributor: "Rae" }],
  },
  {
    id: "safeway-market-sf",
    name: "Safeway",
    category: "Grocery",
    address: "2020 Market St",
    city: "San Francisco", state: "CA", zip: "94114",
    lat: 37.7688, lng: -122.4290,
    hours: "5:00 AM – 12:00 AM", emoji: "🛒",
    currentMinutes: 4, updatedMinutesAgo: 12, contributors: 39,
    blurb: "Empty · Fast in-out",
    reports: [{ id: "r1", level: "none", minutes: 4, minutesAgo: 12, contributor: "Nina" }],
  },
  // Chicago
  {
    id: "jewel-osco-loop",
    name: "Jewel-Osco",
    category: "Grocery",
    address: "1224 S Wabash Ave",
    city: "Chicago", state: "IL", zip: "60605",
    lat: 41.8672, lng: -87.6259,
    hours: "6:00 AM – 11:00 PM", emoji: "🛒",
    currentMinutes: 10, updatedMinutesAgo: 6, contributors: 47,
    blurb: "Self checkout open",
    reports: [{ id: "r1", level: "short", minutes: 10, minutesAgo: 6, contributor: "Owen" }],
  },
  {
    id: "portillos-river-north",
    name: "Portillo's",
    category: "Restaurant",
    address: "100 W Ontario St",
    city: "Chicago", state: "IL", zip: "60654",
    lat: 41.8934, lng: -87.6305,
    hours: "10:00 AM – 12:00 AM", emoji: "🌭",
    currentMinutes: 22, updatedMinutesAgo: 3, contributors: 91,
    blurb: "Lunch rush · Drive-thru faster",
    reports: [{ id: "r1", level: "medium", minutes: 22, minutesAgo: 3, contributor: "Kai" }],
  },
  // Houston
  {
    id: "heb-montrose",
    name: "H-E-B",
    category: "Grocery",
    address: "1701 W Alabama St",
    city: "Houston", state: "TX", zip: "77098",
    lat: 29.7412, lng: -95.4009,
    hours: "6:00 AM – 12:00 AM", emoji: "🛒",
    currentMinutes: 6, updatedMinutesAgo: 9, contributors: 55,
    blurb: "Fast checkout",
    reports: [{ id: "r1", level: "short", minutes: 6, minutesAgo: 9, contributor: "Val" }],
  },
  {
    id: "chase-downtown-hou",
    name: "Chase Bank",
    category: "Bank",
    address: "712 Main St",
    city: "Houston", state: "TX", zip: "77002",
    lat: 29.7591, lng: -95.3646,
    hours: "9:00 AM – 5:00 PM", emoji: "🏦",
    currentMinutes: 20, updatedMinutesAgo: 14, contributors: 18,
    blurb: "2 tellers open",
    reports: [{ id: "r1", level: "medium", minutes: 20, minutesAgo: 14, contributor: "Ivy" }],
  },
  // Dallas
  {
    id: "kroger-uptown-dal",
    name: "Kroger",
    category: "Grocery",
    address: "4142 Cedar Springs Rd",
    city: "Dallas", state: "TX", zip: "75219",
    lat: 32.8115, lng: -96.8117,
    hours: "6:00 AM – 1:00 AM", emoji: "🛒",
    currentMinutes: 14, updatedMinutesAgo: 7, contributors: 33,
    blurb: "Moderate crowd",
    reports: [{ id: "r1", level: "short", minutes: 14, minutesAgo: 7, contributor: "Theo" }],
  },
  // Austin
  {
    id: "franklin-bbq",
    name: "Franklin Barbecue",
    category: "Restaurant",
    address: "900 E 11th St",
    city: "Austin", state: "TX", zip: "78702",
    lat: 30.2701, lng: -97.7313,
    hours: "11:00 AM – 3:00 PM", emoji: "🍖",
    currentMinutes: 110, updatedMinutesAgo: 5, contributors: 210,
    blurb: "Legendary line · Get here early",
    reports: [{ id: "r1", level: "very_long", minutes: 110, minutesAgo: 5, contributor: "Quinn" }],
  },
  // Miami
  {
    id: "publix-brickell",
    name: "Publix Super Market",
    category: "Grocery",
    address: "1050 Brickell Ave",
    city: "Miami", state: "FL", zip: "33131",
    lat: 25.7616, lng: -80.1907,
    hours: "7:00 AM – 10:00 PM", emoji: "🛒",
    currentMinutes: 9, updatedMinutesAgo: 6, contributors: 41,
    blurb: "Light lunch crowd",
    reports: [{ id: "r1", level: "short", minutes: 9, minutesAgo: 6, contributor: "Sofia" }],
  },
  {
    id: "walgreens-south-beach",
    name: "Walgreens",
    category: "Pharmacy",
    address: "1101 5th St",
    city: "Miami Beach", state: "FL", zip: "33139",
    lat: 25.7772, lng: -80.1373,
    hours: "24 hours", emoji: "💊",
    currentMinutes: 3, updatedMinutesAgo: 22, contributors: 12,
    blurb: "Empty · Pickup ready",
    reports: [{ id: "r1", level: "none", minutes: 3, minutesAgo: 22, contributor: "Ana" }],
  },
  // Atlanta
  {
    id: "publix-midtown-atl",
    name: "Publix",
    category: "Grocery",
    address: "595 Piedmont Ave NE",
    city: "Atlanta", state: "GA", zip: "30308",
    lat: 33.7737, lng: -84.3782,
    hours: "7:00 AM – 10:00 PM", emoji: "🛒",
    currentMinutes: 11, updatedMinutesAgo: 8, contributors: 36,
    blurb: "Steady evening line",
    reports: [{ id: "r1", level: "short", minutes: 11, minutesAgo: 8, contributor: "Devon" }],
  },
  {
    id: "planet-fitness-atl",
    name: "Planet Fitness",
    category: "Gym",
    address: "525 Ponce De Leon Ave NE",
    city: "Atlanta", state: "GA", zip: "30308",
    lat: 33.7736, lng: -84.3651,
    hours: "5:00 AM – 12:00 AM", emoji: "🏋️",
    currentMinutes: 4, updatedMinutesAgo: 10, contributors: 27,
    blurb: "Racks free · Cardio open",
    reports: [{ id: "r1", level: "none", minutes: 4, minutesAgo: 10, contributor: "Terrence" }],
  },
  // Boston
  {
    id: "dunkin-downtown-bos",
    name: "Dunkin'",
    category: "Coffee",
    address: "125 Summer St",
    city: "Boston", state: "MA", zip: "02110",
    lat: 42.3529, lng: -71.0555,
    hours: "5:00 AM – 8:00 PM", emoji: "☕",
    currentMinutes: 7, updatedMinutesAgo: 4, contributors: 68,
    blurb: "Quick morning line",
    reports: [{ id: "r1", level: "short", minutes: 7, minutesAgo: 4, contributor: "Colleen" }],
  },
  {
    id: "boa-boston",
    name: "Bank of America",
    category: "Bank",
    address: "100 Federal St",
    city: "Boston", state: "MA", zip: "02110",
    lat: 42.3555, lng: -71.0559,
    hours: "9:00 AM – 5:00 PM", emoji: "🏦",
    currentMinutes: 25, updatedMinutesAgo: 12, contributors: 19,
    blurb: "Only 2 tellers",
    reports: [{ id: "r1", level: "medium", minutes: 25, minutesAgo: 12, contributor: "Pat" }],
  },
  // Seattle
  {
    id: "pike-place-starbucks",
    name: "Original Starbucks",
    category: "Coffee",
    address: "1912 Pike Pl",
    city: "Seattle", state: "WA", zip: "98101",
    lat: 47.6101, lng: -122.3421,
    hours: "6:00 AM – 9:00 PM", emoji: "☕",
    currentMinutes: 45, updatedMinutesAgo: 3, contributors: 188,
    blurb: "Tourist line · Wraps the block",
    reports: [{ id: "r1", level: "long", minutes: 45, minutesAgo: 3, contributor: "Mika" }],
  },
  {
    id: "qfc-capitol-hill",
    name: "QFC",
    category: "Grocery",
    address: "417 Broadway E",
    city: "Seattle", state: "WA", zip: "98102",
    lat: 47.6229, lng: -122.3209,
    hours: "6:00 AM – 12:00 AM", emoji: "🛒",
    currentMinutes: 6, updatedMinutesAgo: 15, contributors: 24,
    blurb: "Quiet",
    reports: [{ id: "r1", level: "short", minutes: 6, minutesAgo: 15, contributor: "Sky" }],
  },
  // Denver
  {
    id: "king-soopers-downtown",
    name: "King Soopers",
    category: "Grocery",
    address: "1750 Sherman St",
    city: "Denver", state: "CO", zip: "80203",
    lat: 39.7381, lng: -104.9848,
    hours: "5:00 AM – 12:00 AM", emoji: "🛒",
    currentMinutes: 8, updatedMinutesAgo: 7, contributors: 32,
    blurb: "Light crowd",
    reports: [{ id: "r1", level: "short", minutes: 8, minutesAgo: 7, contributor: "Rowan" }],
  },
  // Phoenix
  {
    id: "fry-food-phx",
    name: "Fry's Food Stores",
    category: "Grocery",
    address: "340 W Coronado Rd",
    city: "Phoenix", state: "AZ", zip: "85003",
    lat: 33.4646, lng: -112.0778,
    hours: "6:00 AM – 11:00 PM", emoji: "🛒",
    currentMinutes: 13, updatedMinutesAgo: 5, contributors: 29,
    blurb: "Moderate afternoon",
    reports: [{ id: "r1", level: "short", minutes: 13, minutesAgo: 5, contributor: "Beto" }],
  },
  // DC
  {
    id: "usps-dc-main",
    name: "US Postal Service",
    category: "Government",
    address: "900 Brentwood Rd NE",
    city: "Washington", state: "DC", zip: "20018",
    lat: 38.9273, lng: -76.9885,
    hours: "9:00 AM – 5:00 PM", emoji: "📮",
    currentMinutes: 38, updatedMinutesAgo: 9, contributors: 42,
    blurb: "Busy · 3 windows",
    reports: [{ id: "r1", level: "long", minutes: 38, minutesAgo: 9, contributor: "Ellis" }],
  },
  {
    id: "wholefoods-p-street",
    name: "Whole Foods Market",
    category: "Grocery",
    address: "1440 P St NW",
    city: "Washington", state: "DC", zip: "20005",
    lat: 38.9098, lng: -77.0338,
    hours: "7:00 AM – 10:00 PM", emoji: "🛒",
    currentMinutes: 16, updatedMinutesAgo: 4, contributors: 53,
    blurb: "Post-work rush",
    reports: [{ id: "r1", level: "medium", minutes: 16, minutesAgo: 4, contributor: "Sana" }],
  },
  // Philadelphia
  {
    id: "acme-center-city",
    name: "Acme Markets",
    category: "Grocery",
    address: "1400 Chestnut St",
    city: "Philadelphia", state: "PA", zip: "19102",
    lat: 39.9505, lng: -75.1650,
    hours: "6:00 AM – 12:00 AM", emoji: "🛒",
    currentMinutes: 9, updatedMinutesAgo: 11, contributors: 26,
    blurb: "Fast lanes open",
    reports: [{ id: "r1", level: "short", minutes: 9, minutesAgo: 11, contributor: "Jules" }],
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

// Haversine distance in miles
export function distanceMiles(a: Coords, b: Coords): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Try to resolve a user-typed query (zip or city) to coords + label.
export function resolveLocationQuery(
  query: string,
): { label: string; coords: Coords } | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  // 5-digit ZIP
  const zipMatch = q.match(/^(\d{5})(?:-\d{4})?$/);
  if (zipMatch) {
    const prefix = zipMatch[1].slice(0, 3);
    const hit = ZIP3_COORDS[prefix];
    if (hit) return { label: `ZIP ${zipMatch[1]} · ${hit.label}`, coords: hit.coords };
    return null;
  }
  // Strip state suffix like ", NY"
  const cityKey = q.replace(/,.*$/, "").trim();
  const hit = US_CITIES[cityKey];
  if (hit) return hit;
  // Loose contains match
  const loose = Object.entries(US_CITIES).find(([k]) => cityKey.includes(k));
  if (loose) return loose[1];
  return null;
}
// silence unused warning for helper `j` if not referenced
void j;
