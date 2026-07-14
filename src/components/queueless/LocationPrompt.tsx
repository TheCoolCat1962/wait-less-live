import { useState, type FormEvent } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { useLocation } from "@/lib/location";

export function LocationPrompt() {
  const { status, error, requestGeolocation, setManualLocation } = useLocation();
  const [query, setQuery] = useState("");
  const [showManual, setShowManual] = useState(false);
  const busy = status === "prompting";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setManualLocation(query);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center">
      <div className="mx-auto w-full max-w-[430px] rounded-t-3xl bg-surface p-6 pb-8 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-border sm:hidden" />
        <div className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
          <MapPin className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold tracking-tight">
          Find wait times near you
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          QueueLess shows live wait times at stores across the US. Share your
          location or enter a ZIP code or city.
        </p>

        <button
          type="button"
          onClick={requestGeolocation}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Requesting…
            </>
          ) : (
            <>
              <MapPin className="size-4" /> Use my location
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="mt-3 w-full text-center text-sm font-bold text-brand"
        >
          {showManual ? "Hide manual entry" : "Enter ZIP code or city instead"}
        </button>

        {showManual && (
          <form onSubmit={submit} className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 10001 or Chicago"
                className="w-full rounded-xl bg-surface-muted py-3 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="mt-3 w-full rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background disabled:opacity-40"
            >
              Show nearby places
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            {error}
          </p>
        )}

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          We only use your location to find nearby businesses.
        </p>
      </div>
    </div>
  );
}
