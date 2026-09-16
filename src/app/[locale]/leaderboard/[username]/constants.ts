// ── Constants ─────────────────────────────────────────────────────────
// DAY_LABELS, TREND_DISPLAY, and LEVEL_STYLES are shared with
// ../ContributorHoverCard.tsx and ../types.ts — see
// src/lib/leaderboardShared.ts for the single canonical copy.

export {
  DAY_LABELS,
  LEVEL_STYLES,
  TREND_DISPLAY,
} from "../../../../lib/leaderboardShared";

export const REPO_COLORS: Record<string, string> = {
  console: "text-blue-400 bg-blue-500/10",
  docs: "text-green-400 bg-green-500/10",
  "console-kb": "text-purple-400 bg-purple-500/10",
  "console-marketplace": "text-orange-400 bg-orange-500/10",
};

// ── Radar Chart geometry ──────────────────────────────────────────────
// Shared constants & functions imported from src/lib/radar.ts

/** Radar chart radius in SVG units */
export const RADAR_RADIUS = 120;
/** Center coordinate for the radar chart SVG */
export const RADAR_CENTER = 150;
/** Number of concentric grid rings */
export const RADAR_GRID_RINGS = 4;
