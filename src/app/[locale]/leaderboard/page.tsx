"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GridLines,
  StarField,
  ContributionCallToAction,
  Navbar,
  Footer,
} from "../../../components/index";
import {
  RADAR_AXIS_COUNT,
  RADAR_DIMENSIONS,
  RADAR_MIN_DISPLAY_SCORE,
  computeRadarScores,
  radarPoint,
} from "../../../lib/radar";
import type { RadarTopicCluster } from "../../../lib/radar";

// ── Types ─────────────────────────────────────────────────────────────

interface LeaderboardBreakdown {
  bug_issues: number;
  feature_issues: number;
  other_issues: number;
  prs_opened: number;
  prs_merged: number;
}

interface LeaderboardEntry {
  rank: number;
  login: string;
  avatar_url: string;
  total_points: number;
  level: string;
  level_rank: number;
  breakdown: LeaderboardBreakdown;
}

interface LeaderboardData {
  generated_at: string;
  git_hash?: string;
  entries: LeaderboardEntry[];
}

// ── Affiliate/social click data ──────────────────────────────────────

interface AffiliateData {
  clicks: number;
  unique_users: number;
  utm_term: string;
}

/** URL for the affiliate clicks API (hosted on console.kubestellar.io) */
const AFFILIATE_API_URL = "https://console.kubestellar.io/api/affiliate/clicks";
/** Fetch timeout for affiliate data (15 seconds — the console.kubestellar.io
 *  endpoint is served by Netlify Functions which can cold-start past a
 *  tighter budget on first visit, making the social section appear empty
 *  until the user refreshes the page). */
const AFFILIATE_FETCH_TIMEOUT_MS = 15_000;
/** Delay before retrying a failed affiliate fetch (ms). One retry only. */
const AFFILIATE_RETRY_DELAY_MS = 2_000;

// ── Contributor level colors (mirrors console's CONTRIBUTOR_LEVELS) ───

interface LevelStyle {
  bg: string;
  text: string;
  border: string;
}

const LEVEL_STYLES: Record<string, LevelStyle> = {
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

// ── Medal icons for top 3 ─────────────────────────────────────────────

const GOLD_MEDAL = "🥇";
const SILVER_MEDAL = "🥈";
const BRONZE_MEDAL = "🥉";

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="text-xl" title="1st place">{GOLD_MEDAL}</span>;
  if (rank === 2)
    return <span className="text-xl" title="2nd place">{SILVER_MEDAL}</span>;
  if (rank === 3)
    return <span className="text-xl" title="3rd place">{BRONZE_MEDAL}</span>;
  return <span className="text-sm text-gray-400 tabular-nums">#{rank}</span>;
}

// ── Level badge ───────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
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

