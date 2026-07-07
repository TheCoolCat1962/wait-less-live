import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { BUSINESSES } from "@/lib/queueless-data";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids, ready } = useFavorites();
  const favs = BUSINESSES.filter((b) => ids.includes(b.id));

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Your places
        </p>
        <h1 className="text-xl font-extrabold tracking-tight">Favorites</h1>
      </header>

      <main className="space-y-3 px-5 py-6">
        {!ready ? null : favs.length === 0 ? (
          <div className="mt-16 flex flex-col items-center px-6 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Star className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold">No favorites yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the star on any place to save it here for quick access.
            </p>
            <Link
              to="/"
              className="mt-6 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30"
            >
              Browse nearby
            </Link>
          </div>
        ) : (
          favs.map((b) => <BusinessCard key={b.id} business={b} />)
        )}
      </main>
    </AppShell>
  );
}
