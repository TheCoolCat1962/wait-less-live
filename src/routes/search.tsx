import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { distanceMiles, type BusinessWithWait } from "@/lib/queueless-data";
import { useLocation } from "@/lib/location";
import { fetchNearbyBusinesses, searchBusinessesByText } from "@/lib/queueless.functions";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const { location } = useLocation();

  // NOLA metro bounds (kept in sync with server). The nearby list is only
  // available in the launch region; name search stays available everywhere
  // (it returns NOLA-area results only, enforced server-side).
  const inNola = location
    ? location.coords.lat >= 29.82 &&
      location.coords.lat <= 30.15 &&
      location.coords.lng >= -90.35 &&
      location.coords.lng <= -89.55
    : true;

  // Debounce the query so we don't hit Places on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(raw.trim()), 300);
    return () => clearTimeout(t);
  }, [raw]);

  const nearbyQuery = useQuery({
    queryKey: ["nearby", location?.coords.lat, location?.coords.lng],
    enabled: !!location && inNola,
    queryFn: () =>
      fetchNearbyBusinesses({
        data: {
          lat: location!.coords.lat,
          lng: location!.coords.lng,
          radiusMiles: 25,
        },
      }),
    staleTime: 60_000,
  });

  const textQuery = useQuery({
    queryKey: ["searchText", q, location?.coords.lat, location?.coords.lng],
    enabled: q.length >= 2,
    queryFn: () =>
      searchBusinessesByText({
        data: {
          query: q,
          lat: location?.coords.lat,
          lng: location?.coords.lng,
        },
      }),
    staleTime: 30_000,
  });

  const activeQuery = q.length >= 2 ? textQuery : nearbyQuery;

  const list: BusinessWithWait[] = (activeQuery.data ?? []).map((b) => ({
    ...b,
    distanceMi: location ? distanceMiles(location.coords, { lat: b.lat, lng: b.lng }) : undefined,
  }));

  const categories = useMemo(() => {
    const set = new Set<string>();
    list.forEach((b) => set.add(b.category));
    return ["All", ...Array.from(set).sort()];
  }, [list]);

  const filtered = useMemo(() => {
    // Preserve server order: Places relevance for name search, wait-priority
    // ranking for the nearby (empty-query) list.
    return list.filter((b) => (category === "All" ? true : b.category === category));
  }, [category, list]);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight">Search</h1>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          New Orleans metro · more cities soon
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Business name, category, or neighborhood…"
            className="w-full rounded-xl bg-surface-muted py-3 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </header>

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-5 py-4">
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <main className="space-y-3 px-5 pb-6">
        {!location && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Set your location on the Home tab to search nearby.
          </p>
        )}
        {activeQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {q.length >= 2 ? "Searching…" : "Loading nearby…"}
          </div>
        )}
        {activeQuery.isError && (
          <div className="rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">
            Couldn't run that search. {(activeQuery.error as Error)?.message}
          </div>
        )}
        {location &&
          !activeQuery.isLoading &&
          !activeQuery.isError &&
          (filtered.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              {q.length >= 2
                ? `No New Orleans-area places match "${q}".`
                : !inNola
                  ? "QueueLess is currently available only in the New Orleans metro area. Search by name to find places in the metro."
                  : "No places nearby yet."}
            </p>
          ) : (
            filtered.map((b) => <BusinessCard key={b.id} business={b} />)
          ))}
      </main>
    </AppShell>
  );
}
