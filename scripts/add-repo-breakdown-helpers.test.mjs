import { describe, it, expect } from "vitest";
import {
  categorizeIssuesByRepo,
  sortRepoBreakdown,
} from "./add-repo-breakdown-helpers.mjs";

describe("categorizeIssuesByRepo", () => {
  it("returns an empty map for an empty list", () => {
    const result = categorizeIssuesByRepo([]);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it("initializes a per-repo aggregate with all six counters at zero on first sight", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/bug"] },
    ]);
    expect(result.get("kubestellar/docs")).toEqual({
      repo: "kubestellar/docs",
      bug_issues: 1,
      feature_issues: 0,
      other_issues: 0,
      prs_opened: 0,
      prs_merged: 0,
    });
  });

  it("counts a merged PR toward both prs_opened and prs_merged", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/console", is_pr: true, merged_at: "2026-01-01T00:00:00Z", labels: [] },
    ]);
    expect(result.get("kubestellar/console")).toMatchObject({ prs_opened: 1, prs_merged: 1 });
  });

  it("counts an unmerged PR toward prs_opened only", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/console", is_pr: true, merged_at: null, labels: [] },
    ]);
    expect(result.get("kubestellar/console")).toMatchObject({ prs_opened: 1, prs_merged: 0 });
  });

  it("classifies a kind/bug issue as bug_issues, not feature or other", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/bug", "area/nav"] },
    ]);
    expect(result.get("kubestellar/docs")).toMatchObject({
      bug_issues: 1,
      feature_issues: 0,
      other_issues: 0,
    });
  });

  it("classifies a kind/feature issue as feature_issues when kind/bug is absent", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/feature"] },
    ]);
    expect(result.get("kubestellar/docs")).toMatchObject({
      bug_issues: 0,
      feature_issues: 1,
      other_issues: 0,
    });
  });

  it("prefers kind/bug over kind/feature when both are set (bug wins tiebreak)", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/feature", "kind/bug"] },
    ]);
    expect(result.get("kubestellar/docs")).toMatchObject({
      bug_issues: 1,
      feature_issues: 0,
      other_issues: 0,
    });
  });

  it("classifies an issue with neither kind/bug nor kind/feature as other_issues", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["area/nav", "priority/p2"] },
    ]);
    expect(result.get("kubestellar/docs")).toMatchObject({
      bug_issues: 0,
      feature_issues: 0,
      other_issues: 1,
    });
  });

  it("classifies an issue with an empty labels array as other_issues", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: [] },
    ]);
    expect(result.get("kubestellar/docs").other_issues).toBe(1);
  });

  it("does NOT count a PR against any issue-type bucket, even if it carries kind/bug", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/console", is_pr: true, merged_at: null, labels: ["kind/bug"] },
    ]);
    expect(result.get("kubestellar/console")).toMatchObject({
      prs_opened: 1,
      prs_merged: 0,
      bug_issues: 0,
      feature_issues: 0,
      other_issues: 0,
    });
  });

  it("aggregates multiple items per repo without resetting counters", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/bug"] },
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/bug"] },
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/feature"] },
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: [] },
      { repo: "kubestellar/docs", is_pr: true, merged_at: "2026-01-02T00:00:00Z", labels: [] },
      { repo: "kubestellar/docs", is_pr: true, merged_at: null, labels: [] },
    ]);
    expect(result.get("kubestellar/docs")).toEqual({
      repo: "kubestellar/docs",
      bug_issues: 2,
      feature_issues: 1,
      other_issues: 1,
      prs_opened: 2,
      prs_merged: 1,
    });
  });

  it("keeps per-repo aggregates independent when items span multiple repos", () => {
    const result = categorizeIssuesByRepo([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, labels: ["kind/bug"] },
      { repo: "kubestellar/console", is_pr: true, merged_at: "2026-01-01T00:00:00Z", labels: [] },
      { repo: "kubestellar/console", is_pr: false, merged_at: null, labels: ["kind/feature"] },
    ]);
    expect(result.size).toBe(2);
    expect(result.get("kubestellar/docs")).toMatchObject({ bug_issues: 1, prs_opened: 0 });
    expect(result.get("kubestellar/console")).toMatchObject({
      prs_opened: 1,
      prs_merged: 1,
      feature_issues: 1,
    });
  });

  it("treats merged_at as boolean-truthy: empty string and 0 are NOT merged", () => {
    // Guards the `if (item.merged_at)` check against a future rewrite that
    // switches to `!== null` and starts miscounting empty-string sentinels.
    const result = categorizeIssuesByRepo([
      { repo: "r", is_pr: true, merged_at: "", labels: [] },
      { repo: "r", is_pr: true, merged_at: 0, labels: [] },
    ]);
    expect(result.get("r")).toMatchObject({ prs_opened: 2, prs_merged: 0 });
  });
});

describe("sortRepoBreakdown", () => {
  it("returns an empty array for an empty map", () => {
    expect(sortRepoBreakdown(new Map())).toEqual([]);
  });

  it("sorts by descending total activity (prs_opened + bug + feature + other)", () => {
    const map = new Map([
      ["low", { repo: "low", bug_issues: 0, feature_issues: 1, other_issues: 0, prs_opened: 0, prs_merged: 0 }],
      ["high", { repo: "high", bug_issues: 5, feature_issues: 2, other_issues: 1, prs_opened: 3, prs_merged: 3 }],
      ["mid", { repo: "mid", bug_issues: 1, feature_issues: 1, other_issues: 1, prs_opened: 1, prs_merged: 0 }],
    ]);
    expect(sortRepoBreakdown(map).map((r) => r.repo)).toEqual(["high", "mid", "low"]);
  });

  it("does NOT double-count prs_merged in the sort key", () => {
    // Guards the sort expression against a future rewrite that adds
    // prs_merged to the total: two repos with equal (opened + issues) but
    // different merged counts must sort as equal.
    const map = new Map([
      ["a", { repo: "a", bug_issues: 0, feature_issues: 0, other_issues: 0, prs_opened: 2, prs_merged: 2 }],
      ["b", { repo: "b", bug_issues: 0, feature_issues: 0, other_issues: 0, prs_opened: 2, prs_merged: 0 }],
    ]);
    // Both totals are 2; V8 Array.sort with a 0-return comparator preserves
    // insertion order, so 'a' stays first.
    expect(sortRepoBreakdown(map).map((r) => r.repo)).toEqual(["a", "b"]);
  });

  it("returns the exact aggregate objects held in the map (no cloning)", () => {
    const rb = { repo: "r", bug_issues: 1, feature_issues: 0, other_issues: 0, prs_opened: 0, prs_merged: 0 };
    const map = new Map([["r", rb]]);
    expect(sortRepoBreakdown(map)[0]).toBe(rb);
  });
});
