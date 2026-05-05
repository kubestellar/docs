#!/usr/bin/env node

/**
 * Generates leaderboard data using an incremental snapshot strategy.
 *
 * Architecture:
 *   SNAPSHOT (frozen) — historical record from Jan 1 to `snapshot_date`.
 *     Grows by 1 day each run. Items in the snapshot are permanent scores.
 *   DELTA (live) — last 7 days, always re-fetched fresh from GitHub API.
 *     This lets corrections (relabels, scam removal, closed issues) take
 *     effect within 7 days without a full rebuild.
 *   LEADERBOARD = snapshot + delta merged.
 *
 * First run: fetches everything from Jan 1 and creates the snapshot.
 * Subsequent runs: advance snapshot by 1 day, re-fetch last 7 days live.
 *
 * Force a full rebuild: LEADERBOARD_FULL=1
 *
 * Output:
 *   public/data/leaderboard.json           — the rendered leaderboard
 *   public/data/leaderboard-snapshot.json   — incremental snapshot (committed)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

// ── Point values (mirrors rewards.go) ─────────────────────────────────
const POINTS_BUG_ISSUE = 300;
const POINTS_FEATURE_ISSUE = 100;
const POINTS_OTHER_ISSUE = 50;
const POINTS_PR_OPENED = 200;
const POINTS_PR_MERGED = 500;

// ── Repos to scan ─────────────────────────────────────────────────────
const REPOS = [
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
  "kubestellar/docs",
];

// ── Contributor levels ────────────────────────────────────────────────
const CONTRIBUTOR_LEVELS = [
  { rank: 1, name: "Observer", minCoins: 0 },
  { rank: 2, name: "Explorer", minCoins: 500 },
  { rank: 3, name: "Navigator", minCoins: 2000 },
  { rank: 4, name: "Pilot", minCoins: 5000 },
  { rank: 5, name: "Commander", minCoins: 15000 },
  { rank: 6, name: "Captain", minCoins: 50000 },
  { rank: 7, name: "Admiral", minCoins: 150000 },
  { rank: 8, name: "Legend", minCoins: 500000 },
];

// ── Weekly activity trend constants ───────────────────────────────────
const ACTIVITY_WEEKS = 12;
const RECENCY_HALF_LIFE = 3;

// ── GitHub API constants ──────────────────────────────────────────────
const YEAR_START = `${new Date().getFullYear()}-01-01T00:00:00Z`;
const REST_PER_PAGE = 100;
const REST_PAGE_DELAY_MS = 100;
const API_BASE = "https://api.github.com";

// ── Snapshot constants ────────────────────────────────────────────────
/** Live window: last 7 days are always re-fetched fresh from the API.
 *  Corrections (relabels, scam removal) within this window take effect
 *  on the next run without needing a full rebuild. */
const LIVE_WINDOW_DAYS = 7;
const SNAPSHOT_PATH = join(DATA_DIR, "leaderboard-snapshot.json");

// ── Bot/service accounts to exclude from the leaderboard ──────────────
const EXCLUDED_LOGINS = new Set([
  "web-flow",
  "dependabot[bot]",
  "github-actions[bot]",
  "netlify[bot]",
]);

// ── Helpers ───────────────────────────────────────────────────────────

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const FORCE_FULL = process.env.LEADERBOARD_FULL === "1";

const defaultHeaders = {
  Accept: "application/vnd.github.v3+json",
  Authorization: `Bearer ${TOKEN}`,
};

async function ghFetch(url) {
  const res = await fetch(url, { headers: defaultHeaders });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ── Label classification ──────────────────────────────────────────────
const BUG_LABELS = new Set(["bug", "kind/bug", "type/bug"]);
const FEATURE_LABELS = new Set([
  "enhancement",
  "feature",
  "kind/feature",
  "type/feature",
]);

function classifyIssueLabels(labels) {
  for (const label of labels) {
    if (BUG_LABELS.has(label.name))
      return { type: "issue_bug", points: POINTS_BUG_ISSUE };
    if (FEATURE_LABELS.has(label.name))
      return { type: "issue_feature", points: POINTS_FEATURE_ISSUE };
  }
  return { type: "issue_other", points: POINTS_OTHER_ISSUE };
}

function getLevelForPoints(totalPoints) {
  let level = CONTRIBUTOR_LEVELS[0];
  for (let i = CONTRIBUTOR_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= CONTRIBUTOR_LEVELS[i].minCoins) {
      level = CONTRIBUTOR_LEVELS[i];
      break;
    }
  }
  return level;
}

