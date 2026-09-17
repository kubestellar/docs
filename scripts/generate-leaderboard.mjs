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

import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDefaultHeaders } from "./lib/github-fetch.mjs";
import { fetchItemsSince } from "./lib/leaderboard-fetch.mjs";
import {
  ACTIVITY_WEEKS,
  getLevelForPoints,
  getRecentWeekKeys,
  computeRecentScore,
} from "./lib/scoring.mjs";
import {
  scoreItemsIntoMap,
  addItemsToWeeklyActivity,
  loadSnapshot,
  saveSnapshot,
} from "./lib/snapshot.mjs";
import { fetchBonusPoints } from "./lib/bonus-points.mjs";
import { startOfDayUTC, addDays } from "./lib/dates.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

// ── Repos to scan ─────────────────────────────────────────────────────
const REPOS = [
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
  "kubestellar/docs",
];

// ── GitHub API constants ──────────────────────────────────────────────
const YEAR_START = `${new Date().getFullYear()}-01-01T00:00:00Z`;

// ── Snapshot constants ────────────────────────────────────────────────
/** Live window: last 7 days are always re-fetched fresh from the API.
 *  Corrections (relabels, scam removal) within this window take effect
 *  on the next run without needing a full rebuild. */
const LIVE_WINDOW_DAYS = 7;
const SNAPSHOT_PATH = join(DATA_DIR, "leaderboard-snapshot.json");

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const FORCE_FULL = process.env.LEADERBOARD_FULL === "1";
const defaultHeaders = buildDefaultHeaders(TOKEN);

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const snapshot = loadSnapshot(SNAPSHOT_PATH, YEAR_START, FORCE_FULL);

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
          const items = await fetchItemsSince(repo, advanceFrom, defaultHeaders);
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
        const items = await fetchItemsSince(repo, YEAR_START, defaultHeaders);
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
  saveSnapshot(SNAPSHOT_PATH, liveWindowISO, YEAR_START, snapshotContributors, snapshotItemIds, snapshotWeekly);
  console.log(`Snapshot saved (${snapshotItemIds.size} frozen items, cutoff ${liveWindowISO.slice(0, 10)}).`);

  // ── Live window: re-fetch last 7 days fresh ─────────────────────
  console.log(`\nFetching live window (last ${LIVE_WINDOW_DAYS} days) from API...\n`);

  let liveItems = [];
  for (const repo of REPOS) {
    try {
      const items = await fetchItemsSince(repo, liveWindowISO, defaultHeaders);
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
  const bonusMap = await fetchBonusPoints(defaultHeaders);
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
