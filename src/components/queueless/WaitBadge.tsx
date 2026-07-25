import { memo } from "react";
import { toneFromMinutes } from "@/lib/queueless-data";

interface Props {
  minutes: number;
  size?: "sm" | "md" | "lg";
}

const toneClasses: Record<string, string> = {
  safe: "bg-safe/10 text-safe border-safe/20",
  caution: "bg-caution/15 text-caution border-caution/25",
  danger: "bg-danger/10 text-danger border-danger/25",
};

const dotClasses: Record<string, string> = {
  safe: "bg-safe",
  caution: "bg-caution",
  danger: "bg-danger",
};

export const WaitBadge = memo(function WaitBadge({ minutes, size = "sm" }: Props) {
  const tone = toneFromMinutes(minutes);
  const sizing =
    size === "lg"
      ? "px-3 py-1.5 text-sm"
      : size === "md"
        ? "px-2.5 py-1 text-xs"
        : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${toneClasses[tone]} ${sizing}`}
    >
      <span className={`size-1.5 rounded-full ${dotClasses[tone]}`} />
      {minutes} min wait
    </span>
  );
});
