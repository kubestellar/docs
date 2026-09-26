import { CUMULATIVE_SCANNABLE, LEVELS, MIN_LEVEL, TOTAL_SCANNABLE } from "./scoring";

// ── Medal icons ───────────────────────────────────────────────────────
// RankDisplay lives in src/lib/RankDisplay.tsx now — see docs #7076.
// Re-exported so ./page.tsx's existing import path keeps working.
export { RankDisplay } from "../../../lib/RankDisplay";

// ── Level badge ───────────────────────────────────────────────────────

export function LevelBadge({ level, unmetPrereqs }: { level: number; unmetPrereqs?: boolean }) {
  // Displayed level is clamped to L1+ — L0 is never shown as its own tier.
  const displayLevel = Math.max(level, MIN_LEVEL);
  const meta = LEVELS[displayLevel] || LEVELS[MIN_LEVEL];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}
      title={unmetPrereqs ? "Baseline prerequisites not yet met" : undefined}
    >
      <span>{meta.emoji}</span>
      <span>L{displayLevel}</span>
      {unmetPrereqs && <span className="text-amber-400" aria-label="Baseline prerequisites not yet met">*</span>}
    </span>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────

export function ScoreBar({ score, level }: { score: number; level: number }) {
  const max = CUMULATIVE_SCANNABLE[level] || TOTAL_SCANNABLE;
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pct >= 60 ? "bg-green-500" :
    pct >= 30 ? "bg-blue-500" :
    pct >= 10 ? "bg-yellow-500" :
    "bg-gray-600";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-400 w-10 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────

const SPARKLINE_WIDTH = 64;
const SPARKLINE_HEIGHT = 20;
const SPARKLINE_STROKE_WIDTH = 1.5;
export const MIN_DATA_POINTS_FOR_SPARKLINE = 2;

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < MIN_DATA_POINTS_FOR_SPARKLINE) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * SPARKLINE_WIDTH;
      const y = SPARKLINE_HEIGHT - ((v - min) / range) * (SPARKLINE_HEIGHT - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const color = last > first ? "#22c55e" : last < first ? "#ef4444" : "#6b7280";

  return (
    <svg
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      className="inline-block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={SPARKLINE_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
