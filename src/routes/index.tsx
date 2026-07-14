import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Sparkles } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { BUSINESSES } from "@/lib/queueless-data";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const sorted = [...BUSINESSES].sort((a, b) => a.distanceMi - b.distanceMi);
  const quick = sorted.filter((b) => b.currentMinutes <= 10).slice(0, 3);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black uppercase tracking-tight text-brand">
              QueueLess
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Know before you go
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted">
            <span className="size-2 animate-pulse rounded-full bg-brand" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-sm">
          <MapPin className="size-4 text-brand" />
          <span className="min-w-0 truncate font-semibold">Spadina & Richmond</span>
          <button className="ml-auto text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Change
          </button>
        </div>
      </header>

      <main className="space-y-6 px-5 py-6">
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
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{b.emoji}</span>
                    <span className="truncate font-bold text-foreground">
                      {b.name}
                    </span>
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-safe">
                    {b.currentMinutes} min · {b.distanceMi.toFixed(1)} mi
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

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
            {sorted.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