// ── Fetch items from GitHub REST API ──────────────────────────────────

async function fetchItemsSince(repo, sinceDate) {
  const allItems = [];

  for (let page = 1; ; page++) {
    const url = `${API_BASE}/repos/${repo}/issues?state=all&per_page=${REST_PER_PAGE}&page=${page}&sort=created&direction=desc&since=${sinceDate}`;

    if (page > 1) await delay(REST_PAGE_DELAY_MS);

    const items = await ghFetch(url);
    allItems.push(...items);

    if (items.length < REST_PER_PAGE) break;

    const oldest = items[items.length - 1];
    if (oldest && oldest.created_at < sinceDate) break;
  }

  return allItems;
}

// ── Score a list of items into contributor data ───────────────────────

function scoreItemsIntoMap(items, sinceDate, contributorMap, itemIdSet) {
  let scored = 0;

  for (const item of items) {
    const login = item.user?.login;
    if (!login || item.user?.type !== "User") continue;
    if (EXCLUDED_LOGINS.has(login)) continue;
    if (item.created_at < sinceDate) continue;
    if (itemIdSet.has(item.id)) continue;

    itemIdSet.add(item.id);
    scored++;

    if (!contributorMap.has(login)) {
      contributorMap.set(login, {
        avatarUrl: item.user.avatar_url,
        totalPoints: 0,
        breakdown: {
          bug_issues: 0,
          feature_issues: 0,
          other_issues: 0,
          prs_opened: 0,
          prs_merged: 0,
        },
      });
    }

    const entry = contributorMap.get(login);

    if (item.pull_request) {
      entry.totalPoints += POINTS_PR_OPENED;
      entry.breakdown.prs_opened++;
      if (item.pull_request.merged_at) {
        entry.totalPoints += POINTS_PR_MERGED;
        entry.breakdown.prs_merged++;
      }
    } else {
      const { type, points } = classifyIssueLabels(item.labels || []);
      entry.totalPoints += points;
      if (type === "issue_bug") entry.breakdown.bug_issues++;
      else if (type === "issue_feature") entry.breakdown.feature_issues++;
      else entry.breakdown.other_issues++;
    }
  }

  return scored;
}

// ── Snapshot I/O ──────────────────────────────────────────────────────

/**
 * Snapshot stores the frozen historical record:
 * {
 *   snapshot_date: ISO string (items up to this date are frozen),
 *   year_start: ISO string,
 *   contributors: { [login]: { avatar_url, breakdown, total_points } },
 *   item_ids: number[],
 *   weekly_activity: { [login]: { [weekKey]: count } }
 * }
 */

function loadSnapshot() {
  if (FORCE_FULL) {
    console.log("LEADERBOARD_FULL=1 — forcing full rebuild, ignoring snapshot.\n");
    return null;
  }
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8"));
    if (raw.year_start !== YEAR_START) {
      console.log("Snapshot is from a different year — doing full rebuild.\n");
      return null;
    }
    return raw;
  } catch (err) {
    console.warn(`Warning: failed to read snapshot: ${err.message}\n`);
    return null;
  }
}

function saveSnapshot(snapshotDate, contributorMap, itemIdSet, weeklyActivityMap) {
  const contributorsObj = {};
  for (const [login, data] of contributorMap) {
    contributorsObj[login] = {
      avatar_url: data.avatarUrl,
      breakdown: { ...data.breakdown },
      total_points: data.totalPoints,
    };
  }

  const weeklyObj = {};
  for (const [login, weekMap] of weeklyActivityMap) {
    const obj = {};
    for (const [wk, count] of weekMap) {
      obj[wk] = count;
    }
    weeklyObj[login] = obj;
  }

  const snapshot = {
    snapshot_date: snapshotDate,
    year_start: YEAR_START,
    contributors: contributorsObj,
    item_ids: [...itemIdSet],
    weekly_activity: weeklyObj,
  };

  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot) + "\n");
}

