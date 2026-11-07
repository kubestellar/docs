/**
 * Unit tests for scripts/lib/acmm-tracked-repos.mjs.
 *
 * Filed under kubestellar/docs (ACMM leaderboard scan-list drift).
 */
import { describe, it, expect } from "vitest";
import { TRACKED_REPOS } from "./acmm-tracked-repos.mjs";

describe("TRACKED_REPOS", () => {
  it("is a non-empty array of strings", () => {
    expect(Array.isArray(TRACKED_REPOS)).toBe(true);
    expect(TRACKED_REPOS.length).toBeGreaterThan(0);
    for (const repo of TRACKED_REPOS) {
      expect(typeof repo).toBe("string");
    }
  });

  it('every entry is an "owner/repo" pair', () => {
    for (const repo of TRACKED_REPOS) {
      expect(repo).toMatch(/^[^/\s]+\/[^/\s]+$/);
    }
  });

  it("has no duplicate entries (each wastes a scan-API call per run)", () => {
    const seen = new Set();
    const dupes = [];
    for (const repo of TRACKED_REPOS) {
      if (seen.has(repo)) dupes.push(repo);
      seen.add(repo);
    }
    expect(dupes, `duplicates: ${dupes.join(", ")}`).toEqual([]);
  });

  it("includes kubestellar/console (the project this leaderboard belongs to)", () => {
    expect(TRACKED_REPOS).toContain("kubestellar/console");
  });
});
