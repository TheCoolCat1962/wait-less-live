import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "queueless.settings.v1";

export interface AppSettings {
  dark_mode: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  location_accuracy: boolean;
  // Privacy settings
  show_in_leaderboard: boolean;
  allow_analytics: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  dark_mode: false,
  push_notifications: true,
  email_notifications: false,
  location_accuracy: true,
  show_in_leaderboard: true,
  allow_analytics: true,
};

function readLocal(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeLocal(settings: AppSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("queueless:settings"));
}

// Load settings from Supabase for authenticated users
async function loadFromSupabase(userId: string): Promise<AppSettings | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("[Settings] Error loading from Supabase:", error);
      return null;
    }
    
    if (data) {
      return {
        dark_mode: data.dark_mode ?? DEFAULT_SETTINGS.dark_mode,
        push_notifications: data.push_notifications ?? DEFAULT_SETTINGS.push_notifications,
        email_notifications: data.email_notifications ?? DEFAULT_SETTINGS.email_notifications,
        location_accuracy: data.location_accuracy ?? DEFAULT_SETTINGS.location_accuracy,
        show_in_leaderboard: data.show_in_leaderboard ?? DEFAULT_SETTINGS.show_in_leaderboard,
        allow_analytics: data.allow_analytics ?? DEFAULT_SETTINGS.allow_analytics,
      };
    }
    return null;
  } catch (err) {
    console.error("[Settings] Error loading from Supabase:", err);
    return null;
  }
}

// Save settings to Supabase for authenticated users
async function saveToSupabase(userId: string, settings: AppSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });
    
    if (error) {
      console.error("[Settings] Error saving to Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Settings] Error saving to Supabase:", err);
    return false;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize settings
  useEffect(() => {
    async function init() {
      // First load from localStorage for immediate display
      const local = readLocal();
      setSettings(local);
      setReady(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userIdRef.current = user.id;
        // Try to load from Supabase
        const remote = await loadFromSupabase(user.id);
        if (remote) {
          // Merge remote with local, preferring remote values
          const merged = { ...local, ...remote };
          setSettings(merged);
          writeLocal(merged);
        }
      }
    }
    
    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Settings] Auth state changed:", event);
      
      if (event === "SIGNED_IN" && session?.user) {
        userIdRef.current = session.user.id;
        // Reload settings when user signs in
        const remote = await loadFromSupabase(session.user.id);
        if (remote) {
          setSettings(remote);
          writeLocal(remote);
        }
      } else if (event === "SIGNED_OUT") {
        userIdRef.current = null;
      }
    });

    // Listen for local storage changes
    const handleStorage = () => {
      const local = readLocal();
      setSettings(local);
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Debounced save function
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    // Immediately save to localStorage
    writeLocal(newSettings);
    setSettings(newSettings);

    // Debounce Supabase sync
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (userIdRef.current) {
        setSyncing(true);
        await saveToSupabase(userIdRef.current, newSettings);
        setSyncing(false);
        console.log("[Settings] Synced to Supabase");
      }
    }, 500);
  }, []);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    console.log(`[Settings] Updated ${key}:`, value);
  }, [settings, saveSettings]);

  // Toggle a boolean setting
  const toggleSetting = useCallback((key: keyof AppSettings) => {
    if (typeof settings[key] === "boolean") {
      updateSetting(key, !settings[key]);
    }
  }, [settings, updateSetting]);

  return {
    settings,
    ready,
    syncing,
    updateSetting,
    toggleSetting,
    refresh: async () => {
      if (userIdRef.current) {
        const remote = await loadFromSupabase(userIdRef.current);
        if (remote) {
          setSettings(remote);
          writeLocal(remote);
        }
      }
    },
  };
}

// Hook to check if dark mode is enabled
export function useDarkMode() {
  const { settings } = useSettings();
  return settings.dark_mode;
}

// Hook to get location accuracy preference
export function useLocationAccuracy() {
  const { settings } = useSettings();
  return settings.location_accuracy;
}
