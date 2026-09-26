"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RADAR_AXIS_COUNT,
  RADAR_DIMENSIONS,
  RADAR_MIN_DISPLAY_SCORE,
  computeRadarScores,
  radarPoint,
} from "../../../lib/radar";
import type { RadarTopicCluster } from "../../../lib/radar";
import {
  DAY_LABELS,
  LEVEL_STYLES,
  TREND_DISPLAY,
} from "../../../lib/leaderboardShared";
import type { TimelineEntry } from "../../../lib/leaderboardShared";

export type { TimelineEntry };

// ── Contributor hover card ────────────────────────────────────────────

export interface CadenceData {
  avg_per_week: number;
  by_day_of_week: number[];
  by_hour_of_day: number[];
  current_streak_weeks: number;
  longest_streak_weeks: number;
  trend: "ramping_up" | "steady" | "slowing_down" | "inactive";
}

export interface ContributorPreview {
  login: string;
  avatar_url: string;
  total_points: number;
  total_issues_opened: number;
  level: string;
  rank: number;
  cadence: CadenceData;
  activity_timeline: TimelineEntry[];
  topics?: RadarTopicCluster[];
}

/** Delay (ms) before fetching contributor data on hover — avoids fetch spam on quick mouse passes. */
export const HOVER_FETCH_DELAY_MS = 300;

const profileCache = new Map<string, ContributorPreview>();

// ── Mini Radar Chart for hover card ──────────────────────────────────

const MINI_RADAR_RADIUS = 50;
const MINI_RADAR_CENTER = 60;
const MINI_RADAR_GRID_RINGS = 3;

