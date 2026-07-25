import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Award,
  ChevronRight,
  Loader2,
  Medal,
  Star,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  MapPin,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useReputation, fetchUserReports, calculateReputationStats, getBadgeStatus, BADGES } from "@/lib/reputation";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reputation")({
  component: ReputationPage,
});

function ReputationPage() {
  const { user, loading: authLoading } = useAuth();
  const { reporterKey } = useReputation();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "badges">("stats");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch reports
  const loadReports = async (isRefresh = false) => {
    if (!reporterKey) {
      setLoading(false);
      setReports([]);
      return;
    }
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUserReports(reporterKey);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!authLoading && reporterKey !== undefined) {
      loadReports();
    }
  }, [authLoading, reporterKey]);

  // Calculate stats from reports
  const stats = useMemo(() => {
    return calculateReputationStats(reports);
  }, [reports]);

  // Get badge statuses
  const badgeStatuses = useMemo(() => {
    return BADGES.map(badge => ({
      ...badge,
      ...getBadgeStatus(badge, stats),
    }));
  }, [stats]);

  const earnedBadges = badgeStatuses.filter((b) => b.earned);
  const inProgressBadges = badgeStatuses.filter((b) => !b.earned);

  const handleRetry = () => {
    loadReports();
  };

  const handleRefresh = () => {
    loadReports(true);
  };

  // Calculate progress percentage for rank bar
  const totalRankPoints = stats.points + stats.pointsToNextRank;
  const progressPercent = totalRankPoints > 0 ? (stats.points / totalRankPoints) * 100 : 0;

  // Show auth loading
  if (authLoading) {
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
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand/60 text-xl font-black text-brand-foreground">
            <Award className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Community
            </p>
            <h1 className="text-xl font-extrabold tracking-tight">
              Reputation & Badges
            </h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="grid size-9 place-items-center rounded-xl bg-surface-muted text-muted-foreground transition-colors hover:bg-surface-muted/80 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-danger" />
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="text-xs font-semibold text-danger underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Guest User Banner */}
      {!user && !loading && !error && (
        <div className="mx-5 mt-4 rounded-xl border border-brand/30 bg-brand/10 p-4">
          <p className="text-sm font-semibold text-foreground">Sign in to sync your stats</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your current stats are saved locally. Sign in to access them from any device and earn badges.
          </p>
          <Link
            to="/sign-in"
            className="mt-2 inline-block text-xs font-semibold text-brand underline"
          >
            Sign in or create account
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-5">
        <button
          onClick={() => setActiveTab("stats")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "stats"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab("badges")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "badges"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Badges ({earnedBadges.length}/{BADGES.length})
        </button>
      </div>

      {/* Content */}
      <main className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading reputation…
          </div>
        ) : activeTab === "stats" ? (
          <div className="space-y-6">
            {/* Rank Card */}
            <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-brand/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Current rank
                  </p>
                  <p className="mt-1 text-2xl font-black text-brand">
                    {stats.rank}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stats.points} points
                  </p>
                </div>
                <div className="text-right">
                  <Medal className="ml-auto size-12 text-brand" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Next: {stats.nextRank}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress to {stats.nextRank}</span>
                  <span>{stats.pointsToNextRank} pts to go</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-border">
                  <div
                    className="h-2 rounded-full bg-brand transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{stats.totalReports}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total reports
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{stats.uniqueBusinesses}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Places reported
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-black">{stats.currentStreak}</p>
                  {stats.currentStreak > 0 && <Flame className="size-5 text-orange-500" />}
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current streak
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{stats.longestStreak}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Best streak
                </p>
              </div>
            </div>

            {/* How to earn points */}
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                How to earn points
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Clock className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Submit wait report</p>
                    <p className="text-xs text-muted-foreground">+10 points</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-safe/10 text-safe">
                    <Shield className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Earn a badge</p>
                    <p className="text-xs text-muted-foreground">+10-300 points</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Star className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Consistent reporting</p>
                    <p className="text-xs text-muted-foreground">Build streaks for bonus points</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {stats.totalReports === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10">
                  <TrendingUp className="size-6 text-brand" />
                </div>
                <p className="font-semibold text-foreground">No reports yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submit your first wait time report to start building your reputation.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
                >
                  Find nearby places
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Earned ({earnedBadges.length})
                </p>
                <div className="space-y-2">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4"
                    >
                      <div className="grid size-12 place-items-center rounded-xl bg-brand text-2xl">
                        {badge.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-brand">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {badge.description}
                        </p>
                        {badge.earnedAt && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Earned {badge.earnedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {inProgressBadges.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  In Progress ({inProgressBadges.length})
                </p>
                <div className="space-y-2">
                  {inProgressBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
                    >
                      <div className="grid size-12 place-items-center rounded-xl bg-surface-muted text-2xl">
                        {badge.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {badge.description}
                        </p>
                        <div className="mt-2">
                          <div className="h-1.5 w-full rounded-full bg-border">
                            <div
                              className="h-1.5 rounded-full bg-brand transition-all"
                              style={{ width: `${badge.progress}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {Math.round(badge.progress)}% complete
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Badges Earned */}
            {earnedBadges.length === BADGES.length && (
              <div className="rounded-2xl border border-brand/30 bg-brand/10 p-6 text-center">
                <p className="text-lg font-bold text-brand">🎉 All badges earned!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You're a QueueLess legend. Keep reporting to maintain your streak!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
