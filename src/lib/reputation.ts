import { useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "./auth";
import { getReporterKey } from "./queueless-data";

// Reporter key storage
const REPORTER_KEY_STORAGE = "queueless.reporter.v1";

/**
 * Get the reporter key for the current user.
 * - For signed-in users: uses their auth ID
 * - For guests: uses a stable UUID stored in localStorage
 */
export function getReporterKeyWithAuth(): string {
  if (typeof window === "undefined") return "ssr";
  return getReporterKey();
}

/**
 * Badge definitions with unlock conditions
 */
export type BadgeId =
  | "first_report"
  | "early_bird"
  | "night_owl"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "reports_10"
  | "reports_50"
  | "reports_100"
  | "unique_businesses_5"
  | "unique_businesses_25";

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  points: number;
  requirement: (stats: UserReputationStats) => { earned: boolean; progress?: number };
}

export interface EarnedBadge {
  id: BadgeId;
  earnedAt: string;
}

export interface UserReputationStats {
  totalReports: number;
  verifiedReports: number;
  accuracyRate: number;
  currentStreak: number;
  longestStreak: number;
  uniqueBusinesses: number;
  points: number;
  rank: string;
  nextRank: string;
  pointsToNextRank: number;
  earnedBadges: EarnedBadge[];
  allBadges: BadgeDefinition[];
}

// Badge definitions
export const BADGES: BadgeDefinition[] = [
  {
    id: "first_report",
    name: "First Steps",
    description: "Submit your first wait time report",
    icon: "🎯",
    points: 10,
    requirement: (stats) => ({ earned: stats.totalReports >= 1, progress: Math.min(100, stats.totalReports * 100) }),
  },
  {
    id: "reports_10",
    name: "Active Reporter",
    description: "Submit 10 reports",
    icon: "📊",
    points: 50,
    requirement: (stats) => ({ earned: stats.totalReports >= 10, progress: Math.min(100, (stats.totalReports / 10) * 100) }),
  },
  {
    id: "reports_50",
    name: "Dedicated Reporter",
    description: "Submit 50 reports",
    icon: "🏆",
    points: 100,
    requirement: (stats) => ({ earned: stats.totalReports >= 50, progress: Math.min(100, (stats.totalReports / 50) * 100) }),
  },
  {
    id: "reports_100",
    name: "Century Club",
    description: "Submit 100 reports",
    icon: "💯",
    points: 200,
    requirement: (stats) => ({ earned: stats.totalReports >= 100, progress: Math.min(100, (stats.totalReports / 100) * 100) }),
  },
  {
    id: "streak_3",
    name: "3-Day Streak",
    description: "Report for 3 consecutive days",
    icon: "🔥",
    points: 25,
    requirement: (stats) => ({ earned: stats.currentStreak >= 3, progress: Math.min(100, (stats.currentStreak / 3) * 100) }),
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Report for 7 consecutive days",
    icon: "⚡",
    points: 75,
    requirement: (stats) => ({ earned: stats.currentStreak >= 7, progress: Math.min(100, (stats.currentStreak / 7) * 100) }),
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Report for 30 consecutive days",
    icon: "🌟",
    points: 300,
    requirement: (stats) => ({ earned: stats.currentStreak >= 30, progress: Math.min(100, (stats.currentStreak / 30) * 100) }),
  },
  {
    id: "unique_businesses_5",
    name: "Local Explorer",
    description: "Report at 5 different businesses",
    icon: "🗺️",
    points: 30,
    requirement: (stats) => ({ earned: stats.uniqueBusinesses >= 5, progress: Math.min(100, (stats.uniqueBusinesses / 5) * 100) }),
  },
  {
    id: "unique_businesses_25",
    name: "Neighborhood Expert",
    description: "Report at 25 different businesses",
    icon: "🏘️",
    points: 150,
    requirement: (stats) => ({ earned: stats.uniqueBusinesses >= 25, progress: Math.min(100, (stats.uniqueBusinesses / 25) * 100) }),
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Submit a report before 8 AM",
    icon: "🌅",
    points: 15,
    requirement: (stats) => ({ earned: false, progress: 0 }), // Requires date checking
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Submit a report after 10 PM",
    icon: "🦉",
    points: 15,
    requirement: (stats) => ({ earned: false, progress: 0 }), // Requires date checking
  },
];

// Rank thresholds
const RANKS = [
  { name: "Newcomer", minPoints: 0 },
  { name: "Bronze Reporter", minPoints: 100 },
  { name: "Silver Reporter", minPoints: 500 },
  { name: "Gold Reporter", minPoints: 1000 },
  { name: "Platinum Reporter", minPoints: 2500 },
  { name: "Diamond Reporter", minPoints: 5000 },
];

function getRankAndProgress(points: number): { rank: string; nextRank: string; pointsToNextRank: number } {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1] || RANKS[0];
  
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || RANKS[i];
      break;
    }
  }
  
  const progressPoints = nextRank === currentRank ? 0 : nextRank.minPoints - points;
  
  return {
    rank: currentRank.name,
    nextRank: nextRank.name,
    pointsToNextRank: Math.max(0, progressPoints),
  };
}

