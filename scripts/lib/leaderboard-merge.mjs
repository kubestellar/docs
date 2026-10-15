/**
 * Pure orchestration helpers for scripts/generate-leaderboard.mjs:
 * snapshot restore, advance decision/freeze filter, and frozen + live merge.
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