function BreakdownPills({ breakdown }: { breakdown: LeaderboardBreakdown }) {
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

// ── Social/affiliate badge ────────────────────────────────────────────

function SocialBadge({ data, loading }: { data: AffiliateData | undefined; loading: boolean }) {
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

// ── Contributor hover card ────────────────────────────────────────────

interface CadenceData {
  avg_per_week: number;
  by_day_of_week: number[];
  by_hour_of_day: number[];
  current_streak_weeks: number;
  longest_streak_weeks: number;
  trend: "ramping_up" | "steady" | "slowing_down" | "inactive";
}

interface TimelineEntry {
  month: string;
  issue_count: number;
}

interface ContributorPreview {
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

const TREND_DISPLAY: Record<string, { label: string; color: string; arrow: string }> = {
  ramping_up: { label: "Ramping Up", color: "text-green-400", arrow: "\u2191" },
  steady: { label: "Steady", color: "text-blue-400", arrow: "\u2192" },
  slowing_down: { label: "Slowing Down", color: "text-yellow-400", arrow: "\u2193" },
  inactive: { label: "Inactive", color: "text-gray-500", arrow: "\u2014" },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Delay (ms) before fetching contributor data on hover — avoids fetch spam on quick mouse passes. */
const HOVER_FETCH_DELAY_MS = 300;

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

function ContributorHoverCard({
  login,
  onClose,
}: {
  login: string;
  onClose: () => void;
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

  const style = LEVEL_STYLES[data.level] || LEVEL_STYLES.Observer;
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
                {data.level}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>Rank #{data.rank}</span>
              <span className="text-yellow-400 font-semibold">{data.total_points.toLocaleString()} pts</span>
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

// ── Leaderboard data URL ──────────────────────────────────────────────
const LEADERBOARD_DATA_PATH = "/data/leaderboard.json";

// ── Refresh schedule ─────────────────────────────────────────────────
/** Hours (UTC) when the GitHub Actions workflow regenerates leaderboard data. */
const REFRESH_HOURS_UTC = [2, 6, 10, 14, 18, 22];
/** Interval (ms) between countdown ticks — once per minute is sufficient. */
const COUNTDOWN_TICK_MS = 60_000;

/** Returns a human-readable countdown string like "1h 23m" until the next refresh. */
function getCountdown(): string {
  const now = new Date();
  const currentHour = now.getUTCHours();

  // Find the next scheduled hour
  const nextHour = REFRESH_HOURS_UTC.find((h) => h > currentHour)
    ?? REFRESH_HOURS_UTC[0]; // wrap to first slot tomorrow

  const next = new Date(now);
  next.setUTCHours(nextHour, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

  const diffMs = next.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

// ── Page component ────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState("");
  const [affiliateData, setAffiliateData] = useState<Record<string, AffiliateData>>({});
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [affiliateBannerOpen, setAffiliateBannerOpen] = useState(false);
  const [hoveredLogin, setHoveredLogin] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeaderboard = useCallback(() => {
    fetch(LEADERBOARD_DATA_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: LeaderboardData) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Tick countdown every minute and auto-refetch when a refresh window arrives
  useEffect(() => {
    setCountdown(getCountdown());
    let lastRefreshHour = -1;
    const id = setInterval(() => {
      setCountdown(getCountdown());
      // Re-fetch data when we cross a scheduled refresh boundary
      const currentHour = new Date().getUTCHours();
      const currentMinute = new Date().getUTCMinutes();
      /** Grace period (minutes) after a scheduled refresh to trigger a re-fetch. */
      const REFETCH_GRACE_MINUTES = 5;
      if (
        REFRESH_HOURS_UTC.includes(currentHour) &&
        currentMinute < REFETCH_GRACE_MINUTES &&
        lastRefreshHour !== currentHour
      ) {
        lastRefreshHour = currentHour;
        fetchLeaderboard();
      }
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, [fetchLeaderboard]);

  // Initial data fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Fetch affiliate click data (non-blocking, best-effort)
  // Retries once after a short delay so the social section doesn't show
  // empty after a cold-start timeout on the first page load (#8858).
  //
  // The API returns keys lowercased (GitHub logins are case-insensitive), but
  // leaderboard `entry.login` preserves GitHub's mixed-case form (e.g.
  // `Abhishek-Punhani`, `Arpit529Srivastava`). Normalize keys to lowercase on
  // ingest so the per-row lookup (`affiliateData[entry.login.toLowerCase()]`)
  // finds the row (#1515).
  useEffect(() => {
    const normalizeKeys = (json: Record<string, AffiliateData>): Record<string, AffiliateData> => {
      const normalized: Record<string, AffiliateData> = {};
      for (const [key, value] of Object.entries(json || {})) {
        normalized[key.toLowerCase()] = value;
      }
      return normalized;
    };


    const fetchAffiliates = () =>
      fetch(AFFILIATE_API_URL, {
        signal: AbortSignal.timeout(AFFILIATE_FETCH_TIMEOUT_MS),
      })
        .then((res) => (res.ok ? res.json() : {}))
        .then((json: Record<string, AffiliateData>) => {
          setAffiliateData(normalizeKeys(json));
          setAffiliateLoading(false);
        });

    let retryHandle: ReturnType<typeof setTimeout> | undefined;
    fetchAffiliates().catch(() => {
      retryHandle = setTimeout(() => {
        fetchAffiliates().catch(() => {
          setAffiliateLoading(false);
        });
      }, AFFILIATE_RETRY_DELAY_MS);
    });
    return () => {
      if (retryHandle) clearTimeout(retryHandle);
    };
  }, []);

  const filteredEntries = useMemo(() => {
    if (!data?.entries) return [];
    if (!search.trim()) return data.entries;
    const q = search.toLowerCase();
    return data.entries.filter((e) => e.login.toLowerCase().includes(q));
  }, [data, search]);

  const lastUpdated = data?.generated_at
    ? new Date(data.generated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen">
      <Navbar />

      {/* Full page background with starfield */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>
        <StarField density="medium" showComets={true} cometCount={3} />
        <GridLines horizontalLines={21} verticalLines={18} />
      </div>

      <div className="relative z-10 pt-7">
        {/* Header Section */}
        <section className="pt-12 pb-8 sm:pt-28 sm:pb-12 lg:pt-24 lg:pb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
                Contributor{" "}
                <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
                  Leaderboard
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Top contributors ranked by activity across KubeStellar Console
                repositories
              </p>
              <p className="mt-3 text-sm text-gray-500 max-w-2xl mx-auto">
                Tracking {new Date().getFullYear()} contributions across{" "}
                <a href="https://github.com/kubestellar/console" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">console</a>,{" "}
                <a href="https://github.com/kubestellar/console-marketplace" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">console-marketplace</a>,{" "}
                <a href="https://github.com/kubestellar/console-kb" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">console-kb</a>, and{" "}
                <a href="https://github.com/kubestellar/docs" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">docs</a>
              </p>
              {lastUpdated && (
                <p className="mt-2 text-sm text-gray-500">
                  Last updated: {lastUpdated}
                  {countdown && (
                    <span className="ml-2 text-gray-600">
                      · Next refresh in {countdown}
                    </span>
                  )}
                </p>
              )}

              {/* Link to ladder page */}
              <div className="mt-6 flex justify-center">
                <Link
                  href="/ladder"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  View Contributor Ladder
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="py-8 sm:py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by GitHub username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md mx-auto block px-4 py-2.5 bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
              />
            </div>

            {/* Affiliate banner — compact, collapsible, above the table */}
            {!isLoading && !error && filteredEntries.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
                <button
                  onClick={() => setAffiliateBannerOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-pink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>
                      <span className="text-white font-medium">Earn Social Clicks</span>
                      {" — "}share your affiliate link and get credited on the leaderboard
                    </span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${affiliateBannerOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {affiliateBannerOpen && (
                  <div className="px-4 pb-4 border-t border-white/5">
                    <p className="mt-3 text-sm text-gray-300 mb-3">
                      Share any KubeStellar URL with your personal UTM tag and get credited on the leaderboard.
                      Open to <span className="text-white font-medium">anyone with a GitHub account</span>.
                    </p>
                    <div className="bg-gray-900/60 rounded-md p-3 font-mono text-xs text-gray-400 overflow-x-auto">
                      <span className="text-gray-500">https://console.kubestellar.io</span>
                      <span className="text-pink-400">?utm_source=social&amp;utm_medium=</span>
                      <span className="text-purple-400">linkedin</span>
                      <span className="text-pink-400">&amp;utm_campaign=contributor_affiliate&amp;utm_term=</span>
                      <span className="text-blue-400">your-github-handle</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span><code className="text-pink-400">utm_term</code> = your GitHub handle, lowercase</span>
                      <span><code className="text-pink-400">utm_medium</code> = twitter, linkedin, blog, youtube, devto, etc.</span>
                    </div>
                    <details className="mt-4 text-xs text-gray-500">
                      <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                        Why is my Social count not updating?
                      </summary>
                      <ul className="mt-2 ml-4 list-disc space-y-1.5">
                        <li>
                          <span className="text-gray-300">Google Analytics attribution lag:</span> The
                          <code className="mx-1 text-pink-400">utm_campaign</code> /
                          <code className="mx-1 text-pink-400">utm_term</code> dimensions take
                          <span className="text-white font-medium"> 24&ndash;48 hours</span> to finalize after a click.
                        </li>
                        <li>
                          <span className="text-gray-300">Chat apps strip UTM tags:</span> WhatsApp, Discord, Messenger strip
                          <code className="mx-1 text-pink-400">?utm_*</code> query strings from link previews. Prefer plain-text shares via email, SMS, GitHub comments, or blog posts.
                        </li>
                        <li>
                          <span className="text-gray-300">Sessions, not page views:</span> Multiple clicks within 30 minutes count as one session. Share to <span className="text-white">more people</span>, not the same people.
                        </li>
                        <li>
                          <span className="text-gray-300">Legacy <code className="text-pink-400">intern-0X</code> links keep working,</span> but new shares should use
                          <code className="mx-1 text-pink-400">utm_term=your-github-handle</code>.
                        </li>
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading leaderboard...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-16">
                <p className="text-red-400 mb-2">Failed to load leaderboard</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && filteredEntries.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-gray-400">
                  {search ? "No contributors match your search" : "No contributor data available yet"}
                </p>
              </div>
            )}

            {/* Leaderboard table */}
            {!isLoading && !error && filteredEntries.length > 0 && (
              <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 overflow-visible">
                {/* Table header */}
                <div className="hidden sm:grid sm:grid-cols-[60px_1fr_120px_120px_60px_1fr] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                  <div className="text-center">Rank</div>
                  <div>Contributor</div>
                  <div className="text-right">Points</div>
                  <div className="text-center">Level</div>
                  <div className="text-center" title="Affiliate link clicks from social sharing">Social</div>
                  <div>Breakdown</div>
                </div>

                {/* Table rows */}
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.login}
                    className="grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_120px_60px_1fr] gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    {/* Rank */}
                    <div className="hidden sm:flex justify-center">
                      <RankDisplay rank={entry.rank} />
                    </div>

                    {/* Contributor */}
                    <div className="flex items-center gap-3">
                      <div className="sm:hidden flex-shrink-0 w-8 text-center">
                        <RankDisplay rank={entry.rank} />
                      </div>
                      {entry.avatar_url ? (
                        <Image
                          src={entry.avatar_url}
                          alt={entry.login}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-300">
                          {entry.login[0]?.toUpperCase()}
                        </div>
                      )}
                      <div
                        className="relative flex items-center gap-1.5 min-w-0"
                        onMouseEnter={() => {
                          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                          hoverTimerRef.current = setTimeout(() => setHoveredLogin(entry.login), HOVER_FETCH_DELAY_MS);
                        }}
                        onMouseLeave={() => {
                          if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
                        }}
                      >
                        <Link
                          href={`/leaderboard/${entry.login}`}
                          className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                        >
                          {entry.login}
                        </Link>
                        <a
                          href={`https://github.com/${entry.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                          title="View on GitHub"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </a>
                        {hoveredLogin === entry.login && (
                          <ContributorHoverCard
                            login={entry.login}
                            onClose={() => setHoveredLogin(null)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right tabular-nums font-semibold text-yellow-400 text-sm pl-11 sm:pl-0">
                      {entry.total_points.toLocaleString()}
                    </div>

                    {/* Level */}
                    <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                      <LevelBadge level={entry.level} />
                    </div>

                    {/* Social */}
                    {/* Lowercase the login — GitHub logins are case-insensitive
                        and the affiliate API returns them lowercased, but
                        `entry.login` preserves GitHub's original casing (#1515). */}
                    <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                      <SocialBadge data={affiliateData[entry.login.toLowerCase()]} loading={affiliateLoading} />
                    </div>

                    {/* Breakdown */}
                    <div className="pl-11 sm:pl-0">
                      <BreakdownPills breakdown={entry.breakdown} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Point values reference */}
            {!isLoading && !error && filteredEntries.length > 0 && (
              <div className="mt-8 bg-gray-800/30 backdrop-blur-md rounded-lg border border-white/5 p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Point Values
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono font-bold">500</span>
                    <span className="text-gray-400">PR Merged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-mono font-bold">300</span>
                    <span className="text-gray-400">Bug Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-mono font-bold">200</span>
                    <span className="text-gray-400">PR Opened</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-mono font-bold">100</span>
                    <span className="text-gray-400">Feature Request</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono font-bold">50</span>
                    <span className="text-gray-400">Other Issue</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-600">
                  This leaderboard tracks GitHub contributions only (PRs, issues). Your total in the console may be higher because it includes coins earned from in-app activity (missions, games, sharing) which are stored locally in your browser.
                </p>
              </div>
            )}

          </div>

            {/* Build hash */}
            {data?.git_hash && (
              <p className="mt-4 text-right text-[10px] text-gray-700 font-mono select-all" title="Leaderboard data generation commit">
                {data.git_hash}
              </p>
            )}
        </section>

        {/* CTA Section */}
        <ContributionCallToAction />
      </div>
      <Footer />
    </div>
  );
}
