/**
 * Unit tests for scripts/lib/contributor-metrics.mjs — the engagement
 * cadence, activity timeline, and "deepen"/"stretch" suggestion helpers
 * extracted from scripts/generate-contributor-profiles.mjs so they can be
 * unit-tested without the GitHub API calls and TF-IDF clustering pipeline
 * in the runner.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, it, expect } from "vitest";
import {
  computeCadence,
  computeTimeline,
  findDeepenSuggestions,
  findStretchAreas,
  buildRepoBreakdown,
  CONSOLE_CODEBASE_AREAS,
} from "./contributor-metrics.mjs";

describe("computeCadence", () => {
  it("returns the inactive baseline for an empty date list", () => {
    const cadence = computeCadence([]);
    expect(cadence.trend).toBe("inactive");
    expect(cadence.avg_per_week).toBe(0);
    expect(cadence.avg_per_day).toBe(0);
    expect(cadence.by_day_of_week).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(cadence.by_hour_of_day).toHaveLength(24);
    expect(cadence.first_issue_at).toBeNull();
    expect(cadence.last_issue_at).toBeNull();
  });

  it("records first/last issue timestamps from unsorted input", () => {
    const cadence = computeCadence([
      "2026-03-10T12:00:00Z",
      "2026-01-01T00:00:00Z",
      "2026-02-15T06:00:00Z",
    ]);
    expect(cadence.first_issue_at).toBe("2026-01-01T00:00:00.000Z");
    expect(cadence.last_issue_at).toBe("2026-03-10T12:00:00.000Z");
  });

  it("buckets a single issue's day-of-week and hour-of-day (ISO weekday)", () => {
    // 2026-03-16 is a Monday
    const cadence = computeCadence(["2026-03-16T09:00:00Z"]);
    expect(cadence.by_day_of_week[0]).toBe(1);
    expect(cadence.by_day_of_week.slice(1)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(cadence.by_hour_of_day[9]).toBe(1);
  });

  it("marks a contributor with no recent activity as inactive", () => {
    const cadence = computeCadence(["2020-01-01T00:00:00Z"]);
    expect(cadence.trend).toBe("inactive");
  });
});

describe("computeTimeline", () => {
  it("returns 12 months ending with the current month", () => {
    const timeline = computeTimeline([]);
    expect(timeline).toHaveLength(12);
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(timeline[timeline.length - 1].month).toBe(currentKey);
    expect(timeline.every((m) => m.issue_count === 0)).toBe(true);
  });

  it("counts issues falling within the tracked window into their month", () => {
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const timeline = computeTimeline([now.toISOString(), now.toISOString()]);
    const thisMonth = timeline.find((m) => m.month === thisMonthKey);
    expect(thisMonth.issue_count).toBe(2);
  });

  it("ignores dates outside the tracked 12-month window", () => {
    const timeline = computeTimeline(["2000-01-01T00:00:00Z"]);
    expect(timeline.every((m) => m.issue_count === 0)).toBe(true);
  });
});

describe("findDeepenSuggestions", () => {
  const centroids = [new Map([["gpu", 1]]), new Map([["network", 1]])];
  const names = ["GPU topic", "Network topic"];

  it("excludes issues opened by the contributor themself", () => {
    const suggestions = findDeepenSuggestions(
      centroids,
      names,
      [{ login: "alice", vector: new Map([["gpu", 1]]), title: "x", url: "u", repo: "r" }],
      "alice"
    );
    expect(suggestions).toEqual([]);
  });

  it("excludes issues below the similarity threshold", () => {
    const suggestions = findDeepenSuggestions(
      centroids,
      names,
      [{ login: "bob", vector: new Map([["unrelated", 1]]), title: "x", url: "u", repo: "r" }],
      "alice"
    );
    expect(suggestions).toEqual([]);
  });

  it("matches an issue to its most similar topic cluster", () => {
    const suggestions = findDeepenSuggestions(
      centroids,
      names,
      [{ login: "bob", vector: new Map([["gpu", 1]]), title: "GPU fix", url: "u1", repo: "r" }],
      "alice"
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toEqual({ title: "GPU fix", url: "u1", repo: "r", topic_match: "GPU topic" });
    // similarity is stripped from the output
    expect(suggestions[0].similarity).toBeUndefined();
  });

  it("caps results at SUGGESTION_COUNT (5), sorted by similarity descending", () => {
    const openIssues = Array.from({ length: 8 }, (_, i) => ({
      login: "bob",
      vector: new Map([["gpu", 1]]),
      title: `issue-${i}`,
      url: `u${i}`,
      repo: "r",
    }));
    const suggestions = findDeepenSuggestions(centroids, names, openIssues, "alice");
    expect(suggestions).toHaveLength(5);
  });
});

describe("findStretchAreas", () => {
  it("returns all codebase areas as uncovered when there are no clusters", () => {
    const areaVectors = CONSOLE_CODEBASE_AREAS.map(() => new Map());
    const stretch = findStretchAreas([], areaVectors);
    expect(stretch.length).toBeGreaterThan(0);
    expect(stretch.length).toBeLessThanOrEqual(5);
    expect(stretch[0]).toHaveProperty("name");
    expect(stretch[0]).toHaveProperty("path");
    expect(stretch[0]).not.toHaveProperty("similarity");
  });

  it("excludes an area whose vector strongly overlaps a contributor cluster", () => {
    // Give every area a zero vector except the first, and give the
    // contributor a cluster identical to the first area's vector.
    const areaVectors = CONSOLE_CODEBASE_AREAS.map((_, i) =>
      i === 0 ? new Map([["dashboard", 1], ["card", 1]]) : new Map()
    );
    const clusterCentroids = [new Map([["dashboard", 1], ["card", 1]])];
    const stretch = findStretchAreas(clusterCentroids, areaVectors);
    expect(stretch.find((a) => a.name === CONSOLE_CODEBASE_AREAS[0].name)).toBeUndefined();
  });
});

describe("buildRepoBreakdown", () => {
  it("returns an empty array for an empty list", () => {
    expect(buildRepoBreakdown([])).toEqual([]);
  });

  it("classifies an issue_type of 'bug' as bug_issues", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "bug" },
    ]);
    expect(result).toEqual([
      { repo: "kubestellar/docs", bug_issues: 1, feature_issues: 0, other_issues: 0, prs_opened: 0, prs_merged: 0 },
    ]);
  });

  it("classifies an issue_type of 'feature' as feature_issues", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "feature" },
    ]);
    expect(result[0]).toMatchObject({ bug_issues: 0, feature_issues: 1, other_issues: 0 });
  });

  it("classifies an issue_type of 'other' (and any unrecognized value) as other_issues", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "other" },
    ]);
    expect(result[0]).toMatchObject({ bug_issues: 0, feature_issues: 0, other_issues: 1 });
  });

  it("does NOT classify a PR against any issue-type bucket even if issue_type is set", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/console", is_pr: true, merged_at: null, issue_type: "bug" },
    ]);
    expect(result[0]).toMatchObject({
      prs_opened: 1,
      prs_merged: 0,
      bug_issues: 0,
      feature_issues: 0,
      other_issues: 0,
    });
  });

  it("counts a merged PR toward both prs_opened and prs_merged", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/console", is_pr: true, merged_at: "2026-01-01T00:00:00Z", issue_type: null },
    ]);
    expect(result[0]).toMatchObject({ prs_opened: 1, prs_merged: 1 });
  });

  it("aggregates multiple items per repo without resetting counters", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "bug" },
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "bug" },
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "feature" },
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "other" },
      { repo: "kubestellar/docs", is_pr: true, merged_at: "2026-01-02T00:00:00Z", issue_type: null },
      { repo: "kubestellar/docs", is_pr: true, merged_at: null, issue_type: null },
    ]);
    expect(result).toEqual([
      {
        repo: "kubestellar/docs",
        bug_issues: 2,
        feature_issues: 1,
        other_issues: 1,
        prs_opened: 2,
        prs_merged: 1,
      },
    ]);
  });

  it("sorts repos by descending total activity (prs_opened + bug + feature + other)", () => {
    const result = buildRepoBreakdown([
      { repo: "low", is_pr: false, merged_at: null, issue_type: "feature" },
      { repo: "high", is_pr: true, merged_at: "2026-01-01T00:00:00Z", issue_type: null },
      { repo: "high", is_pr: false, merged_at: null, issue_type: "bug" },
      { repo: "mid", is_pr: false, merged_at: null, issue_type: "other" },
      { repo: "mid", is_pr: true, merged_at: null, issue_type: null },
    ]);
    expect(result.map((r) => r.repo)).toEqual(["high", "mid", "low"]);
  });

  it("does NOT double-count prs_merged in the sort key", () => {
    // Two repos with equal (opened + issues) but different merged counts
    // must sort as equal, preserving insertion order.
    const result = buildRepoBreakdown([
      { repo: "a", is_pr: true, merged_at: "2026-01-01T00:00:00Z", issue_type: null },
      { repo: "a", is_pr: true, merged_at: "2026-01-02T00:00:00Z", issue_type: null },
      { repo: "b", is_pr: true, merged_at: "2026-01-01T00:00:00Z", issue_type: null },
      { repo: "b", is_pr: true, merged_at: null, issue_type: null },
    ]);
    expect(result.map((r) => r.repo)).toEqual(["a", "b"]);
  });

  it("keeps per-repo aggregates independent when items span multiple repos", () => {
    const result = buildRepoBreakdown([
      { repo: "kubestellar/docs", is_pr: false, merged_at: null, issue_type: "bug" },
      { repo: "kubestellar/console", is_pr: true, merged_at: "2026-01-01T00:00:00Z", issue_type: null },
      { repo: "kubestellar/console", is_pr: false, merged_at: null, issue_type: "feature" },
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.repo === "kubestellar/docs")).toMatchObject({ bug_issues: 1, prs_opened: 0 });
    expect(result.find((r) => r.repo === "kubestellar/console")).toMatchObject({
      prs_opened: 1,
      prs_merged: 1,
      feature_issues: 1,
    });
  });

  it("treats merged_at as boolean-truthy: empty string and 0 are NOT merged", () => {
    const result = buildRepoBreakdown([
      { repo: "r", is_pr: true, merged_at: "", issue_type: null },
      { repo: "r", is_pr: true, merged_at: 0, issue_type: null },
    ]);
    expect(result[0]).toMatchObject({ prs_opened: 2, prs_merged: 0 });
  });
});
