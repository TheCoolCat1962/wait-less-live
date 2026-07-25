import { useEffect, useState, useCallback, useMemo, useRef } from "react";

const KEY = "queueless.favorites.v1";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("queueless:favorites"));
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  // Keep a ref to current ids for use in callbacks without recreating them
  const idsRef = useRef<string[]>([]);

  useEffect(() => {
    setIds(read());
    setReady(true);
    const handler = () => {
      const newIds = read();
      idsRef.current = newIds;
      setIds(newIds);
    };
    window.addEventListener("queueless:favorites", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("queueless:favorites", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Update ref when ids change
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  // toggle is stable - it reads current state via ref
  const toggle = useCallback((id: string) => {
    const current = idsRef.current;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(next);
  }, []);

  // has uses useMemo to return a stable function reference
  // but reads from a ref to avoid recreating when ids change
  const has = useCallback((id: string) => idsRef.current.includes(id), []);

  // Memoize the return value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ ids, ready, toggle, has }),
    [ids, ready, toggle, has],
  );

  return value;
}
