import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { distanceMiles, type BusinessWithWait } from "@/lib/queueless-data";
import { useLocation } from "@/lib/location";
import { fetchNearbyBusinesses } from "@/lib/queueless.functions";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const { location } = useLocation();

  const nearbyQuery = useQuery({
    queryKey: ["nearby", location?.coords.lat, location?.coords.lng],
    enabled: !!location,
    queryFn: () =>
      fetchNearbyBusinesses({
        data: { lat: location!.coords.lat, lng: location!.coords.lng, radiusMiles: 25 },
      }),
    staleTime: 60_000,
  });

  const list: BusinessWithWait[] = (nearbyQuery.data ?? []).map((b) => ({
    ...b,
    distanceMi: location
      ? distanceMiles(location.coords, { lat: b.lat, lng: b.lng })
      : undefined,
  }));

  const categories = useMemo(() => {
    const set = new Set<string>();
    list.forEach((b) => set.add(b.category));
    return ["All", ...Array.from(set).sort()];
  }, [list]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list
      .filter((b) => {
        if (category !== "All" && b.category !== category) return false;
        if (!query) return true;
        return (
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          (b.city ?? "").toLowerCase().includes(query) ||
          (b.address ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0));
  }, [q, category, list]);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <h1 className="mb-3 text-xl font-extrabold tracking-tight">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Business, category, or address…"
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
        {nearbyQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading nearby…
          </div>
        )}
        {location &&
          !nearbyQuery.isLoading &&
          (filtered.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              No places match that search.
            </p>
          ) : (
            filtered.map((b) => <BusinessCard key={b.id} business={b} />)
          ))}
      </main>
    </AppShell>
  );
}