function MiniRadarChart({ topics }: { topics: RadarTopicCluster[] }) {
  const scores = useMemo(() => computeRadarScores(topics), [topics]);
  const hasData = scores.some((s) => s > RADAR_MIN_DISPLAY_SCORE);

  if (!hasData) return null;

  const dataPoints = scores.map((score, i) =>
    radarPoint(i, Math.max(score, RADAR_MIN_DISPLAY_SCORE), MINI_RADAR_RADIUS, MINI_RADAR_CENTER),
  );
  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ") + " Z";

  const gridRings = Array.from({ length: MINI_RADAR_GRID_RINGS }, (_, ringIdx) => {
    const fraction = (ringIdx + 1) / MINI_RADAR_GRID_RINGS;
    const ringPoints = Array.from({ length: RADAR_AXIS_COUNT }, (_, axisIdx) =>
      radarPoint(axisIdx, fraction, MINI_RADAR_RADIUS, MINI_RADAR_CENTER),
    );
    return ringPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ") + " Z";
  });

  const axisEndpoints = Array.from({ length: RADAR_AXIS_COUNT }, (_, i) =>
    radarPoint(i, 1, MINI_RADAR_RADIUS, MINI_RADAR_CENTER),
  );

  const LABEL_OFFSET_RADIUS = 56;
  const labelPositions = Array.from({ length: RADAR_AXIS_COUNT }, (_, i) =>
    radarPoint(i, 1, LABEL_OFFSET_RADIUS, MINI_RADAR_CENTER),
  );

  return (
    <div className="px-4 py-3 border-b border-white/5">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Expertise</div>
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 120 120"
          className="w-[100px] h-[100px] flex-shrink-0"
          role="img"
          aria-label="Expertise radar chart"
        >
          {gridRings.map((path, i) => (
            <path key={`ring-${i}`} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          ))}
          {axisEndpoints.map((point, i) => (
            <line key={`axis-${i}`} x1={MINI_RADAR_CENTER} y1={MINI_RADAR_CENTER} x2={point.x} y2={point.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          ))}
          <path d={dataPath} fill="rgba(34,211,238,0.15)" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" />
          {dataPoints.map((point, i) => (
            <circle key={`dot-${i}`} cx={point.x} cy={point.y} r="2" fill={scores[i] > RADAR_MIN_DISPLAY_SCORE ? "rgba(34,211,238,0.9)" : "rgba(107,114,128,0.4)"} />
          ))}
          {labelPositions.map((pos, i) => (
            <text key={`label-${i}`} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" className="fill-amber-400" style={{ fontSize: "5px", fontFamily: "inherit" }}>
              {RADAR_DIMENSIONS[i].label}
            </text>
          ))}
        </svg>
        <div className="flex flex-col gap-0.5 min-w-0">
          {RADAR_DIMENSIONS.map((dim, i) => {
            const pct = Math.round(scores[i] * 100);
            return (
              <div key={dim.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pct > 0 ? "rgba(34,211,238,0.8)" : "rgba(107,114,128,0.4)" }} />
                <span className="text-[9px] text-gray-400 truncate">{dim.label}</span>
                <span className="text-[9px] text-cyan-300/70 ml-auto">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ContributorHoverCard({
  login,
  onClose,
  rank,
  totalPoints,
  level,
}: {
  login: string;
  onClose: () => void;
  /** Rank from the leaderboard table — used so the hover card never disagrees with the row. */
  rank: number;
  /** Points from the leaderboard table. */
  totalPoints: number;
  /** Level from the leaderboard table. */
  level: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ContributorPreview | null>(profileCache.get(login) || null);
  const [loading, setLoading] = useState(!profileCache.has(login));
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profileCache.has(login)) {
      setData(profileCache.get(login)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/data/contributors/${login}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: ContributorPreview | null) => {
        if (cancelled || !json) return;
        profileCache.set(login, json);
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [login]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (loading) {
    return (
      <div
        ref={cardRef}
        className="absolute left-0 top-full mt-2 z-50 w-80 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
            <div className="h-2 w-16 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const style = LEVEL_STYLES[level] || LEVEL_STYLES.Observer;
  const trend = TREND_DISPLAY[data.cadence.trend] || TREND_DISPLAY.inactive;
  const maxDay = Math.max(...data.cadence.by_day_of_week, 1);
  const maxHour = Math.max(...data.cadence.by_hour_of_day, 1);
  const timelineMax = Math.max(...data.activity_timeline.map((t) => t.issue_count), 1);
  /** Maximum bar height for timeline sparkline in pixels */
  const SPARKLINE_BAR_MAX_PX = 32;
  /** Minimum visible bar height in pixels */
  const SPARKLINE_BAR_MIN_PX = 2;

  return (
    <div
      ref={cardRef}
      className="absolute left-0 top-full mt-2 z-50 w-96 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden cursor-pointer"
      onMouseLeave={onClose}
      onClick={() => router.push(`/leaderboard/${data.login}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/leaderboard/${data.login}`); }}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Image
            src={data.avatar_url}
            alt={data.login}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
            unoptimized
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{data.login}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                {level}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>Rank #{rank}</span>
              <span className="text-yellow-400 font-semibold">{totalPoints.toLocaleString()} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cadence */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Cadence</span>
            {data.cadence.current_streak_weeks > 0 && (
              <span className="text-[10px] text-orange-400" title={`Longest: ${data.cadence.longest_streak_weeks} weeks`}>
                🔥 {data.cadence.current_streak_weeks}w streak
              </span>
            )}
          </div>
          <span className={`text-[10px] ${trend.color}`}>
            {trend.arrow} {trend.label}
          </span>
        </div>
        <div className="flex gap-4">
          {/* By day */}
          <div className="flex-1">
            <div className="text-[9px] text-gray-600 mb-1">BY DAY</div>
            <div className="flex gap-0.5">
              {data.cadence.by_day_of_week.map((count, i) => {
                const intensity = count / maxDay;
                const MIN_CELL_OPACITY = 0.05;
                return (
                  <div key={DAY_LABELS[i]} className="flex flex-col items-center gap-0.5" title={`${DAY_LABELS[i]}: ${count}`}>
                    <div
                      className="w-5 h-5 rounded-sm border border-white/5"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${Math.max(MIN_CELL_OPACITY, intensity)})` }}
                    />
                    <span className="text-[7px] text-gray-600">{DAY_LABELS[i][0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* By hour (compact — just a single row of 24 tiny cells) */}
          <div className="flex-1">
            <div className="text-[9px] text-gray-600 mb-1">BY HOUR (UTC)</div>
            <div className="flex gap-px flex-wrap" style={{ maxWidth: "144px" }}>
              {data.cadence.by_hour_of_day.map((count, h) => {
                const intensity = count / maxHour;
                const MIN_CELL_OPACITY = 0.05;
                return (
                  <div
                    key={h}
                    className="w-[5px] h-[5px] rounded-[1px]"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${Math.max(MIN_CELL_OPACITY, intensity)})` }}
                    title={`${h}:00 UTC: ${count}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Activity Timeline</div>
        <div className="flex items-end gap-px h-10">
          {data.activity_timeline.map((entry) => {
            const height = (entry.issue_count / timelineMax) * SPARKLINE_BAR_MAX_PX;
            return (
              <div
                key={entry.month}
                className="flex-1 bg-blue-500/40 rounded-t-sm"
                style={{ height: `${Math.max(SPARKLINE_BAR_MIN_PX, height)}px` }}
                title={`${entry.month}: ${entry.issue_count} issues`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-gray-600">{data.activity_timeline[0]?.month.slice(5)}</span>
          <span className="text-[7px] text-gray-600">{data.activity_timeline[data.activity_timeline.length - 1]?.month.slice(5)}</span>
        </div>
      </div>

      {/* Expertise Radar */}
      {data.topics && data.topics.length > 0 && <MiniRadarChart topics={data.topics} />}

      {/* Footer */}
      <div className="block px-4 py-2 text-[10px] text-center text-blue-400 bg-white/[0.02] border-t border-white/5">
        View full profile →
      </div>
    </div>
  );
}
