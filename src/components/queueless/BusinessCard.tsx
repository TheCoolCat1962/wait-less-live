import { memo, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Plus } from "lucide-react";
import {
  type BusinessWithWait,
  formatUpdated,
  trendLabel,
} from "@/lib/queueless-data";
import { BusinessImage } from "./BusinessImage";
import { WaitBadge } from "./WaitBadge";
import { useFavorites } from "@/lib/favorites";
import { useReportSheet } from "./ReportSheetContext";

// Extracted favorite button to isolate re-renders
const FavoriteButton = memo(function FavoriteButton({
  isFavorite,
  onToggle,
}: {
  isFavorite: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
      className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-brand"
    >
      <Star className={`size-4 ${isFavorite ? "fill-brand text-brand" : ""}`} />
    </button>
  );
});

// Extracted "Be first" button to isolate re-renders
const BeFirstButton = memo(function BeFirstButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand"
    >
      <Plus className="size-3" /> Be first
    </button>
  );
});

export const BusinessCard = memo(function BusinessCard({
  business,
}: {
  business: BusinessWithWait;
}) {
  const { has, toggle } = useFavorites();
  const { open } = useReportSheet();
  const fav = has(business.id);
  const trend = business.currentMinutes != null ? trendLabel(business.trend) : null;

  const handleToggleFavorite = useCallback(() => {
    toggle(business.id);
  }, [toggle, business.id]);

  const handleBeFirst = useCallback(() => {
    open(business.id);
  }, [open, business.id]);

  // Memoize static values to prevent re-renders
  const categoryText = business.category;
  const locationText =
    typeof business.distanceMi === "number"
      ? `${business.distanceMi.toFixed(1)} mi`
      : business.city
        ? `${business.city}${business.state ? ", " + business.state : ""}`
        : "";

  return (
    <Link
      to="/business/$id"
      params={{ id: business.id }}
      className="group block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
          <BusinessImage business={business} width={160} emojiClassName="text-2xl" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-bold text-foreground">{business.name}</h3>
            <FavoriteButton isFavorite={fav} onToggle={handleToggleFavorite} />
          </div>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {categoryText}
            {locationText ? ` · ${locationText}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {business.currentMinutes != null ? (
              <>
                <WaitBadge minutes={business.currentMinutes} />
                <span className="text-[10px] italic text-muted-foreground">
                  {formatUpdated(business.updatedMinutesAgo)}
                </span>
                {trend && (
                  <span className={`text-[10px] font-bold ${trend.tone}`}>
                    {trend.icon} {trend.label}
                  </span>
                )}
              </>
            ) : (
              <BeFirstButton onClick={handleBeFirst} />
            )}
          </div>
          {business.address && (
            <p className="mt-2 line-clamp-1 text-xs font-medium text-muted-foreground">
              {business.address}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});