// Calculate streak from reports
function calculateStreak(reportDates: Date[]): { current: number; longest: number } {
  if (reportDates.length === 0) return { current: 0, longest: 0 };
  
  // Sort dates ascending (oldest first)
  const sorted = [...reportDates].sort((a, b) => a.getTime() - b.getTime());
  
  // Get unique days in ascending order
  const uniqueDays = new Set<string>();
  sorted.forEach(d => {
    uniqueDays.add(d.toISOString().split('T')[0]);
  });
  
  const days = Array.from(uniqueDays).sort(); // ascending order
  if (days.length === 0) return { current: 0, longest: 0 };
  
  // Check if today or yesterday has a report (for current streak)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const hasRecent = days[days.length - 1] === today || days[days.length - 1] === yesterday;
  
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;
  let inCurrentSegment = hasRecent; // Track if we're in the current contiguous segment
  
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    
    if (diff === 1) {
      // Consecutive day
      streak++;
      if (inCurrentSegment) {
        currentStreak++;
      }
    } else {
      // Gap found - update longest and reset
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
      inCurrentSegment = false; // Stop tracking current streak after first gap
    }
  }
  
  // Final update for last streak
  longestStreak = Math.max(longestStreak, streak);
  
  // If we never had a gap after starting, currentStreak equals the last streak
  if (inCurrentSegment && currentStreak === 0 && streak > 0) {
    currentStreak = streak;
  }
  
  return { current: currentStreak, longest: longestStreak };
}

export interface ReportRecord {
  id: string;
  business_id: string;
  minutes: number;
  source: string;
  comment: string | null;
  created_at: string;
  reporter_key: string | null;
}

export function useReputation() {
  const { user } = useAuth();
  
  // Get the reporter key - use user ID if signed in, otherwise localStorage key
  const reporterKey = useMemo(() => {
    if (user?.id) {
      return user.id; // Use authenticated user ID
    }
    // For guests, use a stable localStorage key
    if (typeof window !== "undefined") {
      let key = localStorage.getItem(REPORTER_KEY_STORAGE);
      if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem(REPORTER_KEY_STORAGE, key);
      }
      return key;
    }
    return null;
  }, [user?.id]);
  
  return { reporterKey, userId: user?.id };
}

export async function fetchUserReports(reporterKey: string | null): Promise<ReportRecord[]> {
  if (!reporterKey) return [];
  
  try {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      { auth: { persistSession: false } }
    );
    
    const { data, error } = await supabase
      .from("wait_reports")
      .select("*")
      .eq("reporter_key", reporterKey)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[Reputation] Error fetching reports:", error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error("[Reputation] Error fetching reports:", err);
    return [];
  }
}

export function calculateReputationStats(
  reports: ReportRecord[],
  earnedBadges: EarnedBadge[] = []
): UserReputationStats {
  const totalReports = reports.length;
  
  // Get unique businesses
  const uniqueBusinessIds = new Set(reports.map(r => r.business_id));
  const uniqueBusinesses = uniqueBusinessIds.size;
  
  // Calculate streaks
  const reportDates = reports.map(r => new Date(r.created_at));
  const { current: currentStreak, longest: longestStreak } = calculateStreak(reportDates);
  
  // Calculate points
  const badgePoints = earnedBadges.reduce((sum, badge) => {
    const def = BADGES.find(b => b.id === badge.id);
    return sum + (def?.points || 0);
  }, 0);
  const reportPoints = totalReports * 10; // 10 points per report
  const points = reportPoints + badgePoints;
  
  // Get rank
  const { rank, nextRank, pointsToNextRank } = getRankAndProgress(points);
  
  // Calculate accuracy (verified reports / total reports)
  // For now, we don't have verification data, so we'll use a placeholder
  const accuracyRate = totalReports > 0 ? Math.min(95, 50 + totalReports * 2) : 0;
  
  return {
    totalReports,
    verifiedReports: Math.floor(totalReports * 0.8), // Placeholder
    accuracyRate,
    currentStreak,
    longestStreak,
    uniqueBusinesses,
    points,
    rank,
    nextRank,
    pointsToNextRank,
    earnedBadges,
    allBadges: BADGES,
  };
}

export function getBadgeStatus(
  badge: BadgeDefinition,
  stats: UserReputationStats
): { earned: boolean; progress: number; earnedAt?: string } {
  // Check both persisted earned badges AND computed requirement
  const persistedEarned = stats.earnedBadges.some(b => b.id === badge.id);
  const requirement = badge.requirement(stats);
  const computedEarned = requirement.earned;
  
  // Badge is earned if either persisted or computed from current stats
  const earned = persistedEarned || computedEarned;
  const earnedBadge = stats.earnedBadges.find(b => b.id === badge.id);
  
  return {
    earned,
    progress: earned ? 100 : requirement.progress || 0,
    earnedAt: earnedBadge?.earnedAt, // Only available if persisted
  };
}
