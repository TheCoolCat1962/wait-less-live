import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Bell, ChevronRight, LogIn, Settings, Star, Loader2, LogOut } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getReporterKey } from "@/lib/queueless-data";

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
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
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
  const { user, loading, signOut, refreshSession } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState({ reports: 0, points: 0, streak: 0 });

  // Wait for auth to be initialized before showing content
  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
      console.log("[Profile] Auth initialized:", {
        hasUser: !!user,
        userEmail: user?.email,
        emailConfirmed: !!user?.email_confirmed_at,
      });

      const fetchStats = async () => {
        try {
          const reporterKey = user?.id || getReporterKey();
          const { data: reports, error } = await supabase
            .from("wait_reports")
            .select("created_at, business_id")
            .eq("reporter_key", reporterKey);

          if (error) throw error;

          const totalReports = reports?.length || 0;
          let points = totalReports * 10;
          let currentStreak = 0;

          if (reports && reports.length > 0) {
            const dates = reports
              .map((r) => new Date(r.created_at).toLocaleDateString())
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            const uniqueDates = [...new Set(dates)];

            const todayStr = new Date().toLocaleDateString();
            const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString();

            if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
              let cStreak = 0;
              let checkDate = new Date();
              while (uniqueDates.includes(checkDate.toLocaleDateString())) {
                cStreak++;
                checkDate = new Date(checkDate.getTime() - 86400000);
              }
              if (cStreak === 0 && uniqueDates.includes(yesterdayStr)) {
                checkDate = new Date(Date.now() - 86400000);
                while (uniqueDates.includes(checkDate.toLocaleDateString())) {
                  cStreak++;
                  checkDate = new Date(checkDate.getTime() - 86400000);
                }
              }
              currentStreak = cStreak;
            }

            // Calculate badge points
            const earlyBird = reports.some((r) => new Date(r.created_at).getHours() < 8);
            const nightOwl = reports.some((r) => new Date(r.created_at).getHours() >= 22);

            // Best streak for streak badges (simple approximation for point calculation)
            let bestStreak = 0;
            let tempStreak = 0;
            let lastDate: Date | null = null;
            [...uniqueDates].reverse().forEach((dateStr) => {
              const date = new Date(dateStr);
              if (!lastDate) {
                tempStreak = 1;
              } else {
                const diffTime = Math.abs(date.getTime() - lastDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                  tempStreak++;
                } else {
                  tempStreak = 1;
                }
              }
              if (tempStreak > bestStreak) bestStreak = tempStreak;
              lastDate = date;
            });

            const uniqueBusinesses = new Set(reports.map((r) => r.business_id)).size;

            if (earlyBird) points += 50;
            if (nightOwl) points += 50;
            if (bestStreak >= 7) points += 100;
            if (totalReports >= 100) points += 200;
            if (uniqueBusinesses >= 25) points += 150;
            if (bestStreak >= 30) points += 200;
          }

          setStats({ reports: totalReports, points, streak: currentStreak });
        } catch (err) {
          console.error("Error fetching stats:", err);
        }
      };

      fetchStats();
    }
  }, [loading, user]);

  // Refresh session on mount to ensure we have latest auth state
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      console.log("[Profile] Sign out completed");
    } finally {
      setSigningOut(false);
    }
  };

  const getUserInitial = () => {
    if (!user) return "G";
    const email = user.email || "";
    return email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return "Guest reporter";
    const email = user.email || "";
    // Get name before @ or just show email
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Show loading state while auth is initializing
  if (!isInitialized) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-brand" />
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="px-5 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand/60 text-2xl font-black text-brand-foreground">
            {getUserInitial()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight">
              {getUserDisplayName()}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground">
              {user ? user.email : "Not signed in"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3 text-center">
          <div>
            <p className="text-lg font-black">{stats.reports}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Reports
            </p>
          </div>
          <div className="border-x border-border">
            <p className="text-lg font-black">{stats.points}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Rep score
            </p>
          </div>
          <div>
            <p className="text-lg font-black">{stats.streak}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Streak
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-5 py-4">
        {user ? (
          <section className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Account
            </p>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-danger/30 hover:bg-danger/5 disabled:opacity-50"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-surface-muted text-danger">
                {signingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {signingOut ? "Signing out…" : "Sign out"}
                </p>
                <p className="truncate text-xs text-muted-foreground">Return to guest mode</p>
              </div>
            </button>
            <Row
              icon={Bell}
              label="Notifications"
              hint="Alerts for your favorite places"
              to="/notifications"
            />
          </section>
        ) : (
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
        )}

        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Community
          </p>
          <Row icon={Star} label="Your favorites" hint="Manage saved places" to="/favorites" />
          <Row
            icon={Award}
            label="Reputation & badges"
            hint="Earn trust from accurate reports"
            to="/reputation"
          />
          <Row icon={Settings} label="Settings" to="/settings" />
        </section>

        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Go premium</p>
          <p className="mt-1 text-sm font-semibold">
            Wait-time alerts, trends & ad-free — $4.99/mo
          </p>
        </div>
      </main>
    </AppShell>
  );
}
