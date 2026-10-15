/**
 * Unit tests for scripts/lib/leaderboard-merge.mjs — snapshot restore,
 * advance decision, freeze, and frozen + live merge.
 *
 * Filed under kubestellar/docs#7419.
 */
import { describe, it, expect } from "vitest";
import {
  restoreSnapshot,
  shouldAdvanceSnapshot,
  filterFrozenItems,
  freezeItemsIntoSnapshot,
  mergeSnapshotWithLive,
} from "./leaderboard-merge.mjs";
import { POINTS_PR_OPENED } from "./scoring.mjs";

const YEAR_START = "2026-01-01T00:00:00Z";

function pr(id, createdAt, login = "alice") {
  return {
    id,
    created_at: createdAt,
    user: { login, type: "User", avatar_url: `https://a/${login}` },
    pull_request: {},
  };
}

const rawSnapshot = {
  snapshot_date: "2026-03-01T00:00:00Z",
  contributors: {
    alice: {
      avatar_url: "https://a/alice",
      total_points: 10,
      breakdown: { bug_issues: 1, feature_issues: 0, other_issues: 0, prs_opened: 0, prs_merged: 0 },
    },
  },
  item_ids: [1, 2],
  weekly_activity: { alice: { "2026-W05": 2 } },
};

describe("restoreSnapshot", () => {
  it("returns empty state at yearStart when there is no snapshot", () => {
    const s = restoreSnapshot(null, YEAR_START);
    expect(s.contributors.size).toBe(0);
    expect(s.itemIds.size).toBe(0);
    expect(s.weekly.size).toBe(0);
    expect(s.snapshotDate).toBe(YEAR_START);
  });

  it("deserializes contributors, item ids and weekly activity", () => {
    const s = restoreSnapshot(rawSnapshot, YEAR_START);
    expect(s.contributors.get("alice")).toEqual({
      avatarUrl: "https://a/alice",
      totalPoints: 10,
      breakdown: rawSnapshot.contributors.alice.breakdown,
    });
    expect(s.itemIds).toEqual(new Set([1, 2]));
    expect(s.weekly.get("alice").get("2026-W05")).toBe(2);
    expect(s.snapshotDate).toBe("2026-03-01T00:00:00Z");
  });

  it("does not alias the snapshot breakdown", () => {
    const s = restoreSnapshot(rawSnapshot, YEAR_START);
    s.contributors.get("alice").breakdown.bug_issues = 99;
    expect(rawSnapshot.contributors.alice.breakdown.bug_issues).toBe(1);
  });

  it("tolerates missing item_ids and weekly_activity", () => {
    const s = restoreSnapshot(
      { snapshot_date: "2026-03-01T00:00:00Z", contributors: {} },
      YEAR_START
    );
    expect(s.itemIds.size).toBe(0);
    expect(s.weekly.size).toBe(0);
  });
});

describe("shouldAdvanceSnapshot / filterFrozenItems", () => {
  it("advances only when snapshot date is before the boundary", () => {
    expect(shouldAdvanceSnapshot("2026-03-01T00:00:00Z", "2026-03-02T00:00:00Z")).toBe(true);
    expect(shouldAdvanceSnapshot("2026-03-02T00:00:00Z", "2026-03-02T00:00:00Z")).toBe(false);
    expect(shouldAdvanceSnapshot("2026-03-03T00:00:00Z", "2026-03-02T00:00:00Z")).toBe(false);
  });

  it("keeps items in [yearStart, advanceTo)", () => {
    const items = [
      pr(1, "2025-12-31T00:00:00Z"),
      pr(2, YEAR_START),
      pr(3, "2026-03-01T23:59:59Z"),
      pr(4, "2026-03-02T00:00:00Z"),
    ];
    expect(filterFrozenItems(items, YEAR_START, "2026-03-02T00:00:00Z").map((i) => i.id)).toEqual([2, 3]);
  });
});

describe("freezeItemsIntoSnapshot", () => {
  it("first run: freezes items into empty state", () => {
    const state = restoreSnapshot(null, YEAR_START);
    const n = freezeItemsIntoSnapshot([pr(10, "2026-02-02T00:00:00Z")], YEAR_START, state);
    expect(n).toBe(1);
    expect(state.itemIds.has(10)).toBe(true);
    expect(state.contributors.get("alice").totalPoints).toBe(POINTS_PR_OPENED);
    expect(state.weekly.get("alice").size).toBe(1);
  });

  it("advance: adds new items and skips already-frozen ids", () => {
    const state = restoreSnapshot(rawSnapshot, YEAR_START);
    const n = freezeItemsIntoSnapshot(
      [pr(2, "2026-03-01T00:00:00Z"), pr(3, "2026-03-01T00:00:00Z", "bob")],
      YEAR_START,
      state
    );
    expect(n).toBe(1);
    expect(state.contributors.has("bob")).toBe(true);
    expect(state.contributors.get("alice").totalPoints).toBe(10);
  });

  it("nothing to advance: empty items leave state unchanged", () => {
    const state = restoreSnapshot(rawSnapshot, YEAR_START);
    expect(freezeItemsIntoSnapshot([], YEAR_START, state)).toBe(0);
    expect(state.itemIds).toEqual(new Set([1, 2]));
    expect(state.contributors.get("alice").totalPoints).toBe(10);
  });
});

describe("mergeSnapshotWithLive", () => {
  it("adds live items without mutating the frozen state", () => {
    const state = restoreSnapshot(rawSnapshot, YEAR_START);
    const m = mergeSnapshotWithLive(
      state,
      [pr(5, "2026-03-05T00:00:00Z"), pr(6, "2026-03-05T00:00:00Z", "bob")],
      YEAR_START
    );
    expect(m.liveScored).toBe(2);
    expect(m.contributors.get("alice").totalPoints).toBe(10 + POINTS_PR_OPENED);
    expect(m.contributors.has("bob")).toBe(true);
    expect(m.itemIds.has(5)).toBe(true);

    expect(state.contributors.get("alice").totalPoints).toBe(10);
    expect(state.contributors.get("alice").breakdown.prs_opened).toBe(0);
    expect(state.contributors.has("bob")).toBe(false);
    expect(state.itemIds).toEqual(new Set([1, 2]));
    expect(state.weekly.get("alice").size).toBe(1);
  });

  it("does not double-count live items already frozen", () => {
    const state = restoreSnapshot(rawSnapshot, YEAR_START);
    const m = mergeSnapshotWithLive(state, [pr(1, "2026-03-05T00:00:00Z")], YEAR_START);
    expect(m.liveScored).toBe(0);
    expect(m.contributors.get("alice").totalPoints).toBe(10);
  });

  it("empty live set yields a copy equal to the snapshot", () => {
    const state = restoreSnapshot(null, YEAR_START);
    const m = mergeSnapshotWithLive(state, [], YEAR_START);
    expect(m.contributors.size).toBe(0);
    expect(m.liveScored).toBe(0);
  });
});
