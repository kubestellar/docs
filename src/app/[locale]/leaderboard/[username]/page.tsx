"use client";

import { useState, useEffect, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GridLines,
  StarField,
  Navbar,
  Footer,
} from "../../../../components/index";

// ── Types ─────────────────────────────────────────────────────────────

interface TopicCluster {
  name: string;
  issue_count: number;
  recent_issue: { title: string; url: string; created_at: string };
  repos: string[];
  open_count: number;
  closed_count: number;
}

interface Suggestion {
  title: string;
  url: string;
  repo: string;
  topic_match: string;
}

interface StretchArea {
  name: string;
  path: string;
  description: string;
  url: string;
}

interface CadenceData {
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

interface TimelineEntry {
  month: string;
  issue_count: number;
}

interface ContributorProfile {
  login: string;
  generated_at: string;
  total_issues_opened: number;
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
}

// ── Constants ─────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TREND_DISPLAY: Record<
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

const LEVEL_STYLES: Record<
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

const REPO_COLORS: Record<string, string> = {
  console: "text-blue-400 bg-blue-500/10",
  docs: "text-green-400 bg-green-500/10",
  "console-kb": "text-purple-400 bg-purple-500/10",
  "console-marketplace": "text-orange-400 bg-orange-500/10",
};

// ── Radar Chart ──────────────────────────────────────────────────────

/** Number of axes in the radar chart */
const RADAR_AXIS_COUNT = 6;
/** Radar chart radius in SVG units */
const RADAR_RADIUS = 120;
/** Center coordinate for the radar chart SVG */
const RADAR_CENTER = 150;
/** Number of concentric grid rings */
const RADAR_GRID_RINGS = 4;
/** Minimum score threshold to display a dimension (avoids empty-looking charts) */
const RADAR_MIN_DISPLAY_SCORE = 0.08;

/**
 * The 6 contribution dimensions, each with keywords that map topics to that axis.
 * Keywords are matched case-insensitively against topic cluster names.
 */
const RADAR_DIMENSIONS = [
  {
    label: "Operations",
    keywords: [
      "cluster", "health", "monitor", "kubectl", "k8s", "node", "kubeconfig",
      "context", "multicluster", "connect", "deployment", "deploy", "unhealthy",
      "api", "handler", "endpoint", "backend", "server", "route", "store",
      "resource", "compute", "capacity", "provision", "helm", "gitops",
      "cicd", "pipeline", "release", "rollout", "startup", "dependency",
      "build", "npm", "pull",
    ],
  },
  {
    label: "Dashboard",
    keywords: [
      "dashboard", "card", "widget", "layout", "grid", "drag", "drop",
      "chart", "graph", "visualize", "bar", "line", "pie", "sparkline",
      "drilldown", "timeseries", "css", "style", "theme", "ui", "component",
      "sidebar", "collapse", "popup", "icon", "panel", "display", "view",
      "tab", "settings", "preference", "onboard", "tour", "wizard",
      "marketplace", "install",
    ],
  },
  {
    label: "Agents",
    keywords: [
      "agent", "kagent", "kagenti", "mcp", "protocol", "ai", "assist",
      "automate", "llm", "model", "provider", "openai", "claude", "gemini",
      "fallback", "inference", "vllm",
    ],
  },
  {
    label: "Missions",
    keywords: [
      "mission", "mission-control", "browser", "deploy", "workflow",
      "objective", "goal", "task", "export", "yaml", "markdown", "json",
      "history", "pagination",
    ],
  },
  {
    label: "Testing",
    keywords: [
      "test", "coverage", "nightly", "e2e", "playwright", "jest", "spec",
      "fixture", "mock", "stub", "fork", "ci", "workflow", "automation",
    ],
  },
  {
    label: "Security",
    keywords: [
      "rbac", "auth", "oauth", "login", "session", "token", "permission",
      "role", "security", "vulnerability", "scan", "compliance", "trivy",
      "kubescape", "validation", "encryption", "middleware", "policy",
    ],
  },
] as const;

/**
 * Compute radar scores from topic clusters.
 * Each dimension gets a score proportional to the issue count of topics
 * whose names match that dimension's keywords.
 */
function computeRadarScores(topics: TopicCluster[]): number[] {
  if (!topics || topics.length === 0) {
    return new Array(RADAR_AXIS_COUNT).fill(0);
  }

  const rawScores = new Array(RADAR_AXIS_COUNT).fill(0);

  for (const topic of topics) {
    const topicWords = topic.name.toLowerCase().split(/[\s,]+/);

    for (let i = 0; i < RADAR_DIMENSIONS.length; i++) {
      const dimension = RADAR_DIMENSIONS[i];
      let matchStrength = 0;

      for (const keyword of dimension.keywords) {
        for (const word of topicWords) {
          if (word.includes(keyword) || keyword.includes(word)) {
            matchStrength++;
          }
        }
      }

      if (matchStrength > 0) {
        rawScores[i] += topic.issue_count * matchStrength;
      }
    }
  }

  // Normalize to 0..1 range
  const maxScore = Math.max(...rawScores, 1);
  return rawScores.map((s) => Math.max(s / maxScore, 0));
}

/**
 * Calculate a point on the radar chart given an axis index, score (0..1),
 * and chart parameters.
 */
function radarPoint(
  axisIndex: number,
  score: number,
  radius: number,
  center: number,
): { x: number; y: number } {
  /** Offset so first axis points straight up (negative Y) */
  const ANGLE_OFFSET = -Math.PI / 2;
  const angle =
    ANGLE_OFFSET + (2 * Math.PI * axisIndex) / RADAR_AXIS_COUNT;
  return {
    x: center + radius * score * Math.cos(angle),
    y: center + radius * score * Math.sin(angle),
  };
}

/**
 * Pure SVG radar/spider chart showing contribution distribution
 * across 6 dimensions.
 */
function ContributionRadarChart({ topics }: { topics: TopicCluster[] }) {
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

// ── Heatmap Cell ──────────────────────────────────────────────────────

function HeatmapCell({
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

// ── Topic Bar ─────────────────────────────────────────────────────────

function TopicBar({
  topic,
  maxCount,
}: {
  topic: TopicCluster;
  maxCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const widthPct = maxCount > 0 ? (topic.issue_count / maxCount) * 100 : 0;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">
            {topic.name}
          </span>
          <div className="flex items-center gap-2">
            {topic.repos.map((repo) => (
              <span
                key={repo}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${REPO_COLORS[repo] || "text-gray-400 bg-gray-500/10"}`}
              >
                {repo}
              </span>
            ))}
            <span className="text-xs text-gray-400 tabular-nums">
              {topic.issue_count}
            </span>
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <div className="w-full bg-gray-700/30 rounded-full h-2.5">
          <div
            className="flex h-full rounded-full overflow-hidden"
            style={{ width: `${widthPct}%` }}
          >
            <div
              className="bg-green-500/60 h-full"
              style={{
                width: `${topic.issue_count > 0 ? (topic.closed_count / topic.issue_count) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-blue-500/60 h-full"
              style={{
                width: `${topic.issue_count > 0 ? (topic.open_count / topic.issue_count) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[10px] text-green-400">
            {topic.closed_count} closed
          </span>
          <span className="text-[10px] text-blue-400">
            {topic.open_count} open
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-2 ml-4 p-3 bg-gray-800/40 rounded-lg border border-white/5">
          <p className="text-xs text-gray-400 mb-1">Most recent:</p>
          <a
            href={topic.recent_issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {topic.recent_issue.title}
          </a>
          <p className="text-[10px] text-gray-500 mt-1">
            {new Date(topic.recent_issue.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Suggestion Card ───────────────────────────────────────────────────

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <a
      href={suggestion.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-gray-800/40 rounded-lg border border-white/5 hover:border-white/10 hover:bg-gray-800/60 transition-all"
    >
      <p className="text-sm text-white mb-2 line-clamp-2">
        {suggestion.title}
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${REPO_COLORS[suggestion.repo] || "text-gray-400 bg-gray-500/10"}`}
        >
          {suggestion.repo}
        </span>
        <span className="text-[10px] text-gray-500">
          {suggestion.topic_match}
        </span>
      </div>
    </a>
  );
}

// ── Timeline Sparkline ────────────────────────────────────────────────

function TimelineSparkline({ timeline }: { timeline: TimelineEntry[] }) {
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

// ── Page Component ────────────────────────────────────────────────────

export default function ContributorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const { username } = resolvedParams;

  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/data/contributors/${username}.json`)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404 ? "not_found" : `HTTP ${res.status}`
          );
        return res.json();
      })
      .then((data: ContributorProfile) => {
        setProfile(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [username]);

  // Cadence summary line
  const cadenceSummary = useMemo(() => {
    if (!profile?.cadence) return "";
    const c = profile.cadence;
    const peakDay =
      DAY_LABELS[
        c.by_day_of_week.indexOf(Math.max(...c.by_day_of_week))
      ];
    const peakHour = c.by_hour_of_day.indexOf(
      Math.max(...c.by_hour_of_day)
    );
    /** Peak hour window spans 3 hours from the peak */
    const PEAK_WINDOW_HOURS = 3;
    const peakHourEnd = (peakHour + PEAK_WINDOW_HOURS) % 24;
    return `Averages ${c.avg_per_week} issues/week \u00B7 Most active on ${peakDay}s \u00B7 Peak hours: ${String(peakHour).padStart(2, "0")}:00\u2013${String(peakHourEnd).padStart(2, "0")}:00 UTC`;
  }, [profile]);

  const levelStyle =
    LEVEL_STYLES[profile?.level || "Observer"] || LEVEL_STYLES.Observer;
  const trend = TREND_DISPLAY[profile?.cadence?.trend || "inactive"];

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen">
      <Navbar />

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <StarField density="medium" showComets={true} cometCount={3} />
        <GridLines horizontalLines={21} verticalLines={18} />
      </div>

      <div className="relative z-10 pt-7">
        {/* Back link */}
        <section className="pt-12 sm:pt-28 lg:pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/leaderboard"
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 mb-8"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              Back to Leaderboard
            </Link>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">
                  Loading contributor profile...
                </p>
              </div>
            )}

            {/* Not found */}
            {error === "not_found" && (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-400 mb-2">Contributor not found</p>
                <p className="text-gray-500 text-sm">
                  No profile data for{" "}
                  <span className="font-mono">{username}</span>
                </p>
              </div>
            )}

            {/* Error */}
            {error && error !== "not_found" && (
              <div className="text-center py-16">
                <p className="text-red-400 mb-2">Failed to load profile</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            )}

            {/* Profile content */}
            {profile && !isLoading && !error && (
              <div className="space-y-8 pb-16">
                {/* ── Header ─────────────────────────────── */}
                <div className="flex items-start gap-5">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.login}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-gray-300">
                      {profile.login[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-white">
                        {profile.login}
                      </h1>
                      <a
                        href={`https://github.com/${profile.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                        title="View on GitHub"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                      >
                        {profile.level}
                      </span>
                      <span className="text-sm text-gray-400">
                        Rank{" "}
                        <span className="text-white font-semibold">
                          #{profile.rank}
                        </span>
                      </span>
                      <span className="text-sm text-yellow-400 font-semibold tabular-nums">
                        {profile.total_points.toLocaleString()} pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {profile.total_issues_opened} issues opened across{" "}
                      {[
                        ...new Set(
                          (profile.topics || []).flatMap((t) => t.repos)
                        ),
                      ].length || "multiple"}{" "}
                      repos
                    </p>
                  </div>
                </div>

                {/* ── Contribution Cadence ────────────────── */}
                <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Contribution Cadence
                  </h2>
                  <p className="text-sm text-gray-400 mb-5">
                    {cadenceSummary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Streak & Trend */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <div>
                          <p className="text-sm text-white font-semibold">
                            {profile.cadence.current_streak_weeks}-week
                            streak
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Longest:{" "}
                            {profile.cadence.longest_streak_weeks} weeks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${trend.color}`}>
                          {trend.arrow}
                        </span>
                        <span
                          className={`text-sm font-medium ${trend.color}`}
                        >
                          {trend.label}
                        </span>
                      </div>
                    </div>

                    {/* Day-of-week heatmap */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                        By Day
                      </p>
                      <div className="flex gap-1">
                        {profile.cadence.by_day_of_week.map((val, i) => (
                          <HeatmapCell
                            key={DAY_LABELS[i]}
                            value={val}
                            max={Math.max(
                              ...profile.cadence.by_day_of_week
                            )}
                            label={DAY_LABELS[i]}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Hour-of-day heatmap */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                        By Hour (UTC)
                      </p>
                      <div className="flex gap-px flex-wrap">
                        {profile.cadence.by_hour_of_day.map((val, i) => {
                          const max = Math.max(
                            ...profile.cadence.by_hour_of_day
                          );
                          const intensity = max > 0 ? val / max : 0;
                          /** Minimum opacity for hour cells */
                          const MIN_HOUR_OPACITY = 0.05;
                          const opacity = Math.max(
                            MIN_HOUR_OPACITY,
                            intensity
                          );
                          return (
                            <div
                              key={i}
                              className="w-3 h-6 rounded-sm"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                              }}
                              title={`${String(i).padStart(2, "0")}:00 UTC: ${val} issues`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-gray-600">0h</span>
                        <span className="text-[8px] text-gray-600">
                          12h
                        </span>
                        <span className="text-[8px] text-gray-600">
                          23h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Activity Timeline ───────────────────── */}
                <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Activity Timeline
                  </h2>
                  <TimelineSparkline timeline={profile.activity_timeline} />
                </div>

                {/* ── Expertise Areas (Radar Chart) ──────── */}
                <ContributionRadarChart topics={profile.topics || []} />

                {/* ── Topic Focus ─────────────────────────── */}
                <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Topic Focus
                  </h2>
                  <p className="text-sm text-gray-400 mb-5">
                    {(profile.topics || []).length > 0
                      ? "Issues clustered by topic \u2014 click to expand"
                      : "Not enough issues for topic analysis"}
                  </p>
                  {(profile.topics || []).length > 0 ? (
                    (profile.topics || []).map((topic) => (
                      <TopicBar
                        key={topic.name}
                        topic={topic}
                        maxCount={(profile.topics || [])[0]?.issue_count || 1}
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm py-4 text-center">
                      Requires at least 3 issues for clustering
                    </p>
                  )}
                </div>

                {/* ── Suggestions ─────────────────────────── */}
                {((profile.suggestions?.deepen || []).length > 0 ||
                  (profile.suggestions?.stretch || []).length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deepen */}
                    {(profile.suggestions?.deepen || []).length > 0 && (
                      <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-semibold text-white mb-1">
                          Deepen Your Expertise
                        </h2>
                        <p className="text-sm text-gray-400 mb-4">
                          Open issues matching your focus areas
                        </p>
                        <div className="space-y-3">
                          {(profile.suggestions?.deepen || []).map((s) => (
                            <SuggestionCard key={s.url} suggestion={s} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stretch */}
                    {(profile.suggestions?.stretch || []).length > 0 && (
                      <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-semibold text-white mb-1">
                          Stretch Into New Areas
                        </h2>
                        <p className="text-sm text-gray-400 mb-4">
                          Console codebase areas outside your usual focus
                        </p>
                        <div className="space-y-3">
                          {(profile.suggestions?.stretch || []).map((area: StretchArea) => (
                            <a
                              key={area.name}
                              href={area.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 bg-gray-800/40 rounded-lg border border-white/5 hover:border-white/10 hover:bg-gray-800/60 transition-all"
                            >
                              <p className="text-sm text-white font-medium mb-1">
                                {area.name}
                              </p>
                              <p className="text-xs text-gray-400 mb-2">
                                {area.description}
                              </p>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {area.path}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Footer meta ─────────────────────────── */}
                <p className="text-xs text-gray-600 text-center">
                  Profile generated{" "}
                  {new Date(profile.generated_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}{" "}
                  · Data updates every 4 hours
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
