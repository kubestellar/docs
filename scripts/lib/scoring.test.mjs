/**
 * Unit tests for scripts/lib/scoring.mjs — the leaderboard's point values,
 * contributor levels, and recency-weighted weekly activity score used by
 * scripts/generate-leaderboard.mjs.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, it, expect } from "vitest";
import {
  POINTS_BUG_ISSUE,
  POINTS_FEATURE_ISSUE,
  POINTS_OTHER_ISSUE,
  classifyIssueLabels,
  getLevelForPoints,
  weekKeyForDate,
  getRecentWeekKeys,
  computeRecentScore,
} from "./scoring.mjs";

describe("classifyIssueLabels", () => {
  it("attaches the bug point value to a bug-labeled issue", () => {
    expect(classifyIssueLabels([{ name: "bug" }])).toEqual({
      type: "issue_bug",
      points: POINTS_BUG_ISSUE,
    });
  });

  it("attaches the feature point value to a feature-labeled issue", () => {
    expect(classifyIssueLabels([{ name: "enhancement" }])).toEqual({
      type: "issue_feature",
      points: POINTS_FEATURE_ISSUE,
    });
  });

  it("attaches the other point value to an unlabeled/unrecognized issue", () => {
    expect(classifyIssueLabels([])).toEqual({
      type: "issue_other",
      points: POINTS_OTHER_ISSUE,
    });
    expect(classifyIssueLabels([{ name: "documentation" }])).toEqual({
      type: "issue_other",
      points: POINTS_OTHER_ISSUE,
    });
  });
});

describe("getLevelForPoints", () => {
  it("returns the lowest level (Observer) for zero points", () => {
    expect(getLevelForPoints(0).name).toBe("Observer");
  });

  it("returns the level at the exact minCoins boundary", () => {
    expect(getLevelForPoints(500).name).toBe("Explorer");
    expect(getLevelForPoints(499).name).toBe("Observer");
  });

  it("returns the highest level (Legend) for very high points", () => {
    expect(getLevelForPoints(1_000_000).name).toBe("Legend");
  });

  it("returns the correct mid-range level", () => {
    expect(getLevelForPoints(3000).name).toBe("Navigator");
  });
});

describe("weekKeyForDate", () => {
  it("returns the Monday of the containing ISO week", () => {
    // 2026-03-18 is a Wednesday
    expect(weekKeyForDate("2026-03-18T12:00:00Z")).toBe("2026-03-16");
  });

  it("returns the same date when given a Monday", () => {
    expect(weekKeyForDate("2026-03-16T00:00:00Z")).toBe("2026-03-16");
  });

  it("maps a Sunday to the Monday that started its week", () => {
    // 2026-03-22 is a Sunday, belonging to the week starting 2026-03-16
    expect(weekKeyForDate("2026-03-22T23:59:59Z")).toBe("2026-03-16");
  });
});

describe("getRecentWeekKeys", () => {
  it("returns the requested number of distinct, sorted week keys", () => {
    const keys = getRecentWeekKeys(12);
    expect(keys.length).toBeLessThanOrEqual(12);
    expect(keys.length).toBeGreaterThan(0);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("includes the current week", () => {
    const keys = getRecentWeekKeys(1);
    expect(keys).toEqual([weekKeyForDate(new Date().toISOString())]);
  });
});

describe("computeRecentScore", () => {
  it("returns 0 for all-zero weekly counts", () => {
    expect(computeRecentScore([0, 0, 0])).toBe(0);
  });

  it("weights the most recent week (last element) higher than older weeks", () => {
    const recentOnly = computeRecentScore([0, 0, 5]);
    const oldOnly = computeRecentScore([5, 0, 0]);
    expect(recentOnly).toBeGreaterThan(oldOnly);
  });

  it("rounds the score to 2 decimal places", () => {
    const score = computeRecentScore([1, 1, 1]);
    expect(score).toBe(Math.round(score * 100) / 100);
  });
});
