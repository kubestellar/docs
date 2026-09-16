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
import type { ContributorProfile, LeaderboardData, StretchArea } from "./types";
import { DAY_LABELS, LEVEL_STYLES, REPO_COLORS, TREND_DISPLAY } from "./constants";
import { ContributionRadarChart } from "./components/ContributionRadarChart";
import { HeatmapCell } from "./components/HeatmapCell";
import { TopicBar } from "./components/TopicBar";
import { SuggestionCard } from "./components/SuggestionCard";
import { TimelineSparkline } from "./components/TimelineSparkline";

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
    const profileFetch = fetch(`/data/contributors/${username}.json`)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404 ? "not_found" : `HTTP ${res.status}`
          );
        return res.json() as Promise<ContributorProfile>;
      });

    const leaderboardFetch = fetch("/data/leaderboard.json")
      .then((res) => (res.ok ? (res.json() as Promise<LeaderboardData>) : null))
      .catch(() => null);

    Promise.all([profileFetch, leaderboardFetch])
      .then(([profileData, leaderboardData]) => {
        // Merge authoritative scoring fields from leaderboard.json
        // (single source of truth) into the contributor profile.
        // Profile generation can lag behind leaderboard generation,
        // so leaderboard values take precedence for points/rank/level.
        if (leaderboardData) {
          const lbEntry = leaderboardData.entries.find(
            (e) => e.login.toLowerCase() === username.toLowerCase()
          );
          if (lbEntry) {
            profileData.total_points = lbEntry.total_points;
            profileData.rank = lbEntry.rank;
            profileData.level = lbEntry.level;
            profileData.level_rank = lbEntry.level_rank;
          }
        }
        setProfile(profileData);
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

                {/* ── Repository Contributions ────────────────── */}
                {profile.repo_breakdown && profile.repo_breakdown.length > 0 && (
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6 overflow-hidden">
                    <h2 className="text-lg font-semibold text-white mb-1">
                      Repository Contributions
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                      Breakdown of issues and PRs by repository
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.repo_breakdown.map((rb) => (
                        <div
                          key={rb.repo}
                          className="bg-gray-900/40 rounded-lg border border-white/5 p-4 flex flex-col gap-4 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider ${REPO_COLORS[rb.repo] || "text-gray-400 bg-gray-500/10"}`}
                            >
                              {rb.repo.toUpperCase()}
                            </span>
                            <div className="flex gap-2">
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                Total Contribution: {rb.bug_issues + rb.feature_issues + rb.other_issues + rb.prs_opened}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            {/* Issues Breakdown */}
                            <div className="space-y-3">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-b border-white/5 pb-1">
                                Issues
                              </p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[13px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    <span className="text-gray-300">Bugs</span>
                                  </div>
                                  <span className="text-white font-semibold tabular-nums">{rb.bug_issues}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <span className="text-gray-300">Features</span>
                                  </div>
                                  <span className="text-white font-semibold tabular-nums">{rb.feature_issues}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    <span className="text-gray-300">Other</span>
                                  </div>
                                  <span className="text-white font-semibold tabular-nums">{rb.other_issues}</span>
                                </div>
                              </div>
                            </div>

                            {/* PRs Breakdown */}
                            <div className="space-y-3">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-b border-white/5 pb-1">
                                Pull Requests
                              </p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[13px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    <span className="text-gray-300">Opened</span>
                                  </div>
                                  <span className="text-white font-semibold tabular-nums">{rb.prs_opened}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-gray-300">Merged</span>
                                  </div>
                                  <span className="text-white font-semibold tabular-nums">{rb.prs_merged}</span>
                                </div>

                                <div className="pt-1">
                                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-purple-500 to-green-500"
                                      style={{ width: `${rb.prs_opened > 0 ? (rb.prs_merged / rb.prs_opened) * 100 : 0}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-1 text-right font-medium">
                                    {rb.prs_opened > 0
                                      ? `${Math.round((rb.prs_merged / rb.prs_opened) * 100)}% merged`
                                      : "No PR activity"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
