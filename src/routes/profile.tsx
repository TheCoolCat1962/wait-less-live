import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Award, Bell, ChevronRight, LogIn, Settings, Star, Loader2, LogOut } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useMemo } from "react";
import { useReputation, fetchUserReports, calculateReputationStats } from "@/lib/reputation";

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
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, refreshSession, isAuthenticated } = useAuth();
  const { reporterKey } = useReputation();
  const [signingOut, setSigningOut] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Wait for auth to be initialized before making any decisions
  useEffect(() => {
    if (!authLoading) {
      setIsInitialized(true);
      console.log("[Profile] Auth initialized:", {
        hasUser: !!user,
        userEmail: user?.email,
        emailConfirmed: !!user?.email_confirmed_at,
        isAuthenticated
      });
    }
  }, [authLoading, user, isAuthenticated]);

  // Refresh session on mount to ensure we have latest auth state
  useEffect(() => {
    if (isInitialized) {
      refreshSession();
    }
  }, [isInitialized, refreshSession]);

  // Fetch reports for stats (only if authenticated)
  useEffect(() => {
    if (isInitialized && isAuthenticated && reporterKey !== undefined) {
      setLoadingReports(true);
      fetchUserReports(reporterKey)
        .then(setReports)
        .finally(() => setLoadingReports(false));
    }
  }, [isInitialized, isAuthenticated, reporterKey]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateReputationStats(reports);
  }, [reports]);

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
            {loadingReports ? (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-lg font-black">{stats.totalReports}</p>
            )}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Reports
            </p>
          </div>
          <div className="border-x border-border">
            {loadingReports ? (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-lg font-black">{stats.points}</p>
            )}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Points
            </p>
          </div>
          <div>
            {loadingReports ? (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-lg font-black">
                {stats.currentStreak > 0 ? stats.currentStreak : "—"}
              </p>
            )}
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
                {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {signingOut ? "Signing out…" : "Sign out"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Return to guest mode
                </p>
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
