import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { type Business, emojiForBusiness, photoUrlForWidth } from "@/lib/queueless-data";

type ImageBusiness = Pick<Business, "logo_url" | "primary_type" | "category">;

// Renders a business's primary Google Places photo, filling its parent (which
// owns the size/aspect ratio and rounding). Falls back to a clean, on-brand
// placeholder when there is no photo or the image fails to load — never a blank
// area or broken-image icon. Lazy-loaded by default for smooth scrolling.
export function BusinessImage({
  business,
  width,
  className,
  emojiClassName,
  eager = false,
}: {
  business: ImageBusiness;
  width: number;
  className?: string;
  emojiClassName?: string;
  eager?: boolean;
}) {
  const src = photoUrlForWidth(business.logo_url, width);
  const [failed, setFailed] = useState(false);

  // Reset the error state if the source changes (e.g. reused list row).
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={cn(
          "grid size-full place-items-center bg-gradient-to-br from-brand/15 to-surface-muted",
          className,
        )}
      >
        <span className={emojiClassName ?? "text-2xl"}>{emojiForBusiness(business)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}
