import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type ReputationStats = {
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

export type BadgeProgress = {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  earned: boolean;
  earnedDate?: string;
  progress: number;
  requirement_type: string;
  requirement_value: number;
};

const RANKS = [
  { name: "New Reporter", min: 0 },
  { name: "Bronze Reporter", min: 100 },
  { name: "Silver Reporter", min: 500 },
  { name: "Gold Reporter", min: 1000 },
  { name: "Platinum Reporter", min: 2500 },
  { name: "Diamond Reporter", min: 5000 },
];

export async function getUserReputation(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ stats: ReputationStats; badges: BadgeProgress[] }> {
  // 1. Get raw points & rank from reputation table
  const { data: rep } = await supabase
    .from("reputation")
    .select("*")
    .eq("user_id", userId)
    .single();

  const points = rep?.points || 0;

  let currentRank = RANKS[0].name;
  let nextRank = RANKS[1].name;
  let pointsToNext = RANKS[1].min;

  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].min) {
      currentRank = RANKS[i].name;
      if (i + 1 < RANKS.length) {
        nextRank = RANKS[i + 1].name;
        pointsToNext = RANKS[i + 1].min - points;
      } else {
        nextRank = "Max Rank";
        pointsToNext = 0;
      }
    }
  }

  // 2. Get user reports to calculate stats
  const { data: reports } = await supabase
    .from("wait_reports")
    .select("created_at, source")
    .eq("reporter_key", userId)
    .order("created_at", { ascending: true });

  const allReports = reports || [];
  const totalReports = allReports.length;
  const verifiedReports = allReports.filter(
    (r) => r.source === "exact" || r.source === "timer",
  ).length;

  let accuracyRate = 0;
  if (totalReports > 0) {
    accuracyRate = Math.round((verifiedReports / totalReports) * 100);
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;

  if (allReports.length > 0) {
    const dates = [
      ...new Set(allReports.map((r) => new Date(r.created_at).toISOString().split("T")[0])),
    ].sort();

    let tempStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      // Create UTC dates ignoring time to ensure reliable calendar-day difference
      const d1 = Date.UTC(curr.getFullYear(), curr.getMonth(), curr.getDate());
      const d2 = Date.UTC(prev.getFullYear(), prev.getMonth(), prev.getDate());
      const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = maxStreak;

    // Check if current streak is active (today or yesterday)
    const lastDate = new Date(dates[dates.length - 1]);
    const today = new Date();
    // Create UTC dates ignoring time
    const t1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const t2 = Date.UTC(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDaysEnd = Math.floor((t1 - t2) / (1000 * 60 * 60 * 24));

    if (diffDaysEnd <= 1) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }
  }

  const stats: ReputationStats = {
    totalReports,
    verifiedReports,
    accuracyRate,
    currentStreak,
    longestStreak,
    rank: currentRank,
    points,
    nextRank,
    pointsToNextRank: pointsToNext,
  };

  // 3. Get all badges
  const { data: allBadges } = await supabase.from("badges").select("*");
  const badgesData = allBadges || [];

  // 4. Get earned badges
  const { data: earned } = await supabase.from("user_badges").select("*").eq("user_id", userId);
  const earnedBadges = earned || [];

  const earnedBadgeMap = new Map();
  for (const b of earnedBadges) {
    earnedBadgeMap.set(b.badge_id, b.earned_at);
  }

  // 5. Calculate progress for each badge
  const badges: BadgeProgress[] = badgesData.map((badge) => {
    let progress = 0;

    // Time-based badges would need complex parsing, simplifying here based on totalReports
    if (badge.requirement_type === "total_reports") {
      progress = totalReports;
    } else if (badge.requirement_type === "accuracy") {
      progress = accuracyRate;
    } else if (badge.requirement_type === "streak") {
      progress = longestStreak;
    } else if (badge.requirement_type === "verifications") {
      progress = verifiedReports;
    } else {
      // Fallback
      progress = totalReports;
    }

    const isEarned = earnedBadgeMap.has(badge.id);
    let progressPercent = 0;

    if (isEarned) {
      progressPercent = 100;
    } else {
      progressPercent = Math.min(100, Math.round((progress / badge.requirement_value) * 100));
    }

    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points_reward: badge.points_reward,
      earned: isEarned,
      earnedDate: isEarned
        ? new Date(earnedBadgeMap.get(badge.id)).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : undefined,
      progress: progressPercent,
      requirement_type: badge.requirement_type,
      requirement_value: badge.requirement_value,
    };
  });

  return { stats, badges };
}
