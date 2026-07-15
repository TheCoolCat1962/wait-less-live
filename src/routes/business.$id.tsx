import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Star, Users, Loader2 } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { WaitBadge } from "@/components/queueless/WaitBadge";
import {
  crowdLabel,
  emojiForCategory,
  formatUpdated,
  toneFromMinutes,
} from "@/lib/queueless-data";
import { useFavorites } from "@/lib/favorites";
import { useReportSheet } from "@/components/queueless/ReportSheetContext";
import { getBusinessWithReports } from "@/lib/queueless.functions";

export const Route = createFileRoute("/business/$id")({
  component: BusinessPage,
  errorComponent: () => (
    <AppShell>
      <div className="px-6 py-24 text-center">
        <h1 className="text-lg font-extrabold">Something went wrong</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-brand">
          Back to nearby
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="px-6 py-24 text-center">
        <h1 className="text-lg font-extrabold">Business not found</h1>
      </div>
    </AppShell>
  ),
});

const toneBg: Record<string, string> = {
  safe: "from-safe/20 to-safe/5",
  caution: "from-caution/25 to-caution/5",
  danger: "from-danger/20 to-danger/5",
  neutral: "from-surface-muted to-surface",
};

const toneText: Record<string, string> = {
  safe: "text-safe",
  caution: "text-caution",
  danger: "text-danger",
  neutral: "text-foreground",
};

function BusinessPage() {
  const { id } = Route.useParams();
  const { has, toggle } = useFavorites();
  const { open } = useReportSheet();
  const q = useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusinessWithReports({ data: { id } }),
  });

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      </AppShell>
    );
  }
  if (q.isError || !q.data) {
    return (
      <AppShell>
        <div className="px-6 py-24 text-center">
          <h1 className="text-lg font-extrabold">Business not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-brand">
            Back to nearby
          </Link>
        </div>
      </AppShell>
    );
  }

  const business = q.data;
  const fav = has(business.id);
  const tone = toneFromMinutes(business.currentMinutes);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="grid size-9 place-items-center rounded-full bg-surface-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <p className="truncate text-sm font-bold">{business.name}</p>
        <button
          onClick={() => toggle(business.id)}
          aria-label={fav ? "Remove favorite" : "Add favorite"}
          className="grid size-9 place-items-center rounded-full bg-surface-muted"
        >
          <Star className={`size-4 ${fav ? "fill-brand text-brand" : ""}`} />
        </button>
      </header>

      <section className={`bg-gradient-to-b ${toneBg[tone]} px-5 pb-8 pt-6`}>
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl bg-surface text-2xl shadow-sm">
            {emojiForCategory(business.category)}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {business.category}
            </p>
            <h1 className="truncate text-2xl font-black tracking-tight">
              {business.name}
            </h1>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Current wait
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            {business.currentMinutes != null ? (
              <>
                <span
                  className={`text-5xl font-black tracking-tight ${toneText[tone]}`}
                >
                  {business.currentMinutes}
                </span>
                <span className="text-base font-bold text-muted-foreground">min</span>
              </>
            ) : (
              <span className="text-2xl font-black tracking-tight text-muted-foreground">
                No reports yet
              </span>
            )}
          </div>
          <p className={`mt-1 text-sm font-bold ${toneText[tone]}`}>
            {crowdLabel(business.currentMinutes)}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-3.5" />
              Updated {formatUpdated(business.updatedMinutesAgo)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-3.5" />
              {business.contributors} contributor{business.contributors === 1 ? "" : "s"}
            </div>
          </div>

          <button
            onClick={() => open(business.id)}
            className="mt-5 w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30"
          >
            Report current wait
          </button>
        </div>
      </section>

      <main className="space-y-6 px-5 py-6">
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Recent reports
          </h2>
          {business.reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No reports yet. Be the first to share the wait time here.
            </div>
          ) : (
            <div className="space-y-2">
              {business.reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-full bg-surface-muted text-[10px] font-bold uppercase text-muted-foreground">
                      {r.contributor}
                    </div>
                    <div>
                      <p className="text-sm font-bold">Anonymous</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatUpdated(r.minutesAgo)}
                      </p>
                    </div>
                  </div>
                  <WaitBadge minutes={r.minutes} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Details
          </h2>
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm">
            {business.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="font-semibold">{business.address}</p>
                  {business.city && (
                    <p className="text-xs text-muted-foreground">
                      {business.city}
                      {business.state ? `, ${business.state}` : ""}
                      {business.zip ? ` ${business.zip}` : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
            {business.phone && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="font-semibold">{business.phone}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