// ── Bonus points ──────────────────────────────────────────────────────

const BONUS_AUTHORIZED_USER = "clubanderson";
const BONUS_LABEL = "bonus-points";
const BONUS_REPO = "kubestellar/console";
const BONUS_TITLE_REGEX = /^\[bonus\]\s+@(\S+)\s+\+(\d+)\s*(.*)/i;

async function fetchBonusPoints() {
  const bonuses = new Map();

  try {
    const url = `${API_BASE}/repos/${BONUS_REPO}/issues?labels=${BONUS_LABEL}&state=all&per_page=${REST_PER_PAGE}&creator=${BONUS_AUTHORIZED_USER}`;
    const issues = await ghFetch(url);

    for (const issue of issues) {
      if (issue.user?.login !== BONUS_AUTHORIZED_USER) continue;

      const match = issue.title.match(BONUS_TITLE_REGEX);
      if (!match) {
        console.warn(`  Skipping malformed bonus issue #${issue.number}: "${issue.title}"`);
        continue;
      }

      const [, login, pointsStr, reason] = match;
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points <= 0) continue;

      if (!bonuses.has(login)) {
        bonuses.set(login, { points: 0, reasons: [] });
      }
      const entry = bonuses.get(login);
      entry.points += points;
      entry.reasons.push(`#${issue.number}: +${points} ${reason.trim() || "(no reason)"}`);
    }
  } catch (err) {
    console.warn(`  Warning: failed to fetch bonus issues: ${err.message}`);
  }

  return bonuses;
}

// ── Weekly activity ───────────────────────────────────────────────────

function weekKeyForDate(isoDateStr) {
  const d = new Date(isoDateStr);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getRecentWeekKeys(numWeeks) {
  const now = new Date();
  const keys = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    keys.push(weekKeyForDate(d.toISOString()));
  }
  return [...new Set(keys)].sort();
}

function addItemsToWeeklyActivity(items, sinceDate, weeklyActivityMap) {
  for (const item of items) {
    const login = item.user?.login;
    if (!login || item.user?.type !== "User") continue;
    if (EXCLUDED_LOGINS.has(login)) continue;
    if (item.created_at < sinceDate) continue;

    if (!weeklyActivityMap.has(login)) weeklyActivityMap.set(login, new Map());
    const weekMap = weeklyActivityMap.get(login);
    const wk = weekKeyForDate(item.created_at);
    weekMap.set(wk, (weekMap.get(wk) || 0) + 1);
  }
}

