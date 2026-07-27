import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
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
  const { settings } = useSettings();
  
  // Debug: Track state changes
  const prevStatusRef = useRef<LocationStatus>("loading");
  const prevLocationRef = useRef<UserLocation | null>(null);
  
  if (prevStatusRef.current !== status) {
    console.log(`[LocationProvider] ⚡ Status changed: ${prevStatusRef.current} → ${status}`);
    prevStatusRef.current = status;
  }
  
  if (prevLocationRef.current !== location) {
    const prevCoords = prevLocationRef.current?.coords;
    const newCoords = location?.coords;
    console.log(`[LocationProvider] 📍 Location changed:`, {
      prev: prevCoords ? `${prevCoords.lat},${prevCoords.lng}` : 'null',
      next: newCoords ? `${newCoords.lat},${newCoords.lng}` : 'null',
      label: location?.label,
    });
    prevLocationRef.current = location;
  }
  
  // Use ref to access current settings without recreating callbacks
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    console.log(`[LocationProvider] 🔧 Initializing, reading from storage...`);
    const stored = readStored();
    if (stored) {
      console.log(`[LocationProvider] ✅ Found stored location:`, stored);
      setLocation(stored);
      setStatus("ready");
    } else {
      console.log(`[LocationProvider] ℹ️ No stored location, setting status to idle`);
      setStatus("idle");
    }
  }, []);

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
    const startTime = Date.now();
    console.log(`[LocationProvider] 🔍 setManualLocation START: "${query}" at ${startTime}`);
    
    setStatus("prompting");
    setError(null);
    
    try {
      console.log(`[LocationProvider] 🌐 Calling geocodeQuery for: "${query}"`);
      const resolved = await geocodeQuery({ data: { query } });
      console.log(`[LocationProvider] 🌐 geocodeQuery result:`, resolved);
      
      const loc: UserLocation = {
        coords: { lat: resolved.lat, lng: resolved.lng },
        label: resolved.label,
        source: "manual",
      };
      
      console.log(`[LocationProvider] 💾 Writing to storage and state...`);
      writeStored(loc);
      setLocation(loc);
      setStatus("ready");
      
      const duration = Date.now() - startTime;
      console.log(`[LocationProvider] ✅ setManualLocation COMPLETE in ${duration}ms`, {
        coords: `${loc.coords.lat},${loc.coords.lng}`,
        label: loc.label,
      });
      
      return true;
    } catch (e) {
      const duration = Date.now() - startTime;
      console.error(`[LocationProvider] ❌ setManualLocation FAILED after ${duration}ms:`, e);
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
