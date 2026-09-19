/**
 * Unit tests for scripts/lib/acmm-history.mjs — the rolling-window,
 * idempotency, and legacy-migration helpers extracted from
 * scripts/generate-acmm-history.mjs so they can be unit-tested without the
 * scan-API network calls made by the runner.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, it, expect } from "vitest";
import {
  todayUTC,
  migrateLegacyHistory,
  seedColdStart,
  checkIdempotency,
  applyScanResults,
} from "./acmm-history.mjs";

describe("todayUTC", () => {
  it("formats a date as YYYY-MM-DD in UTC", () => {
    expect(todayUTC(new Date("2026-03-15T23:59:59Z"))).toBe("2026-03-15");
  });

  it("defaults to the current date when no argument is given", () => {
    expect(todayUTC()).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe("migrateLegacyHistory", () => {
  it("migrates a legacy 'weeks' key to 'dates'", () => {
    const history = migrateLegacyHistory({ weeks: ["2026-03-16"], scores: { a: [1] } });
    expect(history.dates).toEqual(["2026-03-16"]);
    expect(history).not.toHaveProperty("weeks");
  });

  it("prefers an existing 'dates' key over 'weeks' if both are present", () => {
    const history = migrateLegacyHistory({ weeks: ["old"], dates: ["2026-03-16"], scores: {} });
    expect(history.dates).toEqual(["2026-03-16"]);
  });

  it("defaults missing 'dates'/'scores' to empty containers", () => {
    const history = migrateLegacyHistory({});
    expect(history.dates).toEqual([]);
    expect(history.scores).toEqual({});
  });

  it("leaves an already-current history untouched", () => {
    const history = migrateLegacyHistory({ dates: ["2026-03-16"], scores: { a: [3] } });
    expect(history).toEqual({ dates: ["2026-03-16"], scores: { a: [3] } });
  });
});

describe("seedColdStart", () => {
  it("seeds the seed date and per-repo seed scores when history is empty", () => {
    const history = { dates: [], scores: {} };
    seedColdStart(history, ["repo/a", "repo/b"], "2026-04-22", { "repo/a": 3 });
    expect(history.dates).toEqual(["2026-04-22"]);
    expect(history.scores["repo/a"]).toEqual([3]);
    expect(history.scores["repo/b"]).toEqual([0]);
  });

  it("is a no-op when history already has data points", () => {
    const history = { dates: ["2026-03-01"], scores: { "repo/a": [5] } };
    seedColdStart(history, ["repo/a"], "2026-04-22", { "repo/a": 3 });
    expect(history.dates).toEqual(["2026-03-01"]);
    expect(history.scores["repo/a"]).toEqual([5]);
  });
});

describe("checkIdempotency", () => {
  it("is a no-op when today is already recorded with detectedIds populated", () => {
    const history = { dates: ["2026-03-15"], detectedIds: { "repo/a": [1] } };
    const result = checkIdempotency(history, "2026-03-15");
    expect(result.isNoOp).toBe(true);
    expect(result.isBackfill).toBe(false);
  });

  it("is a backfill when today is recorded but detectedIds is missing", () => {
    const history = { dates: ["2026-03-15"] };
    const result = checkIdempotency(history, "2026-03-15");
    expect(result.isNoOp).toBe(false);
    expect(result.isBackfill).toBe(true);
  });

  it("is a backfill when detectedIds is present but empty", () => {
    const history = { dates: ["2026-03-15"], detectedIds: {} };
    const result = checkIdempotency(history, "2026-03-15");
    expect(result.isBackfill).toBe(true);
  });

  it("is neither a no-op nor a backfill for a new day", () => {
    const history = { dates: ["2026-03-14"], detectedIds: { "repo/a": [1] } };
    const result = checkIdempotency(history, "2026-03-15");
    expect(result.isNoOp).toBe(false);
    expect(result.isBackfill).toBe(false);
  });
});

describe("applyScanResults", () => {
  it("appends a new day's scores and stores detectedIds", () => {
    const history = { dates: ["2026-03-14"], scores: { "repo/a": [1] } };
    applyScanResults(history, {
      repos: ["repo/a"],
      today: "2026-03-15",
      scores: { "repo/a": 2 },
      latestDetectedIds: { "repo/a": ["x"] },
      isBackfill: false,
      maxDataPoints: 104,
    });
    expect(history.dates).toEqual(["2026-03-14", "2026-03-15"]);
    expect(history.scores["repo/a"]).toEqual([1, 2]);
    expect(history.detectedIds).toEqual({ "repo/a": ["x"] });
  });

  it("overwrites the last entry in place when backfilling", () => {
    const history = { dates: ["2026-03-14", "2026-03-15"], scores: { "repo/a": [1, 0] } };
    applyScanResults(history, {
      repos: ["repo/a"],
      today: "2026-03-15",
      scores: { "repo/a": 9 },
      latestDetectedIds: {},
      isBackfill: true,
      maxDataPoints: 104,
    });
    expect(history.dates).toEqual(["2026-03-14", "2026-03-15"]);
    expect(history.scores["repo/a"]).toEqual([1, 9]);
  });

  it("trims the oldest data points once maxDataPoints is exceeded", () => {
    const history = { dates: ["2026-01-01", "2026-01-02"], scores: { "repo/a": [1, 2] } };
    applyScanResults(history, {
      repos: ["repo/a"],
      today: "2026-01-03",
      scores: { "repo/a": 3 },
      latestDetectedIds: {},
      isBackfill: false,
      maxDataPoints: 2,
    });
    expect(history.dates).toEqual(["2026-01-02", "2026-01-03"]);
    expect(history.scores["repo/a"]).toEqual([2, 3]);
  });

  it("drops repos no longer in the tracked repo list", () => {
    const history = { dates: ["2026-01-01"], scores: { "repo/a": [1], "repo/stale": [5] } };
    applyScanResults(history, {
      repos: ["repo/a"],
      today: "2026-01-02",
      scores: { "repo/a": 2 },
      latestDetectedIds: {},
      isBackfill: false,
      maxDataPoints: 104,
    });
    expect(history.scores).not.toHaveProperty("repo/stale");
  });

  it("defaults a repo missing from the scan result to 0", () => {
    const history = { dates: [], scores: {} };
    applyScanResults(history, {
      repos: ["repo/a"],
      today: "2026-01-01",
      scores: {},
      latestDetectedIds: {},
      isBackfill: false,
      maxDataPoints: 104,
    });
    expect(history.scores["repo/a"]).toEqual([0]);
  });
});
