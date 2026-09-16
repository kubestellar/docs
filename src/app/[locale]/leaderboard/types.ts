// ── Types ─────────────────────────────────────────────────────────────

export interface LeaderboardBreakdown {
  bug_issues: number;
  feature_issues: number;
  other_issues: number;
  prs_opened: number;
  prs_merged: number;
}

export interface LeaderboardEntry {
  rank: number;
  login: string;
  avatar_url: string;
  total_points: number;
  level: string;
  level_rank: number;
  breakdown: LeaderboardBreakdown;
  weekly_activity?: number[];
  recent_activity_score?: number;
}

export type SortField = "points" | "activity";
export type SortDir = "asc" | "desc";

export interface LeaderboardData {
  generated_at: string;
  git_hash?: string;
  activity_weeks?: string[];
  entries: LeaderboardEntry[];
}

// ── Affiliate/social click data ──────────────────────────────────────

export interface AffiliateData {
  clicks: number;
  unique_users: number;
  utm_term: string;
}

/** URL for the affiliate clicks API (hosted on console.kubestellar.io) */
export const AFFILIATE_API_URL = "https://console.kubestellar.io/api/affiliate/clicks";
/** Fetch timeout for affiliate data (15 seconds — the console.kubestellar.io
 *  endpoint is served by Netlify Functions which can cold-start past a
 *  tighter budget on first visit, making the social section appear empty
 *  until the user refreshes the page). */
export const AFFILIATE_FETCH_TIMEOUT_MS = 15_000;
/** Delay before retrying a failed affiliate fetch (ms). One retry only. */
export const AFFILIATE_RETRY_DELAY_MS = 2_000;

// ── Contributor level colors (mirrors console's CONTRIBUTOR_LEVELS) ───

export interface LevelStyle {
  bg: string;
  text: string;
  border: string;
}

export const LEVEL_STYLES: Record<string, LevelStyle> = {
  Observer: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
  Explorer: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Navigator: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  Pilot: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  Commander: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  Captain: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },

  Admiral: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },

  Legend: {
    bg: "bg-gradient-to-r from-yellow-400/30 via-amber-300/30 to-yellow-500/30 shadow-[0_0_10px_rgba(255,215,0,0.3)]",
    text: "text-yellow-300",
    border: "border-yellow-400/50",
  },
};

// ── Medal icons for top 3 ─────────────────────────────────────────────

export const GOLD_MEDAL = "🥇";
export const SILVER_MEDAL = "🥈";
export const BRONZE_MEDAL = "🥉";
