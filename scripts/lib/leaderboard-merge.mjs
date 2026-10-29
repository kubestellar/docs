/**
 * Pure orchestration helpers for scripts/generate-leaderboard.mjs:
 * snapshot restore, advance decision/freeze filter, frozen + live merge,
 * and the final entry-list assembly (level/bonus/weekly merge + ranking).
 */

import { scoreItemsIntoMap, addItemsToWeeklyActivity } from "./snapshot.mjs";

/** Deserialize a snapshot file object into in-memory Maps/Sets. */
export function restoreSnapshot(snapshot, yearStart) {
  const contributors = new Map();
  const weekly = new Map();
  let itemIds = new Set();
  let snapshotDate = yearStart;

  if (snapshot) {
    for (const [login, data] of Object.entries(snapshot.contributors || {})) {
      contributors.set(login, {
        avatarUrl: data.avatar_url,
        totalPoints: data.total_points,
        breakdown: { ...data.breakdown },
      });
    }
    itemIds = new Set(snapshot.item_ids || []);
    for (const [login, weeks] of Object.entries(snapshot.weekly_activity || {})) {
      weekly.set(login, new Map(Object.entries(weeks)));
    }
    snapshotDate = snapshot.snapshot_date;
  }

  return { contributors, itemIds, weekly, snapshotDate };
}

/** True when the snapshot lags the live-window boundary. ISO strings compare lexically. */
export function shouldAdvanceSnapshot(advanceFrom, advanceTo) {
  return advanceFrom < advanceTo;
}

/** Keep only items created in [yearStart, advanceTo) — eligible to be frozen. */
export function filterFrozenItems(items, yearStart, advanceTo) {
  return items.filter((i) => i.created_at >= yearStart && i.created_at < advanceTo);
}

/**
 * Freeze items into the snapshot state (mutates state). Returns number of newly scored items.
 */
export function freezeItemsIntoSnapshot(items, yearStart, state) {
  const newlyFrozen = scoreItemsIntoMap(items, yearStart, state.contributors, state.itemIds);
  addItemsToWeeklyActivity(items, yearStart, state.weekly);
  return newlyFrozen;
}

/**
 * Merge frozen snapshot state with live items without mutating the snapshot state.
 */
export function mergeSnapshotWithLive(state, liveItems, yearStart) {
  const contributors = new Map();
  for (const [login, data] of state.contributors) {
    contributors.set(login, {
      avatarUrl: data.avatarUrl,
      totalPoints: data.totalPoints,
      breakdown: { ...data.breakdown },
    });
  }
  const itemIds = new Set(state.itemIds);
  const liveScored = scoreItemsIntoMap(liveItems, yearStart, contributors, itemIds);

  const weekly = new Map();
  for (const [login, weekMap] of state.weekly) {
    weekly.set(login, new Map(weekMap));
  }
  addItemsToWeeklyActivity(liveItems, yearStart, weekly);

  return { contributors, itemIds, weekly, liveScored };
}

/**
 * Build the sorted, ranked leaderboard entry list from merged contributor
 * totals, per-login weekly activity, and bonus-point awards. Pure function:
 * `getLevelForPoints`/`computeRecentScore` are injected so this has no
 * dependency on scoring.mjs internals or wall-clock time.
 */
export function buildLeaderboardEntries(
  mergedContributors,
  mergedWeekly,
  bonusMap,
  recentWeeks,
  getLevelForPoints,
  computeRecentScore
) {
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

  return entries;
}

/** Apply a bonus-point award map onto merged contributor totals (mutates `mergedContributors`). */
export function applyBonusPoints(mergedContributors, bonusMap) {
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
  }
}
