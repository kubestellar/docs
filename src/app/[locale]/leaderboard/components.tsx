import type { AffiliateData, LeaderboardBreakdown } from "./types";
import { LEVEL_STYLES } from "./types";

// ── Rank display ──────────────────────────────────────────────────────
// RankDisplay lives in src/lib/RankDisplay.tsx now — see docs #7076.
// Re-exported so existing import paths (this file + tests) keep working.
export { RankDisplay } from "../../../lib/RankDisplay";

// ── Level badge ───────────────────────────────────────────────────────

export function LevelBadge({ level }: { level: string }) {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.Observer;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      {level}
    </span>
  );
}

// ── Breakdown pills ───────────────────────────────────────────────────

export function BreakdownPills({ breakdown }: { breakdown: LeaderboardBreakdown }) {
  const pills = [];
  if (breakdown.prs_merged > 0)
    pills.push({ label: `${breakdown.prs_merged} Merged`, color: "text-green-400 bg-green-500/10" });
  if (breakdown.prs_opened > 0)
    pills.push({ label: `${breakdown.prs_opened} ${breakdown.prs_opened === 1 ? "PR" : "PRs"}`, color: "text-blue-400 bg-blue-500/10" });
  if (breakdown.bug_issues > 0)
    pills.push({ label: `${breakdown.bug_issues} ${breakdown.bug_issues === 1 ? "Bug" : "Bugs"}`, color: "text-red-400 bg-red-500/10" });
  if (breakdown.feature_issues > 0)
    pills.push({ label: `${breakdown.feature_issues} ${breakdown.feature_issues === 1 ? "Feature" : "Features"}`, color: "text-purple-400 bg-purple-500/10" });
  if (breakdown.other_issues > 0)
    pills.push({ label: `${breakdown.other_issues} ${breakdown.other_issues === 1 ? "Other" : "Others"}`, color: "text-gray-400 bg-gray-500/10" });

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill) => (
        <span
          key={pill.label}
          className={`px-2 py-0.5 rounded text-xs font-medium ${pill.color}`}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
}

// ── Activity sparkline ───────────────────────────────────────────────

const SPARKLINE_WIDTH = 96;
const SPARKLINE_HEIGHT = 24;
const SPARKLINE_BAR_GAP = 1;

export function ActivitySparkline({ data, weeks }: { data: number[]; weeks?: string[] }) {
  if (!data || data.length === 0) return <span className="text-xs text-gray-600">—</span>;

  const max = Math.max(...data, 1);
  const barWidth = (SPARKLINE_WIDTH - (data.length - 1) * SPARKLINE_BAR_GAP) / data.length;

  return (
    <svg
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      className="flex-shrink-0"
      role="img"
      aria-label="Weekly activity trend"
    >
      {data.map((count, i) => {
        const barHeight = Math.max(1, (count / max) * (SPARKLINE_HEIGHT - 2));
        const x = i * (barWidth + SPARKLINE_BAR_GAP);
        const y = SPARKLINE_HEIGHT - barHeight;
        const isRecent = i >= data.length - 2;
        const weekLabel = weeks?.[i] ?? `Week ${i + 1}`;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1}
            fill={count === 0 ? "rgba(107,114,128,0.15)" : isRecent ? "rgba(59,130,246,0.7)" : "rgba(59,130,246,0.35)"}
          >
            <title>{`${weekLabel}: ${count} contributions`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

// ── Social/affiliate badge ────────────────────────────────────────────

export function SocialBadge({ data, loading }: { data: AffiliateData | undefined; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-block w-6 h-4 rounded bg-gray-700/50 animate-pulse" title="Loading social data…" />
    );
  }
  if (!data || data.clicks === 0) {
    return (
      <span className="text-xs text-gray-600" title="No affiliate clicks yet">
        —
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-pink-400 bg-pink-500/10"
      title={`${data.clicks} clicks from ${data.unique_users} unique users via affiliate link`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {data.clicks}
    </span>
  );
}
