import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Award,
  ChevronRight,
  Loader2,
  Medal,
  Star,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Users,
  MapPin,
  Lock,
  CheckCircle,
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getUserReputation, ReputationStats, BadgeProgress } from "@/lib/reputation";

export const Route = createFileRoute("/reputation")({
  component: ReputationPage,
});

// Map string icon names to Lucide components
const IconMap: Record<string, any> = {
  Zap,
  Star,
  Target,
  Award,
  Shield,
  MapPin,
  Users,
  TrendingUp,
};

function ReputationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"stats" | "badges">("stats");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeProgress | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { stats: userStats, badges: userBadges } = await getUserReputation(supabase, user.id);
        setStats(userStats);
        setBadges(userBadges);
      } catch (err) {
        console.error("Failed to load reputation:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <Medal className="mb-4 size-12 text-muted-foreground" />
          <h2 className="text-xl font-bold">Sign in to see your reputation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Track your reports, earn badges, and climb the ranks by joining the QueueLess community.
          </p>
          <Link
            to="/sign-in"
            className="mt-6 rounded-xl bg-brand px-6 py-3 font-bold text-brand-foreground"
          >
            Sign In or Create Account
          </Link>
        </div>
      </AppShell>
    );
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const inProgressBadges = badges.filter((b) => !b.earned);

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Your Profile
        </p>
        <h1 className="text-xl font-extrabold tracking-tight">Reputation & Badges</h1>
      </header>

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
          Badges ({earnedBadges.length}/{badges.length})
        </button>
      </div>

      {/* Content */}
      <main className="px-5 py-4">
        {loading || !stats ? (
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
                  <p className="mt-1 text-2xl font-black text-brand">{stats.rank}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stats.points} points</p>
                </div>
                <div className="text-right">
                  <Medal className="ml-auto size-12 text-brand" />
                  <p className="mt-1 text-xs text-muted-foreground">Next: {stats.nextRank}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress to {stats.nextRank}</span>
                  {stats.pointsToNextRank > 0 ? (
                    <span>{stats.pointsToNextRank} pts to go</span>
                  ) : (
                    <span>Max rank reached!</span>
                  )}
                </div>
                <div className="mt-2 h-2 rounded-full bg-border">
                  <div
                    className="h-2 rounded-full bg-brand transition-all"
                    style={{
                      width: `${stats.pointsToNextRank > 0 ? (stats.points / (stats.points + stats.pointsToNextRank)) * 100 : 100}%`,
                    }}
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
                <p className="text-2xl font-black">
                  {stats.totalReports === 0 ? "Not enough data yet." : `${stats.accuracyRate}%`}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Accuracy
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-black">{stats.currentStreak}</p>
                  {stats.currentStreak > 0 && <span className="text-xs text-safe">🔥</span>}
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
                    <p className="text-sm font-semibold">Report verified</p>
                    <p className="text-xs text-muted-foreground">+5 points</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Star className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Earn a badge</p>
                    <p className="text-xs text-muted-foreground">+50-500 points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Earned Badges */}
            {earnedBadges.length > 0 ? (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Earned ({earnedBadges.length})
                </p>
                <div className="space-y-2">
                  {earnedBadges.map((badge) => {
                    const Icon = IconMap[badge.icon] || Star;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4 text-left transition-colors hover:bg-brand/10"
                      >
                        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
                          <Icon className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-brand truncate">{badge.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {badge.description}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Earned {badge.earnedDate}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border border-dashed p-6 text-center">
                <Star className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="font-semibold">No badges earned yet</p>
                <p className="text-xs text-muted-foreground">Keep reporting to unlock badges!</p>
              </div>
            )}

            {/* In Progress */}
            {inProgressBadges.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  In Progress ({inProgressBadges.length})
                </p>
                <div className="space-y-2">
                  {inProgressBadges.map((badge) => {
                    const Icon = IconMap[badge.icon] || Star;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-muted"
                      >
                        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                          <Icon className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{badge.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
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
                              {badge.progress}% complete
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`grid size-24 place-items-center rounded-2xl ${
                  selectedBadge.earned
                    ? "bg-brand text-brand-foreground shadow-lg shadow-brand/30"
                    : "bg-surface-muted text-muted-foreground"
                }`}
              >
                {(() => {
                  const ModalIcon = IconMap[selectedBadge.icon] || Star;
                  return <ModalIcon className="size-12" />;
                })()}
              </div>
            </div>

            <div className="text-center mb-6">
              <h3
                className={`text-xl font-bold ${selectedBadge.earned ? "text-brand" : "text-foreground"}`}
              >
                {selectedBadge.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{selectedBadge.description}</p>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold flex items-center gap-1">
                  {selectedBadge.earned ? (
                    <>
                      <CheckCircle className="size-4 text-brand" /> Earned
                    </>
                  ) : selectedBadge.progress === 0 ? (
                    <>
                      <Lock className="size-4 text-muted-foreground" /> Locked
                    </>
                  ) : (
                    "In Progress"
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Reward</span>
                <span className="font-semibold text-brand">+{selectedBadge.points_reward} pts</span>
              </div>

              {!selectedBadge.earned && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold">
                      {selectedBadge.requirement_type === "time_before" ||
                      selectedBadge.requirement_type === "time_after"
                        ? `${selectedBadge.progress}%`
                        : `${Math.round((selectedBadge.progress / 100) * selectedBadge.requirement_value)}/${selectedBadge.requirement_value}`}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-brand transition-all duration-500"
                      style={{ width: `${selectedBadge.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedBadge.earned && selectedBadge.earnedDate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Earned Date</span>
                  <span className="font-semibold">{selectedBadge.earnedDate}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-6 w-full rounded-xl bg-surface px-4 py-3 font-semibold transition-colors hover:bg-surface-muted"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
