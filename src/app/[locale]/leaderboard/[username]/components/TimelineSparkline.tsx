import type { TimelineEntry } from "../types";

// ── Timeline Sparkline ────────────────────────────────────────────────

export function TimelineSparkline({ timeline }: { timeline: TimelineEntry[] }) {
  const maxCount = Math.max(...timeline.map((t) => t.issue_count), 1);
  /** Maximum bar height in pixels */
  const BAR_MAX_HEIGHT_PX = 48;
  /** Minimum bar height in pixels so empty months are visible */
  const BAR_MIN_HEIGHT_PX = 2;

  return (
    <div className="flex items-end gap-1 h-16">
      {timeline.map((entry) => {
        const height = (entry.issue_count / maxCount) * BAR_MAX_HEIGHT_PX;
        return (
          <div
            key={entry.month}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${entry.month}: ${entry.issue_count} issues`}
          >
            <div
              className="w-full bg-blue-500/40 rounded-t-sm min-h-[2px]"
              style={{
                height: `${Math.max(BAR_MIN_HEIGHT_PX, height)}px`,
              }}
            />
            <span className="text-[8px] text-gray-600 -rotate-45 origin-top-left whitespace-nowrap">
              {entry.month.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
