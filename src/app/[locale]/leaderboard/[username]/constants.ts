// ── Constants ─────────────────────────────────────────────────────────

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export const LEVEL_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
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
    bg: "bg-gradient-to-r from-yellow-400/30 via-amber-300/30 to-yellow-500/30",
    text: "text-yellow-300",
    border: "border-yellow-400/50",
  },
};

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
