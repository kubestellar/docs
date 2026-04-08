"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GridLines,
  StarField,
  ContributionCallToAction,
  Navbar,
  Footer,
} from "../../../components/index";

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
  entries: LeaderboardEntry[];
}

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
    pills.push({ label: `${breakdown.prs_opened} PRs`, color: "text-blue-400 bg-blue-500/10" });
  if (breakdown.bug_issues > 0)
    pills.push({ label: `${breakdown.bug_issues} Bugs`, color: "text-red-400 bg-red-500/10" });
  if (breakdown.feature_issues > 0)
    pills.push({ label: `${breakdown.feature_issues} Features`, color: "text-purple-400 bg-purple-500/10" });
  if (breakdown.other_issues > 0)
    pills.push({ label: `${breakdown.other_issues} Issues`, color: "text-gray-400 bg-gray-500/10" });

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
                Tracking all-time contributions across{" "}
                <a href="https://github.com/kubestellar/console" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">console</a>,{" "}
                <a href="https://github.com/kubestellar/console-marketplace" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">console-marketplace</a>, and{" "}
                <a href="https://github.com/kubestellar/console-kb" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">console-kb</a>
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
              <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid sm:grid-cols-[60px_1fr_120px_120px_1fr] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                  <div className="text-center">Rank</div>
                  <div>Contributor</div>
                  <div className="text-right">Points</div>
                  <div className="text-center">Level</div>
                  <div>Breakdown</div>
                </div>

                {/* Table rows */}
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.login}
                    className="grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_120px_1fr] gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
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
                      <a
                        href={`https://github.com/${entry.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                      >
                        {entry.login}
                      </a>
                      <Link
                        href={`/leaderboard/${entry.login}`}
                        className="text-gray-500 hover:text-blue-400 transition-colors flex-shrink-0 ml-1"
                        title="View contributor stats"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      </Link>
                    </div>

                    {/* Points */}
                    <div className="text-right tabular-nums font-semibold text-yellow-400 text-sm pl-11 sm:pl-0">
                      {entry.total_points.toLocaleString()}
                    </div>

                    {/* Level */}
                    <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                      <LevelBadge level={entry.level} />
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
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <ContributionCallToAction />
      </div>
      <Footer />
    </div>
  );
}
