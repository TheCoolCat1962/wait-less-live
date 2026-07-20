import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Bell, ChevronRight, LogIn, Settings, Star } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function Row({
  icon: Icon,
  label,
  hint,
  to,
}: {
  icon: typeof Award;
  label: string;
  hint?: string;
  to?: string;
}) {
  const content = (
    <>
      <div className="grid size-9 place-items-center rounded-xl bg-surface-muted text-brand">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{label}</p>
        {hint && (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-brand/30 hover:bg-brand/5 active:bg-brand/10"
      >
        {content}
      </Link>
    );
  }

  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-brand/30">
      {content}
    </button>
  );
}

function ProfilePage() {
  return (
    <AppShell>
      <header className="px-5 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand/60 text-2xl font-black text-brand-foreground">
            G
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight">
              Guest reporter
            </h1>
            <p className="text-xs font-semibold text-muted-foreground">
              Not signed in
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3 text-center">
          <div>
            <p className="text-lg font-black">0</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Reports
            </p>
          </div>
          <div className="border-x border-border">
            <p className="text-lg font-black">50</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Rep score
            </p>
          </div>
          <div>
            <p className="text-lg font-black">—</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Streak
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-5 py-4">
        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Account
          </p>
          <Row 
            icon={LogIn} 
            label="Sign in or create account" 
            hint="Sync favorites across devices"
            to="/sign-in"
          />
          <Row 
            icon={Bell} 
            label="Notifications" 
            hint="Alerts for your favorite places"
            to="/notifications"
          />
        </section>

        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Community
          </p>
          <Row 
            icon={Star} 
            label="Your favorites" 
            hint="Manage saved places"
            to="/favorites"
          />
          <Row 
            icon={Award} 
            label="Reputation & badges" 
            hint="Earn trust from accurate reports"
            to="/reputation"
          />
          <Row 
            icon={Settings} 
            label="Settings"
            to="/settings"
          />
        </section>

        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            Go premium
          </p>
          <p className="mt-1 text-sm font-semibold">
            Wait-time alerts, trends & ad-free — $4.99/mo
          </p>
        </div>
      </main>
    </AppShell>
  );
}
