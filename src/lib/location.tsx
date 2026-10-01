import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { geocodeQuery } from "./queueless.functions";
import type { Coords } from "./queueless-data";
import { useSettings } from "./settings";

export type LocationSource = "gps" | "manual";

export interface UserLocation {
  coords: Coords;
  label: string;
  source: LocationSource;
}

export type LocationStatus =
  | "loading"
  | "idle"
  | "prompting"
  | "ready"
  | "error";

interface LocationContextValue {
  status: LocationStatus;
  location: UserLocation | null;
  error: string | null;
  requestGeolocation: () => void;
  setManualLocation: (query: string) => Promise<boolean>;
  clear: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);
const STORAGE_KEY = "queueless.location.v1";

// Module-level cache for localStorage reads
let cachedRaw: string | null = null;
let cachedParsed: UserLocation | null = null;

// Read from localStorage with caching
function readStored(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Only re-parse if the raw string changed
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedParsed = raw ? (JSON.parse(raw) as UserLocation) : null;
    }
    return cachedParsed;
  } catch {
    return null;
  }
}

// Subscribers for sync external store pattern - simple void callbacks
const locationSubscribers = new Set<() => void>();

function writeStored(loc: UserLocation | null) {
  if (typeof window === "undefined") return;
  if (loc) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  else window.localStorage.removeItem(STORAGE_KEY);
  // Invalidate cache
  cachedRaw = null;
  cachedParsed = null;
  // Notify all subscribers that location changed
  locationSubscribers.forEach((cb) => cb());
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  
  // Local state for status and error (managed locally, not via useSyncExternalStore)
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Sync external store for location with SSR support
  // - getServerSnapshot returns null (matches SSR output)
  // - getSnapshot returns cached localStorage value
  // - subscribe notifies when localStorage changes externally
  const location = useSyncExternalStore(
    (callback) => {
      // Subscribe to external changes
      locationSubscribers.add(callback);
      return () => locationSubscribers.delete(callback);
    },
    () => readStored(),
    () => null // Server-side snapshot: always return null
  );

  // Sync status from location changes (via useEffect, not render-time setState)
  useEffect(() => {
    if (location && status === "idle") {
      setStatus("ready");
    }
  }, [location, status]);

  // Use ref to access current settings without recreating callbacks
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const requestGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      setStatus("error");
      return;
    }
    setStatus("prompting");
    setError(null);

    const highAccuracy = settingsRef.current.location_accuracy;
    console.log("[Location] Requesting geolocation, high accuracy:", highAccuracy);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserLocation = {
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          label: "Current location",
          source: "gps",
        };
        writeStored(loc);
        setStatus("ready");
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Could not get your location.",
        );
        setStatus("idle");
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: highAccuracy ? 120000 : 300000,
      },
    );
  }, []); // No dependencies - reads from ref

  const setManualLocation = useCallback(async (query: string) => {
    console.log("[Location] setManualLocation called with:", query);
    setStatus("prompting");
    setError(null);
    try {
      console.log("[Location] Calling geocodeQuery...");
      const resolved = await geocodeQuery({ data: { query } });
      console.log("[Location] geocodeQuery result:", resolved);
      const loc: UserLocation = {
        coords: { lat: resolved.lat, lng: resolved.lng },
        label: resolved.label,
        source: "manual",
      };
      writeStored(loc);
      setStatus("ready");
      console.log("[Location] Location set, status: ready");
      return true;
    } catch (e) {
      console.error("[Location] geocodeQuery error:", e);
      setError(e instanceof Error ? e.message : "Could not find that location.");
      setStatus("idle");
      return false;
    }
  }, []);

  const clear = useCallback(() => {
    writeStored(null);
    setStatus("idle");
    setError(null);
  }, []);

  return (
    <LocationContext.Provider
      value={{ status, location, error, requestGeolocation, setManualLocation, clear }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
}
