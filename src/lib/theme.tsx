import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSettings } from "./settings";

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSetting } = useSettings();
  const isDark = settings.dark_mode;

  // Apply dark mode class to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    console.log("[Theme] Dark mode:", isDark);
  }, [isDark]);

  // Initialize theme on mount
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    updateSetting("dark_mode", !isDark);
  };

  const setDark = (dark: boolean) => {
    updateSetting("dark_mode", dark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
