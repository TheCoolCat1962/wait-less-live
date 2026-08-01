import { useEffect, useState, useRef, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { type Business, emojiForBusiness, photoUrlForWidth, gradientForBusiness } from "@/lib/queueless-data";

type ImageBusiness = Pick<Business, "logo_url" | "primary_type" | "category">;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Renders a business's primary Google Places photo, filling its parent (which
// owns the size/aspect ratio and rounding). Falls back to a clean, category-
// specific placeholder when there is no photo or the image fails to load — 
// never a blank area or broken-image icon. Lazy-loaded by default for smooth scrolling.
export const BusinessImage = memo(function BusinessImage({
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
  
  // Track if src changed to reset state
  const prevSrcRef = useRef(src);

  // Get category-specific gradient for placeholder
  const gradient = gradientForBusiness(business);

  // Reset state when source changes
  useEffect(() => {
    if (src !== prevSrcRef.current) {
      prevSrcRef.current = src;
      setCurrentSrc(src);
      setLoadState(src ? "idle" : "failed");
      retryCount.current = 0;
    }
  }, [src]);

  const handleError = useCallback(() => {
    if (currentSrc && retryCount.current < MAX_RETRIES) {
      retryCount.current++;
      console.log(`[BusinessImage] Retrying photo load (attempt ${retryCount.current + 1}/${MAX_RETRIES + 1})`);
      setLoadState("loading");
      // Force reload by adding cache-busting query param
      const retrySrc = `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}retry=${Date.now()}`;
      setTimeout(() => {
        setCurrentSrc(retrySrc);
      }, RETRY_DELAY_MS * retryCount.current);
    } else {
      console.log(`[BusinessImage] Photo failed after ${MAX_RETRIES + 1} attempts, showing placeholder`);
      setLoadState("failed");
    }
  }, [currentSrc]);

  const handleLoad = useCallback(() => {
    setLoadState("success");
  }, []);

  // Start loading when src is set and idle
  useEffect(() => {
    if (src && loadState === "idle") {
      setLoadState("loading");
    }
  }, [src, loadState]);

  // Show emoji placeholder if no source or failed after retries
  if (!src || !currentSrc || loadState === "failed") {
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
      key={currentSrc}
      src={currentSrc}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={cn("size-full object-cover", className)}
    />
  );
});
