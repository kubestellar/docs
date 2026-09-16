"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  GridLines,
  StarField,
  Navbar,
  Footer,
} from "../../../components/index";
import { gtagEvent } from "../../../components/GoogleAnalytics";
import { ACMM_PROJECTS, BADGE_PARTICIPANTS, SNAPSHOT_DATE } from "./data";
import {
  LEVELS,
  MIN_LEVEL,
  TOTAL_CRITERIA,
  TOTAL_SCANNABLE,
  levelFromDetectedIds,
  levelFromScore,
} from "./scoring";
import { LevelBadge, MIN_DATA_POINTS_FOR_SPARKLINE, RankDisplay, ScoreBar, Sparkline } from "./components";

// ── History payload from acmm-history.json ────────────────────────────

interface AcmmHistory {
  dates: string[];
  scores: Record<string, number[]>;
  /** Detected criterion IDs from the latest scan (used for proper level computation). */
  detectedIds?: Record<string, string[]>;
  generated_at?: string;
}

// ── Sort options ──────────────────────────────────────────────────────

type SortField = "name" | "level" | "score";
type SortDir = "asc" | "desc";

// ── Page component ────────────────────────────────────────────────────

export default function AcmmLeaderboardPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [badgeOnly, setBadgeOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showInfo, setShowInfo] = useState(false);
  const [history, setHistory] = useState<AcmmHistory | null>(null);

  useEffect(() => {
    fetch("/data/acmm-history.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.dates && data?.scores) setHistory(data);
      })
      .catch(() => {});
  }, []);

  // ── GA4 event helpers ──────────────────────────────────────────────

  const trackSearch = useCallback((query: string, resultCount: number) => {
    if (query.length >= 2) {
      gtagEvent("acmm_search", { query_length: query.length, result_count: resultCount });
    }
  }, []);

  const trackLevelFilter = useCallback((level: number | null) => {
    gtagEvent("acmm_level_filter", {
      level: level ?? -1,
      action: level !== null ? "select" : "clear",
    });
  }, []);

  const trackBadgeFilter = useCallback((enabled: boolean) => {
    gtagEvent("acmm_badge_filter", { action: enabled ? "on" : "off" });
  }, []);

  const trackSort = useCallback((field: SortField, direction: SortDir) => {
    gtagEvent("acmm_sort_change", { sort_field: field, sort_direction: direction });
  }, []);

  const trackScanClick = useCallback((repo: string, level: number, score: number) => {
    gtagEvent("acmm_scan_click", { repo, level, score });
  }, []);

  const trackRepoClick = useCallback((repo: string, level: number, rank: number) => {
    gtagEvent("acmm_repo_click", { repo, level, rank });
  }, []);

  const trackInfoToggle = useCallback((open: boolean) => {
    gtagEvent("acmm_info_toggle", { action: open ? "open" : "close" });
  }, []);

  const trackDashboardCTA = useCallback(() => {
    gtagEvent("acmm_dashboard_click", { source: "leaderboard_cta" });
  }, []);

  const trackPaperClick = useCallback(() => {
    gtagEvent("acmm_paper_click", { source: "info_panel" });
  }, []);

  // Merge hardcoded snapshot with live scan data when available
  const projects = useMemo(() => {
    if (!history?.scores) return ACMM_PROJECTS;
    return ACMM_PROJECTS.map((p) => {
      const scores = history.scores[p.repo];
      if (!scores?.length) return p;
      const latestScore = scores[scores.length - 1];
      const ids = history.detectedIds?.[p.repo];
      const rawLevel = ids?.length
        ? levelFromDetectedIds(ids)
        : levelFromScore(latestScore);
      // Fold L0 into L1 for display: the ladder starts at L1, and a project
      // below baseline renders as L1 with an unmet-prerequisites marker.
      // Underlying scan data (acmm-history.json) keeps its raw numbers.
      const level = Math.max(rawLevel, MIN_LEVEL);
      return { ...p, score: latestScore, level, unmetPrereqs: rawLevel < MIN_LEVEL };
    });
  }, [history]);

  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const p of projects) counts[p.level] = (counts[p.level] || 0) + 1;
    return counts;
  }, [projects]);

  // Canonical ranking: level desc → score desc (no alpha — pure merit order)
  const canonicalRank = useMemo(() => {
    const ranked = [...projects].sort((a, b) =>
      b.level - a.level || b.score - a.score
    );
    const map = new Map<string, number>();
    ranked.forEach((p, i) => map.set(p.repo, i + 1));
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    let items = projects;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.repo.toLowerCase().includes(q));
    }
    if (levelFilter !== null) {
      items = items.filter((p) => p.level === levelFilter);
    }
    if (badgeOnly) {
      items = items.filter((p) => BADGE_PARTICIPANTS.has(p.repo));
    }
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "score": cmp = a.score - b.score; break;
        case "level": cmp = a.level - b.level || a.score - b.score; break;
        case "name":  cmp = a.repo.localeCompare(b.repo); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [projects, search, levelFilter, badgeOnly, sortField, sortDir]);

  function toggleSort(field: SortField) {
    let newDir: SortDir;
    if (sortField === field) {
      newDir = sortDir === "asc" ? "desc" : "asc";
      setSortDir(newDir);
    } else {
      newDir = field === "name" ? "asc" : "desc";
      setSortField(field);
      setSortDir(newDir);
    }
    trackSort(field, newDir);
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Navbar />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <GridLines horizontalLines={20} verticalLines={20} strokeColor="rgba(255,255,255,0.03)" />
        <StarField density="medium" />
      </div>

      {/* Hero section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
            ACMM Leaderboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-2">
            AI Codebase Maturity Model scores for {ACMM_PROJECTS.length} CNCF &amp; cloud-native projects
          </p>
          <p className="text-gray-600 text-sm">
            {history?.generated_at
              ? `Last scanned: ${history.generated_at.slice(0, 10)}`
              : `Snapshot: ${SNAPSHOT_DATE}`}
            {" "}· {TOTAL_SCANNABLE} publicly detectable signals out of {TOTAL_CRITERIA} ACMM criteria
          </p>

          {/* Hive live dashboard link */}
          <div className="mt-4 mb-2 flex justify-center">
            <a
              href="https://hive.hivecommons.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm hover:bg-purple-500/20 transition-colors"
            >
              <span>&#x1F41D;</span>
              <span><strong>Level 6 in practice</strong> &mdash; KubeStellar/console is the only L5+ project. See the autonomous agents running live.</span>
            </a>
          </div>

          {/* Quick stats — level filters + badge filter */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[6, 5, 4, 3, 2, 1].map((lvl) => {
              const meta = LEVELS[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    const newVal = levelFilter === lvl ? null : lvl;
                    setLevelFilter(newVal);
                    trackLevelFilter(newVal);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    levelFilter === lvl
                      ? `${meta.bg} ${meta.text} ${meta.border} ring-2 ring-offset-1 ring-offset-[#0a0a0f] ring-current`
                      : `${meta.bg} ${meta.text} ${meta.border} opacity-70 hover:opacity-100`
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <span>L{lvl}</span>
                  <span className="text-xs opacity-70">({levelCounts[lvl]})</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                const newVal = !badgeOnly;
                setBadgeOnly(newVal);
                trackBadgeFilter(newVal);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                badgeOnly
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30 ring-2 ring-offset-1 ring-offset-[#0a0a0f] ring-amber-400"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20 opacity-70 hover:opacity-100"
              }`}
            >
              <span>✨</span>
              <span>Badge Participants</span>
              <span className="text-xs opacity-70">({BADGE_PARTICIPANTS.size})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Controls + Table */}
      <section className="relative flex-1 px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Search + info toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  // Debounced search tracking (fires after typing settles)
                  const q = val.toLowerCase();
                  const count = val ? ACMM_PROJECTS.filter((p) => p.repo.toLowerCase().includes(q)).length : ACMM_PROJECTS.length;
                  trackSearch(val, count);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              />
            </div>
            <button
              onClick={() => {
                const newState = !showInfo;
                setShowInfo(newState);
                trackInfoToggle(newState);
              }}
              className="px-4 py-2.5 bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Scoring Works
            </button>
          </div>

          {/* Info panel */}
          {showInfo && (
            <div className="mb-6 bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                ACMM Maturity Levels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const meta = LEVELS[lvl];
                  return (
                    <div key={lvl} className={`p-3 rounded-lg border ${meta.bg} ${meta.border}`}>
                      <div className={`text-sm font-semibold ${meta.text} mb-1`}>
                        {meta.emoji} L{lvl} — {meta.name}
                      </div>
                      <div className="text-xs text-gray-400">{meta.description}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                The full ACMM model defines <strong className="text-gray-400">{TOTAL_CRITERIA} criteria</strong> across six maturity levels (L1–L6). This leaderboard evaluates <strong className="text-gray-400">{TOTAL_SCANNABLE} publicly detectable signals</strong> from repository metadata, CI/CD configuration, and AI instruction files.{" "}
                <a href="https://arxiv.org/abs/2604.09388" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" onClick={trackPaperClick}>
                  Read the paper →
                </a>
              </p>
            </div>
          )}

          {/* Results count + legend */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 mb-3">
            <span>
              Showing {filtered.length} of {ACMM_PROJECTS.length} projects
              {(levelFilter !== null || badgeOnly) && (
                <button
                  onClick={() => { setLevelFilter(null); setBadgeOnly(false); }}
                  className="ml-2 text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </span>
            <span className="flex items-center gap-1">
              ✨ = displays ACMM badge on README · Score = detected / scannable for that level · Trend = 26-week score history
            </span>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-400">No projects match your search</p>
            </div>
          ) : (
            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[60px_1fr_100px_180px_80px_100px] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                <div className="text-center flex items-center justify-center text-gray-500">
                  Rank
                </div>
                <button onClick={() => toggleSort("name")} className="text-left flex items-center cursor-pointer hover:text-gray-300">
                  Project <SortIcon field="name" />
                </button>
                <button onClick={() => toggleSort("level")} className="text-center flex items-center justify-center cursor-pointer hover:text-gray-300">
                  Level <SortIcon field="level" />
                </button>
                <button onClick={() => toggleSort("score")} className="text-left flex items-center cursor-pointer hover:text-gray-300">
                  Score <SortIcon field="score" />
                </button>
                <div className="text-center">Trend</div>
                <div className="text-center">Scan</div>
              </div>

              {/* Table rows */}
              {filtered.map((project) => {
                const rank = canonicalRank.get(project.repo) ?? 0;
                return (
                <div
                  key={project.repo}
                  className="grid grid-cols-1 sm:grid-cols-[60px_1fr_100px_180px_80px_100px] gap-2 sm:gap-4 px-4 sm:px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Rank */}
                  <div className="hidden sm:flex justify-center">
                    <RankDisplay rank={rank} />
                  </div>

                  {/* Project name */}
                  <div className="flex items-center gap-3">
                    <div className="sm:hidden flex-shrink-0 w-8 text-center">
                      <RankDisplay rank={rank} />
                    </div>
                    <a
                      href={`https://github.com/${project.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                      onClick={() => trackRepoClick(project.repo, project.level, rank)}
                    >
                      {project.repo}
                    </a>
                    {BADGE_PARTICIPANTS.has(project.repo) && (
                      <span title="ACMM Participant — displays badge on README" className="flex-shrink-0 cursor-help">
                        ✨
                      </span>
                    )}
                    <a
                      href={`https://github.com/${project.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                      title="View on GitHub"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  </div>

                  {/* Level */}
                  <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                    <LevelBadge level={project.level} unmetPrereqs={project.unmetPrereqs} />
                  </div>

                  {/* Score */}
                  <div className="pl-11 sm:pl-0">
                    <ScoreBar score={project.score} level={project.level} />
                  </div>

                  {/* Trend sparkline */}
                  <div className="hidden sm:flex justify-center">
                    {history?.scores[project.repo]?.length && history.scores[project.repo].length >= MIN_DATA_POINTS_FOR_SPARKLINE ? (
                      <Sparkline values={history.scores[project.repo]} />
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </div>

                  {/* Scan link */}
                  <div className="flex justify-start sm:justify-center pl-11 sm:pl-0">
                    <a
                      href={`https://console.kubestellar.io/acmm?repo=${encodeURIComponent(project.repo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-colors"
                      onClick={() => trackScanClick(project.repo, project.level, project.score)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Scan
                    </a>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 bg-gray-800/30 backdrop-blur-md rounded-lg border border-white/5 p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Scan any repository
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Use the interactive ACMM Dashboard to scan any GitHub repository and get a detailed maturity breakdown.
            </p>
            <a
              href="https://console.kubestellar.io/acmm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              onClick={trackDashboardCTA}
            >
              Open ACMM Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
