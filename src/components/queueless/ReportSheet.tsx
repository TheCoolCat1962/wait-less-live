import { useEffect, useMemo, useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReportSheet } from "./ReportSheetContext";
import { WAIT_OPTIONS, type WaitLevel, getReporterKey } from "@/lib/queueless-data";
import { fetchNearbyBusinesses, submitWaitReport } from "@/lib/queueless.functions";
import { useLocation } from "@/lib/location";

const toneClasses: Record<string, string> = {
  safe: "border-safe/40 bg-safe/10 text-safe",
  caution: "border-caution/40 bg-caution/15 text-caution",
  danger: "border-danger/40 bg-danger/10 text-danger",
};

export function ReportSheet() {
  const { isOpen, businessId, close } = useReportSheet();
  const { location } = useLocation();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<WaitLevel | null>(null);
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSelected(null);
      setSubmitted(false);
      setSelectedBiz(null);
      setError(null);
    }
  }, [isOpen, businessId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const canSubmit = !!activeBizId && !!selected && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !activeBizId || !selected) return;
    const opt = WAIT_OPTIONS.find((o) => o.level === selected)!;
    setSubmitting(true);
    setError(null);
    try {
      await submitWaitReport({
        data: {
          businessId: activeBizId,
          minutes: opt.minutes,
          reporterKey: getReporterKey(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
      />
      <div className="relative mx-auto w-full max-w-[430px] rounded-t-3xl bg-surface p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom">
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-border" />
        <div className="mb-5 flex items-start justify-between gap-4">
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
            <div className="space-y-2">
              {WAIT_OPTIONS.map((opt) => {
                const active = selected === opt.level;
                return (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => setSelected(opt.level)}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                      active
                        ? toneClasses[opt.tone]
                        : "border-border bg-surface-muted/40 text-foreground"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-xs font-medium opacity-70">{opt.range}</p>
                    </div>
                    <div
                      className={`size-5 rounded-full border-2 ${
                        active ? "border-current bg-current" : "border-border"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit report"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Accurate reports raise your reputation.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
