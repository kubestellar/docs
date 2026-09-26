"use client";

import { useMemo } from "react";
import {
  RADAR_AXIS_COUNT,
  RADAR_DIMENSIONS,
  RADAR_MIN_DISPLAY_SCORE,
  computeRadarScores,
  radarPoint,
} from "../../../../../lib/radar";
import type { TopicCluster } from "../types";
import { RADAR_CENTER, RADAR_GRID_RINGS, RADAR_RADIUS } from "../constants";

/**
 * Pure SVG radar/spider chart showing contribution distribution
 * across 6 dimensions.
 */
export function ContributionRadarChart({ topics }: { topics: TopicCluster[] }) {
  const scores = useMemo(() => computeRadarScores(topics), [topics]);
  const hasData = scores.some((s) => s > RADAR_MIN_DISPLAY_SCORE);

  // Build the polygon path for the data shape
  const dataPoints = scores.map((score, i) =>
    radarPoint(i, Math.max(score, RADAR_MIN_DISPLAY_SCORE), RADAR_RADIUS, RADAR_CENTER),
  );
  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ") + " Z";

  // Grid ring paths (concentric polygons)
  const gridRings = Array.from({ length: RADAR_GRID_RINGS }, (_, ringIdx) => {
    const fraction = (ringIdx + 1) / RADAR_GRID_RINGS;
    const ringPoints = Array.from({ length: RADAR_AXIS_COUNT }, (_, axisIdx) =>
      radarPoint(axisIdx, fraction, RADAR_RADIUS, RADAR_CENTER),
    );
    return ringPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ") + " Z";
  });

  // Axis lines from center to outer edge
  const axisEndpoints = Array.from({ length: RADAR_AXIS_COUNT }, (_, i) =>
    radarPoint(i, 1, RADAR_RADIUS, RADAR_CENTER),
  );

  /** Label offset distance beyond the outer edge */
  const LABEL_OFFSET_RADIUS = 145;

  // Label positions (slightly outside the outer ring)
  const labelPositions = Array.from({ length: RADAR_AXIS_COUNT }, (_, i) =>
    radarPoint(i, 1, LABEL_OFFSET_RADIUS, RADAR_CENTER),
  );

  return (
    <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
      <h2 className="text-lg font-semibold text-white mb-1">
        Expertise Areas
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        {hasData
          ? "Contribution distribution across console domains"
          : "Not enough topic data for contribution mapping"}
      </p>

      <div className="flex justify-center">
        <svg
          viewBox="-40 -10 380 330"
          className="w-full max-w-[400px] h-auto"
          role="img"
          aria-label="Radar chart showing contribution distribution across 6 expertise areas"
        >
          {/* Grid rings */}
          {gridRings.map((path, i) => (
            <path
              key={`ring-${i}`}
              d={path}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {axisEndpoints.map((point, i) => (
            <line
              key={`axis-${i}`}
              x1={RADAR_CENTER}
              y1={RADAR_CENTER}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Data polygon fill */}
          <path
            d={dataPath}
            fill="rgba(34, 211, 238, 0.15)"
            stroke="rgba(34, 211, 238, 0.6)"
            strokeWidth="2"
          />

          {/* Data points (dots on vertices) */}
          {dataPoints.map((point, i) => (
            <circle
              key={`dot-${i}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={scores[i] > RADAR_MIN_DISPLAY_SCORE ? "rgba(34, 211, 238, 0.9)" : "rgba(107, 114, 128, 0.4)"}
              stroke={scores[i] > RADAR_MIN_DISPLAY_SCORE ? "rgba(34, 211, 238, 1)" : "rgba(107, 114, 128, 0.6)"}
              strokeWidth="1"
            />
          ))}

          {/* Axis labels */}
          {labelPositions.map((pos, i) => (
            <text
              key={`label-${i}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-amber-400 text-[11px] font-medium"
              style={{ fontFamily: "inherit" }}
            >
              {RADAR_DIMENSIONS[i].label}
            </text>
          ))}

          {/* Score percentages near each vertex */}
          {dataPoints.map((point, i) => {
            const pct = Math.round(scores[i] * 100);
            if (pct === 0) return null;
            /** Slight inward offset for the percentage label */
            const SCORE_LABEL_INSET = 0.75;
            const labelPt = radarPoint(i, SCORE_LABEL_INSET, RADAR_RADIUS, RADAR_CENTER);
            return (
              <text
                key={`pct-${i}`}
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-cyan-300/70 text-[9px]"
              >
                {pct}%
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend row */}
      {hasData && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {RADAR_DIMENSIONS.map((dim, i) => {
            const pct = Math.round(scores[i] * 100);
            return (
              <div key={dim.label} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: pct > 0 ? "rgba(34, 211, 238, 0.8)" : "rgba(107, 114, 128, 0.4)",
                  }}
                />
                <span className="text-[10px] text-gray-400">
                  {dim.label}
                  {pct > 0 && (
                    <span className="text-cyan-400 ml-1">{pct}%</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
