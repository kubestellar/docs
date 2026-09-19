/**
 * Unit tests for scripts/lib/snapshot.mjs — the leaderboard's per-item
 * scoring, weekly-activity aggregation, and frozen-snapshot persistence
 * used by scripts/generate-leaderboard.mjs's incremental strategy.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EXCLUDED_LOGINS,
  scoreItemsIntoMap,
  addItemsToWeeklyActivity,
  loadSnapshot,
  saveSnapshot,
} from "./snapshot.mjs";

function issue({
  login = "alice",
  type = "User",
  createdAt = "2026-03-01T00:00:00Z",
  id = 1,
  isPr = false,
  merged = false,
  labels = [],
} = {}) {
  return {
    id,
    user: { login, type, avatar_url: `https://github.com/${login}.png` },
    created_at: createdAt,
    labels,
    ...(isPr
      ? { pull_request: merged ? { merged_at: "2026-03-02T00:00:00Z" } : {} }
      : {}),
  };
}

describe("scoreItemsIntoMap", () => {
  it("skips items from bot/service accounts", () => {
    const contributors = new Map();
    const ids = new Set();
    for (const login of EXCLUDED_LOGINS) {
      const scored = scoreItemsIntoMap(
        [issue({ login, id: Math.random() })],
        "2026-01-01T00:00:00Z",
        contributors,
        ids
      );
      expect(scored).toBe(0);
    }
    expect(contributors.size).toBe(0);
  });

  it("skips items without a user or with a non-User actor type", () => {
    const contributors = new Map();
    const ids = new Set();
    const noUser = { id: 1, created_at: "2026-03-01T00:00:00Z", labels: [] };
    const botUser = issue({ login: "some-bot", type: "Bot" });
    const scored = scoreItemsIntoMap(
      [noUser, botUser],
      "2026-01-01T00:00:00Z",
      contributors,
      ids
    );
    expect(scored).toBe(0);
  });

  it("skips items created before sinceDate", () => {
    const contributors = new Map();
    const ids = new Set();
    const scored = scoreItemsIntoMap(
      [issue({ createdAt: "2025-01-01T00:00:00Z" })],
      "2026-01-01T00:00:00Z",
      contributors,
      ids
    );
    expect(scored).toBe(0);
  });

  it("de-duplicates items already present in the id set", () => {
    const contributors = new Map();
    const ids = new Set([1]);
    const scored = scoreItemsIntoMap(
      [issue({ id: 1 })],
      "2026-01-01T00:00:00Z",
      contributors,
      ids
    );
    expect(scored).toBe(0);
  });

  it("scores a bug-labeled issue and tracks the breakdown", () => {
    const contributors = new Map();
    const ids = new Set();
    const scored = scoreItemsIntoMap(
      [issue({ id: 1, labels: [{ name: "bug" }] })],
      "2026-01-01T00:00:00Z",
      contributors,
      ids
    );
    expect(scored).toBe(1);
    const alice = contributors.get("alice");
    expect(alice.breakdown.bug_issues).toBe(1);
    expect(alice.totalPoints).toBe(300);
  });

  it("scores an opened PR and a separately-merged PR", () => {
    const contributors = new Map();
    const ids = new Set();
    scoreItemsIntoMap(
      [issue({ id: 1, isPr: true, merged: false })],
      "2026-01-01T00:00:00Z",
      contributors,
      ids
    );
    scoreItemsIntoMap(
      [issue({ id: 2, isPr: true, merged: true })],
      "2026-01-01T00:00:00Z",
      contributors,
      ids
    );
    const alice = contributors.get("alice");
    expect(alice.breakdown.prs_opened).toBe(2);
    expect(alice.breakdown.prs_merged).toBe(1);
    expect(alice.totalPoints).toBe(200 + 200 + 500);
  });
});

describe("addItemsToWeeklyActivity", () => {
  it("buckets items into their week key per contributor", () => {
    const weekly = new Map();
    addItemsToWeeklyActivity(
      [issue({ createdAt: "2026-03-18T00:00:00Z" })],
      "2026-01-01T00:00:00Z",
      weekly
    );
    const aliceWeeks = weekly.get("alice");
    expect(aliceWeeks.get("2026-03-16")).toBe(1);
  });

  it("ignores excluded logins and items before sinceDate", () => {
    const weekly = new Map();
    addItemsToWeeklyActivity(
      [
        issue({ login: "dependabot[bot]" }),
        issue({ createdAt: "2020-01-01T00:00:00Z" }),
      ],
      "2026-01-01T00:00:00Z",
      weekly
    );
    expect(weekly.size).toBe(0);
  });
});

describe("loadSnapshot / saveSnapshot", () => {
  let dir;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("returns null when forceFull is set, without reading the file", () => {
    dir = mkdtempSync(join(tmpdir(), "snapshot-test-"));
    const path = join(dir, "snapshot.json");
    expect(loadSnapshot(path, "2026-01-01T00:00:00Z", true)).toBeNull();
  });

  it("returns null when the snapshot file does not exist", () => {
    dir = mkdtempSync(join(tmpdir(), "snapshot-test-"));
    const path = join(dir, "missing.json");
    expect(loadSnapshot(path, "2026-01-01T00:00:00Z", false)).toBeNull();
  });

  it("round-trips a snapshot through saveSnapshot and loadSnapshot", () => {
    dir = mkdtempSync(join(tmpdir(), "snapshot-test-"));
    const path = join(dir, "snapshot.json");

    const contributors = new Map([
      [
        "alice",
        {
          avatarUrl: "https://github.com/alice.png",
          totalPoints: 300,
          breakdown: {
            bug_issues: 1,
            feature_issues: 0,
            other_issues: 0,
            prs_opened: 0,
            prs_merged: 0,
          },
        },
      ],
    ]);
    const itemIds = new Set([1]);
    const weekly = new Map([["alice", new Map([["2026-03-16", 2]])]]);

    saveSnapshot(path, "2026-03-20T00:00:00Z", "2026-01-01T00:00:00Z", contributors, itemIds, weekly);

    expect(existsSync(path)).toBe(true);
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    expect(raw.snapshot_date).toBe("2026-03-20T00:00:00Z");
    expect(raw.contributors.alice.total_points).toBe(300);
    expect(raw.item_ids).toEqual([1]);
    expect(raw.weekly_activity.alice["2026-03-16"]).toBe(2);

    const loaded = loadSnapshot(path, "2026-01-01T00:00:00Z", false);
    expect(loaded.snapshot_date).toBe("2026-03-20T00:00:00Z");
  });

  it("returns null and does a full rebuild when the snapshot year doesn't match", () => {
    dir = mkdtempSync(join(tmpdir(), "snapshot-test-"));
    const path = join(dir, "snapshot.json");
    saveSnapshot(path, "2025-06-01T00:00:00Z", "2025-01-01T00:00:00Z", new Map(), new Set(), new Map());
    expect(loadSnapshot(path, "2026-01-01T00:00:00Z", false)).toBeNull();
  });

  it("returns null when the snapshot file contains invalid JSON", () => {
    dir = mkdtempSync(join(tmpdir(), "snapshot-test-"));
    const path = join(dir, "snapshot.json");
    writeFileSync(path, "{not valid json");
    expect(loadSnapshot(path, "2026-01-01T00:00:00Z", false)).toBeNull();
  });
});
