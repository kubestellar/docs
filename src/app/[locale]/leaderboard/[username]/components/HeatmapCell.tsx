// ── Heatmap Cell ──────────────────────────────────────────────────────

export function HeatmapCell({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const intensity = max > 0 ? value / max : 0;
  /** Minimum opacity so empty cells are still visible */
  const MIN_CELL_OPACITY = 0.05;
  const opacity = Math.max(MIN_CELL_OPACITY, intensity);
  return (
    <div
      className="flex flex-col items-center gap-1"
      title={`${label}: ${value} issues`}
    >
      <div
        className="w-8 h-8 rounded-md border border-white/5"
        style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
      />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
