/**
 * Scores fetched GitHub items (issues/PRs) into per-contributor point
 * totals and weekly activity counts, and persists/restores the frozen
 * "snapshot" record used by the leaderboard's incremental strategy.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { POINTS_PR_OPENED, POINTS_PR_MERGED, classifyIssueLabels, weekKeyForDate } from "./scoring.mjs";

// ── Bot/service accounts to exclude from the leaderboard ──────────────
export const EXCLUDED_LOGINS = new Set([
  "web-flow",
  "dependabot[bot]",
  "github-actions[bot]",
  "netlify[bot]",
]);

export function scoreItemsIntoMap(items, sinceDate, contributorMap, itemIdSet) {
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

export function addItemsToWeeklyActivity(items, sinceDate, weeklyActivityMap) {
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

export function loadSnapshot(snapshotPath, yearStart, forceFull) {
  if (forceFull) {
    console.log("LEADERBOARD_FULL=1 — forcing full rebuild, ignoring snapshot.\n");
    return null;
  }
  if (!existsSync(snapshotPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(snapshotPath, "utf-8"));
    if (raw.year_start !== yearStart) {
      console.log("Snapshot is from a different year — doing full rebuild.\n");
      return null;
    }
    return raw;
  } catch (err) {
    console.warn(`Warning: failed to read snapshot: ${err.message}\n`);
    return null;
  }
}

export function saveSnapshot(snapshotPath, snapshotDate, yearStart, contributorMap, itemIdSet, weeklyActivityMap) {
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
    year_start: yearStart,
    contributors: contributorsObj,
    item_ids: [...itemIdSet],
    weekly_activity: weeklyObj,
  };

  writeFileSync(snapshotPath, JSON.stringify(snapshot) + "\n");
}