function computeRecentScore(weeklyCounts) {
  let score = 0;
  const len = weeklyCounts.length;
  for (let i = 0; i < len; i++) {
    const weeksAgo = len - 1 - i;
    const weight = Math.pow(0.5, weeksAgo / RECENCY_HALF_LIFE);
    score += weeklyCounts[i] * weight;
  }
  return Math.round(score * 100) / 100;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const snapshot = loadSnapshot();

  const now = new Date();
  const todayStart = startOfDayUTC(now);
  const liveWindowStart = addDays(todayStart, -LIVE_WINDOW_DAYS);
  const liveWindowISO = liveWindowStart.toISOString();

  // The snapshot stores frozen data up to snapshot_date.
  // The live window (last 7 days) is always re-fetched fresh.
  // On each run we advance the snapshot by 1 day — adding items from
  // (old snapshot_date) to (liveWindowStart) into the frozen record.

  /** Frozen contributor data (from snapshot) */
  let snapshotContributors = new Map();
  let snapshotItemIds = new Set();
  let snapshotWeekly = new Map();
  let snapshotDate = YEAR_START;

  if (snapshot) {
    // Restore snapshot
    for (const [login, data] of Object.entries(snapshot.contributors)) {
      snapshotContributors.set(login, {
        avatarUrl: data.avatar_url,
        totalPoints: data.total_points,
        breakdown: { ...data.breakdown },
      });
    }
    snapshotItemIds = new Set(snapshot.item_ids || []);
    for (const [login, weeks] of Object.entries(snapshot.weekly_activity || {})) {
      const weekMap = new Map();
      for (const [wk, count] of Object.entries(weeks)) {
        weekMap.set(wk, count);
      }
      snapshotWeekly.set(login, weekMap);
    }
    snapshotDate = snapshot.snapshot_date;

    // Advance snapshot: fetch items from snapshot_date to liveWindowStart
    // and add them permanently to the frozen record.
    const advanceFrom = snapshotDate;
    const advanceTo = liveWindowISO;

    if (advanceFrom < advanceTo) {
      console.log(`Advancing snapshot: ${advanceFrom.slice(0, 10)} → ${advanceTo.slice(0, 10)}`);
      console.log("Fetching items to freeze into snapshot...\n");

      let advanceItems = [];
      for (const repo of REPOS) {
        try {
          const items = await fetchItemsSince(repo, advanceFrom);
          // Only keep items created before the live window
          const frozen = items.filter(
            (i) => i.created_at >= YEAR_START && i.created_at < advanceTo
          );
          advanceItems.push(...frozen);
          console.log(`  ${repo}: ${frozen.length} items to freeze (${items.length} fetched)`);
        } catch (err) {
          console.warn(`  Warning: failed to fetch ${repo}: ${err.message}`);
        }
      }

      const newFrozen = scoreItemsIntoMap(
        advanceItems,
        YEAR_START,
        snapshotContributors,
        snapshotItemIds
      );
      addItemsToWeeklyActivity(advanceItems, YEAR_START, snapshotWeekly);
      console.log(`\n  Froze ${newFrozen} new items into snapshot.\n`);
    } else {
      console.log(`Snapshot is current (${snapshotDate.slice(0, 10)}). No advancement needed.\n`);
    }
  } else {
    // Full build: fetch everything from YEAR_START to liveWindowStart
    console.log("No snapshot found — doing full build from YEAR_START...\n");

    let allItems = [];
    for (const repo of REPOS) {
      try {
        const items = await fetchItemsSince(repo, YEAR_START);
        allItems.push(...items);
        const issueCount = items.filter((i) => !i.pull_request).length;
        const prCount = items.filter((i) => i.pull_request).length;
        console.log(
          `  ${repo}: ${items.length} items (${issueCount} issues, ${prCount} PRs)`
        );
      } catch (err) {
        console.warn(`  Warning: failed to fetch ${repo}: ${err.message}`);
      }
    }

    console.log(`\nTotal items fetched: ${allItems.length}`);

    // Split into frozen (before live window) and live (within live window)
    const frozenItems = allItems.filter((i) => i.created_at < liveWindowISO);
    scoreItemsIntoMap(frozenItems, YEAR_START, snapshotContributors, snapshotItemIds);
    addItemsToWeeklyActivity(frozenItems, YEAR_START, snapshotWeekly);
    console.log(`Frozen into snapshot: ${snapshotItemIds.size} items\n`);
  }

  // Save updated snapshot (frozen through liveWindowStart)
  saveSnapshot(liveWindowISO, snapshotContributors, snapshotItemIds, snapshotWeekly);
  console.log(`Snapshot saved (${snapshotItemIds.size} frozen items, cutoff ${liveWindowISO.slice(0, 10)}).`);

  // ── Live window: re-fetch last 7 days fresh ─────────────────────
  console.log(`\nFetching live window (last ${LIVE_WINDOW_DAYS} days) from API...\n`);

  let liveItems = [];
  for (const repo of REPOS) {
    try {
      const items = await fetchItemsSince(repo, liveWindowISO);
      liveItems.push(...items);
      const issueCount = items.filter((i) => !i.pull_request).length;
      const prCount = items.filter((i) => i.pull_request).length;
      console.log(
        `  ${repo}: ${items.length} live items (${issueCount} issues, ${prCount} PRs)`
      );
    } catch (err) {
      console.warn(`  Warning: failed to fetch ${repo}: ${err.message}`);
    }
  }

  console.log(`\nLive items fetched: ${liveItems.length}`);

  // ── Merge: snapshot (frozen) + live (fresh) ─────────────────────
  // Deep-clone snapshot contributors so we don't mutate the saved snapshot
  const mergedContributors = new Map();
  for (const [login, data] of snapshotContributors) {
    mergedContributors.set(login, {
      avatarUrl: data.avatarUrl,
      totalPoints: data.totalPoints,
      breakdown: { ...data.breakdown },
    });
  }
  const mergedItemIds = new Set(snapshotItemIds);

  const liveScored = scoreItemsIntoMap(
    liveItems,
    YEAR_START,
    mergedContributors,
    mergedItemIds
  );
  console.log(`Live items scored: ${liveScored}\n`);

  // Weekly activity: clone snapshot weekly + add live items
  const mergedWeekly = new Map();
  for (const [login, weekMap] of snapshotWeekly) {
    mergedWeekly.set(login, new Map(weekMap));
  }
  addItemsToWeeklyActivity(liveItems, YEAR_START, mergedWeekly);

  // ── Bonus points (always fetched fresh — small query) ───────────
  console.log("Fetching bonus point awards...");
  const bonusMap = await fetchBonusPoints();
  for (const [login, bonus] of bonusMap) {
    if (mergedContributors.has(login)) {
      mergedContributors.get(login).totalPoints += bonus.points;
    } else {
      mergedContributors.set(login, {
        avatarUrl: `https://github.com/${login}.png`,
        totalPoints: bonus.points,
        breakdown: { bug_issues: 0, feature_issues: 0, other_issues: 0, prs_opened: 0, prs_merged: 0 },
      });
    }
    for (const reason of bonus.reasons) {
      console.log(`  ${login}: ${reason}`);
    }
  }
  if (bonusMap.size === 0) console.log("  No bonus awards found.");
  console.log("");

  // ── Weekly activity sparkline ───────────────────────────────────
  console.log("Computing weekly activity trends...");
  const recentWeeks = getRecentWeekKeys(ACTIVITY_WEEKS);
  console.log(`  Tracking ${recentWeeks.length} weeks: ${recentWeeks[0]} → ${recentWeeks[recentWeeks.length - 1]}\n`);

  // ── Build sorted entries ────────────────────────────────────────
  const entries = [];
  for (const [login, data] of mergedContributors) {
    const level = getLevelForPoints(data.totalPoints);
    const bonus = bonusMap.get(login);
    const loginWeeks = mergedWeekly.get(login) || new Map();
    const weeklyCounts = recentWeeks.map((wk) => loginWeeks.get(wk) || 0);
    entries.push({
      login,
      avatar_url: data.avatarUrl,
      total_points: data.totalPoints,
      level: level.name,
      level_rank: level.rank,
      breakdown: data.breakdown,
      ...(bonus ? { bonus_points: bonus.points } : {}),
      weekly_activity: weeklyCounts,
      recent_activity_score: computeRecentScore(weeklyCounts),
    });
  }

  entries.sort((a, b) => {
    if (a.total_points !== b.total_points) return b.total_points - a.total_points;
    return a.login.localeCompare(b.login);
  });

  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  // ── Write leaderboard.json ──────────────────────────────────────
  let gitHash = "";
  try {
    gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    // Not in a git repo — ignore
  }

  const output = {
    generated_at: new Date().toISOString(),
    git_hash: gitHash,
    year_start: YEAR_START,
    activity_weeks: recentWeeks,
    entries,
  };

  const outPath = join(DATA_DIR, "leaderboard.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`Done! Wrote ${entries.length} contributors to ${outPath}`);
  console.log(`\nTop 10:`);
  for (const e of entries.slice(0, 10)) {
    console.log(
      `  #${e.rank} ${e.login}: ${e.total_points} pts (${e.level})`
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
