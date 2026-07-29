import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
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

// Synchronous localStorage read to avoid useEffect timing issues
function readStoredSync(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserLocation) : null;
  } catch {
    return null;
  }
}

function writeStored(loc: UserLocation | null) {
  if (typeof window === "undefined") return;
  if (loc) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  else window.localStorage.removeItem(STORAGE_KEY);
  // Notify all subscribers that location changed
  locationSubscribers.forEach((cb) => cb(loc));
}

// Subscribers for sync external store pattern
const locationSubscribers = new Set<(location: UserLocation | null) => void>();

export function LocationProvider({ children }: { children: ReactNode }) {
  // Initialize with stored location synchronously to avoid race conditions
  // This ensures location is available on the first render, not after useEffect
  const initialLocation = readStoredSync();
  const [status, setStatus] = useState<LocationStatus>(
    initialLocation ? "ready" : "idle"
  );
  const [location, setLocation] = useState<UserLocation | null>(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  
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
    
    // Read from ref to avoid recreating callback on settings change
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
        setLocation(loc);
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
        maximumAge: highAccuracy ? 120000 : 300000 
      },
    );
  }, []); // No dependencies - reads from ref

  const setManualLocation = useCallback(async (query: string) => {
    setStatus("prompting");
    setError(null);
    try {
      const resolved = await geocodeQuery({ data: { query } });
      const loc: UserLocation = {
        coords: { lat: resolved.lat, lng: resolved.lng },
        label: resolved.label,
        source: "manual",
      };
      writeStored(loc);
      setLocation(loc);
      setStatus("ready");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find that location.");
      setStatus("idle");
      return false;
    }
  }, []);

  const clear = useCallback(() => {
    writeStored(null);
    setLocation(null);
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
