import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { BUSINESSES, CATEGORIES, type Category } from "@/lib/queueless-data";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return BUSINESSES.filter((b) => {
      if (category !== "All" && b.category !== category) return false;
      if (!query) return true;
      return (
        b.name.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.city.toLowerCase().includes(query)
      );
    });
  }, [q, category]);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <h1 className="mb-3 text-xl font-extrabold tracking-tight">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Business, category, or city…"
            className="w-full rounded-xl bg-surface-muted py-3 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </header>

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-5 py-4">
        {(["All", ...CATEGORIES] as const).map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c as Category | "All")}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <main className="space-y-3 px-5 pb-6">
        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No places match that search.
          </p>
        ) : (
          filtered.map((b) => <BusinessCard key={b.id} business={b} />)
        )}
      </main>
    </AppShell>
  );
}
