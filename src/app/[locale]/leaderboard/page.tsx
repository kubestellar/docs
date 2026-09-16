"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GridLines,
  StarField,
  ContributionCallToAction,
  Navbar,
  Footer,
} from "../../../components/index";
import type { AffiliateData, LeaderboardData, SortDir, SortField } from "./types";
import {
  AFFILIATE_API_URL,
  AFFILIATE_FETCH_TIMEOUT_MS,
  AFFILIATE_RETRY_DELAY_MS,
} from "./types";
import { ActivitySparkline, BreakdownPills, LevelBadge, RankDisplay, SocialBadge } from "./components";
import { ContributorHoverCard, HOVER_FETCH_DELAY_MS } from "./ContributorHoverCard";

// ── Leaderboard data URL ──────────────────────────────────────────────
const LEADERBOARD_DATA_PATH = "/data/leaderboard.json";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [affiliateData, setAffiliateData] = useState<Record<string, AffiliateData>>({});
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [affiliateBannerOpen, setAffiliateBannerOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
    let entries = data.entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter((e) => e.login.toLowerCase().includes(q));
    }
    if (sortField === "activity") {
      const dir = sortDir === "desc" ? 1 : -1;
      entries = [...entries].sort((a, b) =>
        dir * ((b.recent_activity_score ?? 0) - (a.recent_activity_score ?? 0))
      );
    } else {
      const dir = sortDir === "desc" ? 1 : -1;
      entries = [...entries].sort((a, b) =>
        dir * (b.total_points - a.total_points)
      );
    }
    return entries;
  }, [data, search, sortField, sortDir]);

  const lastUpdated = data?.generated_at
    ? new Date(data.generated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
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
                  Generated: {lastUpdated}
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

              {/* Hive live dashboard link */}
              <div className="mt-4 flex justify-center">
                <a
                  href="https://hive.hivecommons.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm hover:bg-amber-500/20 transition-colors"
                >
                  <span>&#x1F41D;</span>
                  <span><strong>See AI agents in action</strong> &mdash; Watch 9 autonomous agents maintain these repos live</span>
                </a>
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
                <div className="hidden sm:grid sm:grid-cols-[60px_1fr_120px_110px_120px_60px_1fr] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                  <div className="text-center">Rank</div>
                  <div>Contributor</div>
                  <button
                    className={`text-right cursor-pointer hover:text-white transition-colors ${sortField === "points" ? "text-yellow-400" : ""}`}
                    onClick={() => {
                      if (sortField === "points") {
                        setSortDir(sortDir === "desc" ? "asc" : "desc");
                      } else {
                        setSortField("points");
                        setSortDir("desc");
                      }
                    }}
                  >
                    Points {sortField === "points" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </button>
                  <button
                    className={`text-center cursor-pointer hover:text-white transition-colors ${sortField === "activity" ? "text-blue-400" : ""}`}
                    onClick={() => {
                      if (sortField === "activity") {
                        setSortDir(sortDir === "desc" ? "asc" : "desc");
                      } else {
                        setSortField("activity");
                        setSortDir("desc");
                      }
                    }}
                    title="Sort by recent activity (last 12 weeks, recency-weighted)"
                  >
                    Activity {sortField === "activity" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </button>
                  <div className="text-center">Level</div>
                  <div className="text-center" title="Affiliate link clicks from social sharing">Social</div>
                  <div>Breakdown</div>
                </div>

                {/* Table rows */}
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.login}
                    className="grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_110px_120px_60px_1fr] gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
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
                            rank={entry.rank}
                            totalPoints={entry.total_points}
                            level={entry.level}
                          />
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right tabular-nums font-semibold text-yellow-400 text-sm pl-11 sm:pl-0">
                      {entry.total_points.toLocaleString()}
                    </div>

                    {/* Activity sparkline */}
                    <div className="flex justify-center pl-11 sm:pl-0">
                      <ActivitySparkline data={entry.weekly_activity || []} weeks={data?.activity_weeks} />
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
