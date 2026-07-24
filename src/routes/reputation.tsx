import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getUserReputation } from "@/lib/queueless.functions";
import { getReporterKey } from "@/lib/queueless-data";

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

const mockStats: ReputationStats = {
  totalReports: 47,
  verifiedReports: 42,
  accuracyRate: 89,
  currentStreak: 5,
  longestStreak: 12,
  rank: "Silver Reporter",
  points: 1240,
  nextRank: "Gold Reporter",
  pointsToNextRank: 760,
};

const mockBadges: Badge[] = [
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Submit a report before 8 AM",
    icon: Zap,
    earned: true,
    earnedDate: "Mar 15, 2024",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Submit a report after 10 PM",
    icon: Star,
    earned: true,
    earnedDate: "Feb 28, 2024",
  },
  {
    id: "streaker",
    name: "7-Day Streak",
    description: "Report for 7 consecutive days",
    icon: Target,
    earned: true,
    earnedDate: "Apr 2, 2024",
  },
  {
    id: "century",
    name: "Century Club",
    description: "Submit 100 reports",
    icon: Award,
    earned: false,
    progress: 47,
  },
  {
    id: "accuracy_master",
    name: "Accuracy Master",
    description: "Achieve 95% verification rate",
    icon: Shield,
    earned: false,
    progress: 89,
  },
  {
    id: "local_expert",
    name: "Local Expert",
    description: "Report at 25 unique businesses",
    icon: MapPin,
    earned: false,
    progress: 18,
  },
  {
    id: "verifier",
    name: "Community Verifier",
    description: "Help verify 50 reports",
    icon: Users,
    earned: false,
    progress: 0,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Maintain a 30-day streak",
    icon: TrendingUp,
    earned: false,
    progress: 17,
  },
];

function ReputationPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "badges">("stats");
  const { user } = useAuth();
  const reporterKeys = [user?.id, getReporterKey()].filter(Boolean) as string[];
  const reputationQuery = useQuery({
    queryKey: ["reputation", reporterKeys],
    queryFn: () => getUserReputation({ data: { reporterKeys } }),
    enabled: true,
  });

  const loading = reputationQuery.isLoading;
  const data = reputationQuery.data;
  const dataBadges = reputationQuery.data?.badges ?? mockBadges;

  const earnedBadges = dataBadges.filter((b) => b.earned);
  const inProgressBadges = dataBadges.filter((b) => !b.earned);

  return (
    <AppShell>
      {/* Header */}
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
          Badges ({earnedBadges.length}/{dataBadges.length})
        </button>
      </div>

      {/* Content */}
      <main className="px-5 py-4">
        {loading || !data ? (
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
                  <p className="mt-1 text-2xl font-black text-brand">{data.rank}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{data.points} points</p>
                </div>
                <div className="text-right">
                  <Medal className="ml-auto size-12 text-brand" />
                  <p className="mt-1 text-xs text-muted-foreground">Next: {data.nextRank}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress to {data.nextRank}</span>
                  <span>{data.pointsToNextRank} pts to go</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-border">
                  <div
                    className="h-2 rounded-full bg-brand transition-all"
                    style={{
                      width: `${(data.points / (data.points + data.pointsToNextRank)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{data.totalReports}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total reports
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{data.accuracyRate}%</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Accuracy
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-black">{data.currentStreak}</p>
                  <span className="text-xs text-safe">🔥</span>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current streak
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-2xl font-black">{data.longestStreak}</p>
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
                    <p className="text-xs text-muted-foreground">+50-200 points</p>
                  </div>
                </div>
              </div>
            </div>
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
                  {earnedBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4"
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
                      </div>
                    );
                  })}
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
                  {inProgressBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
