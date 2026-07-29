import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback, useRef } from "react";
import { MapPin, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { LocationPrompt } from "@/components/queueless/LocationPrompt";
import { distanceMiles, type BusinessWithWait } from "@/lib/queueless-data";
import { useLocation } from "@/lib/location";
import { fetchNearbyBusinesses } from "@/lib/queueless.functions";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { status, location, clear } = useLocation();

  // Track location version to detect changes and force query refetch
  const locationVersionRef = useRef(0);
  const prevLocationRef = useRef<typeof location>(null);

  // Detect when location actually changes (not just re-renders)
  if (prevLocationRef.current !== location) {
    if (prevLocationRef.current?.coords.lat !== location?.coords.lat ||
        prevLocationRef.current?.coords.lng !== location?.coords.lng) {
      locationVersionRef.current++;
    }
    prevLocationRef.current = location;
  }

  // NOLA metro bounds (kept in sync with server). Only the launch region is
  // supported, so we don't query for out-of-region locations.
  const inNola = useMemo(() => {
    if (!location) return true;
    const { lat, lng } = location.coords;
    return lat >= 29.82 && lat <= 30.15 && lng >= -90.35 && lng <= -89.55;
  }, [location?.coords.lat, location?.coords.lng]);

  const nearbyQuery = useQuery({
    // Include location version in key to force refetch when location changes
    queryKey: ["nearby", location?.coords.lat, location?.coords.lng, locationVersionRef.current],
    enabled: !!location && inNola,
    queryFn: () =>
      fetchNearbyBusinesses({
        data: { lat: location!.coords.lat, lng: location!.coords.lng, radiusMiles: 25 },
      }),
    staleTime: 60_000,
  });

  // Memoize sorted businesses to avoid recalculating on every render
  const sorted = useMemo<BusinessWithWait[]>(() => {
    return (nearbyQuery.data ?? []).map((b) => ({
      ...b,
      distanceMi: location
        ? distanceMiles(location.coords, { lat: b.lat, lng: b.lng })
        : undefined,
    }));
  }, [nearbyQuery.data, location?.coords.lat, location?.coords.lng]);

  // Memoize quick businesses (no wait)
  const quick = useMemo(() => {
    return sorted
      .filter((b) => b.currentMinutes != null && b.currentMinutes <= 10)
      .slice(0, 3);
  }, [sorted]);

  const showPrompt =
    status === "idle" || status === "error" || (status === "prompting" && !location);
    
  const handleClearLocation = useCallback(() => {
    clear();
  }, [clear]);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black uppercase tracking-tight text-brand">
              QueueLess
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Now live · New Orleans metro
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted">
            <span className="size-2 animate-pulse rounded-full bg-brand" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-sm">
          <MapPin className="size-4 text-brand" />
          <span className="min-w-0 truncate font-semibold">
            {location?.label ?? "Set your location"}
          </span>
          {location && (
            <button
              onClick={handleClearLocation}
              className="ml-auto text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Change
            </button>
          )}
        </div>
      </header>

      {location && !inNola ? (
        <main className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand/10">
            <MapPin className="size-7 text-brand" />
          </div>
          <h2 className="mb-2 text-lg font-extrabold">Not in your area yet</h2>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            QueueLess is currently available only in the New Orleans metro area.
            We're expanding soon — check back for live wait times near you.
          </p>
        </main>
      ) : location ? (
        <main className="space-y-6 px-5 py-6">
          {nearbyQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Finding nearby places…
            </div>
          )}
          {nearbyQuery.isError && (
            <div className="rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">
              Couldn't load nearby places. {(nearbyQuery.error as Error)?.message}
            </div>
          )}

          {quick.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-safe" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  No wait right now
                </h2>
              </div>
              <div className="flex snap-x gap-3 overflow-x-auto pb-2 -mx-5 px-5">
                {quick.map((b) => (
                  <a
                    key={b.id}
                    href={`/business/${b.id}`}
                    className="min-w-[62%] snap-start rounded-2xl border border-safe/25 bg-safe/5 p-4"
                  >
                    <div className="mb-2 truncate font-bold text-foreground">
                      {b.name}
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-safe">
                      {b.currentMinutes} min · {b.distanceMi?.toFixed(1)} mi
                    </p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {sorted.length > 0 && (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Nearby locations
                  </p>
                  <h2 className="text-lg font-extrabold">Live wait times</h2>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {sorted.length} places
                </span>
              </div>
              <div className="space-y-3">
                {sorted.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </section>
          )}

          {!nearbyQuery.isLoading && sorted.length === 0 && !nearbyQuery.isError && (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              No businesses found within 25 miles. Try a different location.
            </p>
          )}
        </main>
      ) : (
        <main className="px-5 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Share your location to see live wait times at nearby US businesses.
          </p>
        </main>
      )}

      {showPrompt && <LocationPrompt />}
    </AppShell>
  );
}
