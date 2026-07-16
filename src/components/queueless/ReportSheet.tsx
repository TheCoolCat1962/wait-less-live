import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, Loader2, Play, Square, Timer } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReportSheet } from "./ReportSheetContext";
import { WAIT_OPTIONS, type WaitLevel, type ReportSource, getReporterKey } from "@/lib/queueless-data";
import { fetchNearbyBusinesses, submitWaitReport } from "@/lib/queueless.functions";
import { useLocation } from "@/lib/location";

const toneRing: Record<string, string> = {
  safe: "border-safe/60 bg-safe/10 text-safe",
  caution: "border-caution/60 bg-caution/15 text-caution",
  warn: "border-caution/60 bg-caution/20 text-danger",
  danger: "border-danger/60 bg-danger/10 text-danger",
};

type Mode = "quick" | "exact" | "timer";

export function ReportSheet() {
  const { isOpen, businessId, close } = useReportSheet();
  const { location } = useLocation();
  const qc = useQueryClient();

  const [mode, setMode] = useState<Mode>("quick");
  const [selected, setSelected] = useState<WaitLevel | null>(null);
  const [exactMinutes, setExactMinutes] = useState("");
  const [comment, setComment] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerStart && !timerEnd) {
      tickRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
      return () => {
        if (tickRef.current) window.clearInterval(tickRef.current);
      };
    }
  }, [timerStart, timerEnd]);

  const nearby = useQuery({
    queryKey: ["nearby", location?.coords.lat, location?.coords.lng],
    enabled: isOpen && !!location && !businessId,
    queryFn: () =>
      fetchNearbyBusinesses({
        data: { lat: location!.coords.lat, lng: location!.coords.lng, radiusMiles: 25 },
      }),
    staleTime: 60_000,
  });

  const activeBizId = businessId ?? selectedBiz;
  const business = useMemo(
    () => (nearby.data ?? []).find((b) => b.id === activeBizId),
    [nearby.data, activeBizId],
  );

  useEffect(() => {
    if (isOpen) {
      setMode("quick");
      setSelected(null);
      setExactMinutes("");
      setComment("");
      setSelectedBiz(null);
      setSubmitted(false);
      setError(null);
      setTimerStart(null);
      setTimerEnd(null);
    }
  }, [isOpen, businessId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  // Elapsed timer minutes (rounded)
  const elapsedMs = timerStart
    ? (timerEnd ?? Date.now() + tick * 0) - timerStart
    : 0;
  const elapsedMin = Math.max(0, Math.round(elapsedMs / 60000));
  const elapsedSec = Math.floor((elapsedMs / 1000) % 60);
  const elapsedTotalMin = Math.floor(elapsedMs / 60000);

  const commitReport = async (minutes: number, source: ReportSource) => {
    if (!activeBizId) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitWaitReport({
        data: {
          businessId: activeBizId,
          minutes,
          reporterKey: getReporterKey(),
          source,
          comment: comment.trim() || undefined,
        },
      });
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["nearby"] });
      qc.invalidateQueries({ queryKey: ["business", activeBizId] });
      setTimeout(() => close(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTap = (level: WaitLevel) => {
    if (!activeBizId) {
      setSelected(level);
      setError("Pick a place first.");
      return;
    }
    setSelected(level);
    const opt = WAIT_OPTIONS.find((o) => o.level === level)!;
    void commitReport(opt.minutes, "quick");
  };

  const handleExactSubmit = () => {
    const m = Number(exactMinutes);
    if (!activeBizId || !Number.isFinite(m) || m < 0 || m > 240) {
      setError("Enter minutes between 0 and 240.");
      return;
    }
    void commitReport(Math.round(m), "exact");
  };

  const handleTimerStart = () => {
    setTimerStart(Date.now());
    setTimerEnd(null);
  };
  const handleTimerStop = () => setTimerEnd(Date.now());
  const handleTimerSubmit = () => {
    if (!activeBizId || elapsedMin <= 0) {
      setError("Timer didn't record any wait.");
      return;
    }
    void commitReport(elapsedMin, "timer");
  };

  const bucketButton = (opt: (typeof WAIT_OPTIONS)[number]) => {
    const active = selected === opt.level;
    return (
      <button
        key={opt.level}
        type="button"
        disabled={submitting}
        onClick={() => handleQuickTap(opt.level)}
        className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-4 text-center transition-all ${
          active ? toneRing[opt.tone] : "border-border bg-surface-muted/40 text-foreground"
        } disabled:opacity-60`}
      >
        <span className="text-2xl leading-none">{opt.emoji}</span>
        <span className="text-sm font-extrabold">{opt.label}</span>
        <span className="text-[10px] font-semibold opacity-70">{opt.range}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
      />
      <div className="relative mx-auto w-full max-w-[430px] rounded-t-3xl bg-surface p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom">
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-border" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
              Quick report
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">
              {business ? `How's the line at ${business.name}?` : "Report a wait time"}
            </h2>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {!businessId && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pick a place
            </label>
            <select
              value={selectedBiz ?? ""}
              onChange={(e) => setSelectedBiz(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-3 text-sm font-medium focus:border-brand focus:outline-none"
            >
              <option value="">
                {nearby.isLoading ? "Loading nearby…" : "Select a business…"}
              </option>
              {(nearby.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.category}
                </option>
              ))}
            </select>
          </div>
        )}

        {submitted ? (
          <div className="grid place-items-center py-10 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-safe/15 text-safe">
              <Check className="size-8" strokeWidth={3} />
            </div>
            <p className="mt-4 text-base font-bold">Thanks — your report is live.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You just helped everyone else save time.
            </p>
          </div>
        ) : (
          <>
            {/* Mode switcher */}
            <div className="mb-4 flex rounded-xl bg-surface-muted p-1 text-xs font-bold">
              {(["quick", "exact", "timer"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg py-2 uppercase tracking-wider ${
                    mode === m ? "bg-surface text-brand shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {m === "quick" ? "Tap" : m === "exact" ? "Exact" : "Timer"}
                </button>
              ))}
            </div>

            {mode === "quick" && (
              <div className="grid grid-cols-2 gap-2">
                {WAIT_OPTIONS.map(bucketButton)}
              </div>
            )}

            {mode === "exact" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Exact minutes waited
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={240}
                  value={exactMinutes}
                  onChange={(e) => setExactMinutes(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full rounded-xl border border-border bg-surface-muted px-4 py-4 text-lg font-extrabold focus:border-brand focus:outline-none"
                />
                <button
                  type="button"
                  disabled={submitting || !activeBizId || !exactMinutes}
                  onClick={handleExactSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Submit
                </button>
              </div>
            )}

            {mode === "timer" && (
              <div className="space-y-3">
                <div className="grid place-items-center rounded-2xl border-2 border-dashed border-border bg-surface-muted/40 py-8">
                  <Timer className="mb-2 size-6 text-brand" />
                  <p className="text-4xl font-black tabular-nums">
                    {String(elapsedTotalMin).padStart(2, "0")}:
                    {String(elapsedSec).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {!timerStart ? "Ready when you are" : timerEnd ? "Stopped" : "Timing your wait"}
                  </p>
                </div>
                {!timerStart && (
                  <button
                    type="button"
                    onClick={handleTimerStart}
                    disabled={!activeBizId}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 disabled:opacity-60"
                  >
                    <Play className="size-4" /> Start wait timer
                  </button>
                )}
                {timerStart && !timerEnd && (
                  <button
                    type="button"
                    onClick={handleTimerStop}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger py-4 text-base font-bold text-white shadow-lg shadow-danger/30"
                  >
                    <Square className="size-4" /> Stop timer
                  </button>
                )}
                {timerEnd && (
                  <div className="space-y-2">
                    <p className="text-center text-sm font-semibold text-muted-foreground">
                      You waited <span className="font-black text-foreground">{elapsedMin}</span> minute
                      {elapsedMin === 1 ? "" : "s"}. Submit this report?
                    </p>
                    <button
                      type="button"
                      disabled={submitting || elapsedMin <= 0}
                      onClick={handleTimerSubmit}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 disabled:opacity-60"
                    >
                      {submitting && <Loader2 className="size-4 animate-spin" />}
                      Submit timed report
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Optional comment */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Optional note
              </label>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="e.g. Only self checkout open."
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                {error}
              </p>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Accurate reports raise your reputation.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
