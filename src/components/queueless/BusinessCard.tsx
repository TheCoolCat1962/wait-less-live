import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Business } from "@/lib/queueless-data";
import { formatUpdated } from "@/lib/queueless-data";
import { WaitBadge } from "./WaitBadge";
import { useFavorites } from "@/lib/favorites";

export function BusinessCard({
  business,
  distanceMi,
}: {
  business: Business;
  distanceMi?: number;
}) {
  const { has, toggle } = useFavorites();
  const fav = has(business.id);
  return (
    <Link
      to="/business/$id"
      params={{ id: business.id }}
      className="group block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-surface-muted text-2xl">
          <span aria-hidden>{business.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-bold text-foreground">{business.name}</h3>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggle(business.id);
              }}
              aria-label={fav ? "Remove favorite" : "Add favorite"}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-brand"
            >
              <Star
                className={`size-4 ${fav ? "fill-brand text-brand" : ""}`}
              />
            </button>
          </div>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {business.category}
            {typeof distanceMi === "number"
              ? ` · ${distanceMi.toFixed(1)} mi`
              : ` · ${business.city}, ${business.state}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WaitBadge minutes={business.currentMinutes} />
            <span className="text-[10px] italic text-muted-foreground">
              {formatUpdated(business.updatedMinutesAgo)}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-xs font-medium text-muted-foreground">
            {business.blurb}
          </p>
        </div>
      </div>
    </Link>
  );
}
