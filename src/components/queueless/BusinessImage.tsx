import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  type Business,
  emojiForBusiness,
  photoUrlForWidth,
  gradientForBusiness,
} from "@/lib/queueless-data";

type ImageBusiness = Pick<Business, "logo_url" | "primary_type" | "category">;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Renders a business's primary Google Places photo, filling its parent (which
// owns the size/aspect ratio and rounding). Falls back to a clean, category-
// specific placeholder when there is no photo or the image fails to load —
// never a blank area or broken-image icon. Lazy-loaded by default for smooth scrolling.
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
  const [loadState, setLoadState] = useState<"idle" | "loading" | "success" | "failed">("idle");
  const [currentSrc, setCurrentSrc] = useState(src);
  const retryCount = useRef(0);

  // Get category-specific gradient for placeholder
  const gradient = gradientForBusiness(business);

  // Reset state when source changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setLoadState(src ? "idle" : "failed");
      retryCount.current = 0;
    }
  }, [src, currentSrc]);

  const handleError = () => {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current++;
      console.log(
        `[BusinessImage] Retrying photo load (attempt ${retryCount.current + 1}/${MAX_RETRIES + 1})`,
      );
      setLoadState("loading");
      // Force reload by adding cache-busting query param
      const newSrc = `${currentSrc}${currentSrc.includes("?") ? "&" : "?"}retry=${Date.now()}`;
      setTimeout(() => {
        setCurrentSrc(newSrc);
      }, RETRY_DELAY_MS * retryCount.current);
    } else {
      console.log(
        `[BusinessImage] Photo failed after ${MAX_RETRIES + 1} attempts, showing placeholder`,
      );
      setLoadState("failed");
    }
  };

  const handleLoad = () => {
    if (loadState !== "success") {
      setLoadState("success");
    }
  };

  // Start loading when src is set
  useEffect(() => {
    if (src && loadState === "idle") {
      setLoadState("loading");
    }
  }, [src, loadState]);

  // Show emoji placeholder if no source or failed after retries
  if (!src || loadState === "failed") {
    return (
      <div
        aria-hidden
        className={cn(
          `grid size-full place-items-center bg-gradient-to-br ${gradient.from} ${gradient.to}`,
          className,
        )}
      >
        <span className={emojiClassName ?? "text-2xl"}>{emojiForBusiness(business)}</span>
      </div>
    );
  }

  return (
    <img
      key={currentSrc ?? "img"}
      src={currentSrc ?? ""}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={cn("size-full object-cover", className)}
    />
  );
}
