// ── Types ─────────────────────────────────────────────────────────────

export interface TopicCluster {
  name: string;
  issue_count: number;
  recent_issue: { title: string; url: string; created_at: string };
  repos: string[];
  open_count: number;
  closed_count: number;
}

export interface Suggestion {
  title: string;
  url: string;
  repo: string;
  topic_match: string;
}

export interface StretchArea {
  name: string;
  path: string;
  description: string;
  url: string;
}

export interface CadenceData {
  avg_per_week: number;
  avg_per_day: number;
  by_day_of_week: number[];
  by_hour_of_day: number[];
  current_streak_weeks: number;
  longest_streak_weeks: number;
  trend: "ramping_up" | "steady" | "slowing_down" | "inactive";
  first_issue_at: string | null;
  last_issue_at: string | null;
}

export interface TimelineEntry {
  month: string;
  issue_count: number;
}

export interface RepoContribution {
  repo: string;
  bug_issues: number;
  feature_issues: number;
  other_issues: number;
  prs_opened: number;
  prs_merged: number;
}

export interface ContributorProfile {
  login: string;
  generated_at: string;
  total_issues_opened: number;
  total_prs_opened?: number;
  avatar_url: string;
  total_points: number;
  level: string;
  level_rank: number;
  rank: number;
  cadence: CadenceData;
  topics: TopicCluster[];
  suggestions: {
    deepen: Suggestion[];
    stretch: StretchArea[];
  };
  activity_timeline: TimelineEntry[];
  repo_breakdown?: RepoContribution[];
}

export interface LeaderboardEntry {
  login: string;
  avatar_url: string;
  total_points: number;
  level: string;
  level_rank: number;
  rank: number;
  breakdown: {
    bug_issues: number;
    feature_issues: number;
    other_issues: number;
    prs_opened: number;
    prs_merged: number;
  };
  bonus_points: number;
}

export interface LeaderboardData {
  generated_at: string;
  entries: LeaderboardEntry[];
}
