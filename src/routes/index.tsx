import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

  const nearbyQuery = useQuery({
    queryKey: ["nearby", location?.coords.lat, location?.coords.lng],
    enabled: !!location,
    queryFn: () =>
      fetchNearbyBusinesses({
        data: { lat: location!.coords.lat, lng: location!.coords.lng, radiusMiles: 25 },
      }),
    staleTime: 60_000,
  });

  const sorted: BusinessWithWait[] = (nearbyQuery.data ?? [])
    .map((b) => ({
      ...b,
      distanceMi: location
        ? distanceMiles(location.coords, { lat: b.lat, lng: b.lng })
        : undefined,
    }))
    .sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0));

  const quick = sorted
    .filter((b) => b.currentMinutes != null && b.currentMinutes <= 10)
    .slice(0, 3);

  const showPrompt =
    status === "idle" || status === "error" || (status === "prompting" && !location);

  // NOLA metro bounds (kept in sync with server).
  const inNola = location
    ? location.coords.lat >= 29.82 &&
      location.coords.lat <= 30.15 &&
      location.coords.lng >= -90.35 &&
      location.coords.lng <= -89.55
    : true;

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
              onClick={clear}
              className="ml-auto text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Change
            </button>
          )}
        </div>
        {location && !inNola && (
          <p className="mt-3 rounded-xl bg-brand/10 px-3 py-2 text-[11px] font-semibold text-brand">
            QueueLess is launching in New Orleans first. You're outside the
            metro — coverage in your area is coming soon.
          </p>
        )}

      </header>

      {location ? (
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
