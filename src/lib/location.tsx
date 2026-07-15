import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { geocodeQuery } from "./queueless.functions";
import type { Coords } from "./queueless-data";

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

function readStored(): UserLocation | null {
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
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>("loading");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setLocation(stored);
      setStatus("ready");
    } else {
      setStatus("idle");
    }
  }, []);

  const requestGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation isn't supported in this browser.");
      setStatus("error");
      return;
    }
    setStatus("prompting");
    setError(null);
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
            : "Couldn't get your location.",
        );
        setStatus("idle");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

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
      setError(e instanceof Error ? e.message : "Couldn't find that location.");
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
