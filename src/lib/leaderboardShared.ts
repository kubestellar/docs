// ── Shared leaderboard constants/types ─────────────────────────────────
// Single source of truth for the visual/style layer shared between
// src/app/[locale]/leaderboard/page.tsx and
// src/app/[locale]/leaderboard/[username]/page.tsx.
//
// These previously lived as separate, hand-copied definitions in both
// pages and had drifted (the [username] page's LEVEL_STYLES.Legend was
// missing the glow shadow present in the main leaderboard page). Import
// from here instead of re-declaring local copies.

/** Contributor level → Tailwind color/border style (mirrors console's CONTRIBUTOR_LEVELS). */
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

/** Contribution cadence trend → label/color/arrow. */
export const TREND_DISPLAY: Record<
  string,
  { label: string; color: string; arrow: string }
> = {
  ramping_up: { label: "Ramping Up", color: "text-green-400", arrow: "\u2191" },
  steady: { label: "Steady", color: "text-blue-400", arrow: "\u2192" },
  slowing_down: {
    label: "Slowing Down",
    color: "text-yellow-400",
    arrow: "\u2193",
  },
  inactive: { label: "Inactive", color: "text-gray-500", arrow: "\u2014" },
};

/** Short weekday labels used by cadence/activity sparklines. */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A single month's issue-count bucket in an activity timeline. */
export interface TimelineEntry {
  month: string;
  issue_count: number;
}
