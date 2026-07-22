import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useAuth } from "@/lib/auth";
import { getReporterKey } from "@/lib/queueless-data";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/reputation")({
  component: ReputationPage,
});

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: typeof Star;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  progressText?: string;
  target: number;
  reward: number;
};

type ReputationStats = {
  totalReports: number;
  verifiedReports: number;
  accuracyRate: number;
  currentStreak: number;
  longestStreak: number;
  rank: string;
  points: number;
  nextRank: string;
  pointsToNextRank: number;
};

function ReputationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "badges">("stats");
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const reporterKey = user?.id || getReporterKey();

        const { data: reports, error: fetchError } = await supabase
          .from("wait_reports")
          .select("*")
          .eq("reporter_key", reporterKey);

        if (fetchError) throw fetchError;

        const totalReports = reports?.length || 0;

        // Calculate Streaks
        const dates = (reports || [])
          .map((r) => new Date(r.created_at).toLocaleDateString())
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const uniqueDates = [...new Set(dates)];

        let bestStreak = 0;
        let tempStreak = 0;
        let lastDate: Date | null = null;

        uniqueDates.forEach((dateStr) => {
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

        let currentStreak = 0;
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

        const uniqueBusinesses = new Set((reports || []).map((r) => r.business_id)).size;

        const earlyBirdReports = (reports || []).filter((r) => {
          const hour = new Date(r.created_at).getHours();
          return hour < 8;
        });

        const nightOwlReports = (reports || []).filter((r) => {
          const hour = new Date(r.created_at).getHours();
          return hour >= 22;
        });

        const calculatedBadges: Badge[] = [
          {
            id: "early_bird",
            name: "Early Bird",
            description: "Submit a report before 8 AM",
            icon: Zap,
            earned: earlyBirdReports.length > 0,
            earnedDate:
              earlyBirdReports.length > 0
                ? new Date(earlyBirdReports[0].created_at).toLocaleDateString()
                : undefined,
            progress: earlyBirdReports.length > 0 ? 100 : 0,
            progressText: earlyBirdReports.length > 0 ? "1/1" : "0/1",
            target: 1,
            reward: 50,
          },
          {
            id: "night_owl",
            name: "Night Owl",
            description: "Submit a report after 10 PM",
            icon: Star,
            earned: nightOwlReports.length > 0,
            earnedDate:
              nightOwlReports.length > 0
                ? new Date(nightOwlReports[0].created_at).toLocaleDateString()
                : undefined,
            progress: nightOwlReports.length > 0 ? 100 : 0,
            progressText: nightOwlReports.length > 0 ? "1/1" : "0/1",
            target: 1,
            reward: 50,
          },
          {
            id: "streaker",
            name: "7-Day Streak",
            description: "Report for 7 consecutive days",
            icon: Target,
            earned: bestStreak >= 7,
            progress: Math.min(Math.round((bestStreak / 7) * 100), 100),
            progressText: `${Math.min(bestStreak, 7)}/7`,
            target: 7,
            reward: 100,
          },
          {
            id: "century",
            name: "Century Club",
            description: "Submit 100 reports",
            icon: Award,
            earned: totalReports >= 100,
            progress: Math.min(Math.round((totalReports / 100) * 100), 100),
            progressText: `${Math.min(totalReports, 100)}/100`,
            target: 100,
            reward: 200,
          },
          {
            id: "accuracy_master",
            name: "Accuracy Master",
            description: "Achieve 95% verification rate",
            icon: Shield,
            earned: false,
            progress: 0,
            progressText: "0/100",
            target: 100,
            reward: 150,
          },
          {
            id: "local_expert",
            name: "Local Expert",
            description: "Report at 25 unique businesses",
            icon: MapPin,
            earned: uniqueBusinesses >= 25,
            progress: Math.min(Math.round((uniqueBusinesses / 25) * 100), 100),
            progressText: `${Math.min(uniqueBusinesses, 25)}/25`,
            target: 25,
            reward: 150,
          },
          {
            id: "verifier",
            name: "Community Verifier",
            description: "Help verify 50 reports",
            icon: Users,
            earned: false,
            progress: 0,
            progressText: "0/50",
            target: 50,
            reward: 100,
          },
          {
            id: "streak_master",
            name: "Streak Master",
            description: "Maintain a 30-day streak",
            icon: TrendingUp,
            earned: bestStreak >= 30,
            progress: Math.min(Math.round((bestStreak / 30) * 100), 100),
            progressText: `${Math.min(bestStreak, 30)}/30`,
            target: 30,
            reward: 200,
          },
        ];

        let points = totalReports * 10;
        calculatedBadges.forEach((b) => {
          if (b.earned) points += b.reward;
        });

        const ranks = [
          { name: "New Reporter", threshold: 0 },
          { name: "Bronze Reporter", threshold: 100 },
          { name: "Silver Reporter", threshold: 500 },
          { name: "Gold Reporter", threshold: 1000 },
          { name: "Platinum Reporter", threshold: 2500 },
          { name: "Diamond Reporter", threshold: 5000 },
        ];

        let rank = ranks[0];
        let nextRank = ranks[1];

        for (let i = 0; i < ranks.length; i++) {
          if (points >= ranks[i].threshold) {
            rank = ranks[i];
            nextRank = ranks[i + 1] || {
              name: "Max Rank",
              threshold: ranks[i].threshold,
            };
          }
        }

        let pointsToNextRank = 0;
        if (nextRank.name !== "Max Rank") {
          pointsToNextRank = nextRank.threshold - points;
        }

        setStats({
          totalReports,
          verifiedReports: 0,
          accuracyRate: -1,
          currentStreak,
          longestStreak: bestStreak,
          rank: rank.name,
          points,
          nextRank: nextRank.name,
          pointsToNextRank,
        });

        setBadges(calculatedBadges);
      } catch (err: unknown) {
        console.error("Error fetching reputation:", err);
        setError("Failed to load reputation data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const earnedBadges = badges.filter((b) => b.earned);
  const inProgressBadges = badges.filter((b) => !b.earned);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand/60 text-xl font-black text-brand-foreground">
            <Award className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Community
            </p>
            <h1 className="text-xl font-extrabold tracking-tight">Reputation & Badges</h1>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

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
          Badges ({earnedBadges.length}/{badges.length || 8})
        </button>
      </div>

      <main className="px-5 py-4">
        {loading || !stats ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading reputation…
          </div>
        ) : activeTab === "stats" ? (
          <div className="space-y-6">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.nextRank !== "Max Rank"
                      ? `Next: ${stats.nextRank}`
                      : "Max Rank Achieved"}
                  </p>
                </div>
              </div>
              {stats.nextRank !== "Max Rank" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress to {stats.nextRank}</span>
                    <span>{stats.pointsToNextRank} pts to go</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-brand transition-all"
                      style={{
                        width: `${(stats.points / (stats.points + stats.pointsToNextRank)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{stats.totalReports}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total reports
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p
                  className={`text-2xl font-black ${stats.accuracyRate === -1 ? "text-muted-foreground text-sm" : ""}`}
                >
                  {stats.accuracyRate === -1 ? "Not enough data yet." : `${stats.accuracyRate}%`}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Accuracy
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-black">{stats.currentStreak}</p>
                  <span className="text-xs text-safe">🔥</span>
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
                    <p className="text-xs text-muted-foreground">+50-200 points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {badges.length === 0 && !loading && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No badges available.
              </div>
            )}

            {earnedBadges.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No badges earned yet. Complete challenges to earn them!
              </div>
            )}

            {earnedBadges.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Earned ({earnedBadges.length})
                </p>
                <div className="space-y-2">
                  {earnedBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className="w-full text-left flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4 hover:bg-brand/10 transition-colors"
                      >
                        <div className="grid size-12 place-items-center rounded-xl bg-brand text-brand-foreground">
                          <Icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-brand">{badge.name}</p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Earned {badge.earnedDate}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {inProgressBadges.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  In Progress ({inProgressBadges.length})
                </p>
                <div className="space-y-2">
                  {inProgressBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className="w-full text-left flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-brand/30 transition-colors"
                      >
                        <div className="grid size-12 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                          <Icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{badge.name}</p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                          {badge.progress !== undefined && (
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
                          )}
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-md w-[90%] rounded-3xl mx-auto">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center font-extrabold text-xl">
                  {selectedBadge.name}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {selectedBadge.description}
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 flex flex-col items-center">
                <div
                  className={`grid size-24 place-items-center rounded-2xl mb-6 ${
                    selectedBadge.earned
                      ? "bg-brand text-brand-foreground"
                      : "bg-surface-muted text-muted-foreground border border-border"
                  }`}
                >
                  <selectedBadge.icon className="size-12" />
                </div>

                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span>Progress</span>
                    <span>{selectedBadge.progressText || `${selectedBadge.progress}%`}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-brand transition-all"
                      style={{ width: `${selectedBadge.progress || 0}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="rounded-xl border border-border p-3 text-center bg-surface-muted/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </p>
                      <p className={`mt-1 font-bold ${selectedBadge.earned ? "text-brand" : ""}`}>
                        {selectedBadge.earned
                          ? "Earned"
                          : selectedBadge.progress && selectedBadge.progress > 0
                            ? "In Progress"
                            : "Locked"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center bg-surface-muted/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Reward
                      </p>
                      <p className="mt-1 font-bold text-brand">+{selectedBadge.reward} pts</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-muted p-4 mt-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Target className="size-4 text-brand" />
                      Unlock Requirement
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBadge.description} ({selectedBadge.target} required)
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
