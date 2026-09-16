// ── Types ─────────────────────────────────────────────────────────────

import type { LevelStyle } from "../../../lib/leaderboardShared";
import { LEVEL_STYLES as SHARED_LEVEL_STYLES } from "../../../lib/leaderboardShared";

export type { LevelStyle };
export const LEVEL_STYLES = SHARED_LEVEL_STYLES;

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

// ── Medal icons for top 3 ─────────────────────────────────────────────

export const GOLD_MEDAL = "🥇";
export const SILVER_MEDAL = "🥈";
export const BRONZE_MEDAL = "🥉";
