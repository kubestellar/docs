/**
 * Unit tests for scripts/lib/github-fetch.mjs — the pure label-classification
 * and header-building helpers extracted from
 * scripts/generate-contributor-profiles.mjs. `ghFetch` itself wraps the
 * global `fetch` and is exercised indirectly by the runner; these tests
 * focus on the deterministic, network-free pieces.
 */
import { describe, it, expect } from "vitest";
import {
  classifyIssueLabels,
  buildDefaultHeaders,
  API_BASE,
  REST_PER_PAGE,
  REST_MAX_PAGES,
  REST_PAGE_DELAY_MS,
} from "./github-fetch.mjs";

describe("classifyIssueLabels", () => {
  it("classifies bug labels as bug", () => {
    expect(classifyIssueLabels([{ name: "bug" }])).toBe("bug");
    expect(classifyIssueLabels([{ name: "kind/bug" }])).toBe("bug");
    expect(classifyIssueLabels([{ name: "type/bug" }])).toBe("bug");
  });

  it("classifies feature labels as feature", () => {
    expect(classifyIssueLabels([{ name: "enhancement" }])).toBe("feature");
    expect(classifyIssueLabels([{ name: "kind/feature" }])).toBe("feature");
    expect(classifyIssueLabels([{ name: "type/feature" }])).toBe("feature");
  });

  it("classifies unrecognized or missing labels as other", () => {
    expect(classifyIssueLabels([])).toBe("other");
    expect(classifyIssueLabels([{ name: "documentation" }])).toBe("other");
  });

  it("returns the classification of the first matching label in list order", () => {
    expect(
      classifyIssueLabels([{ name: "enhancement" }, { name: "bug" }])
    ).toBe("feature");
    expect(
      classifyIssueLabels([{ name: "bug" }, { name: "enhancement" }])
    ).toBe("bug");
  });
});

describe("buildDefaultHeaders", () => {
  it("builds the expected GitHub REST API headers for a token", () => {
    expect(buildDefaultHeaders("abc123")).toEqual({
      Accept: "application/vnd.github+json",
      Authorization: "Bearer abc123",
      "X-GitHub-Api-Version": "2022-11-28",
    });
  });
});

describe("REST constants", () => {
  it("exposes the expected pagination defaults", () => {
    expect(API_BASE).toBe("https://api.github.com");
    expect(REST_PER_PAGE).toBe(100);
    expect(REST_MAX_PAGES).toBe(100);
    expect(REST_PAGE_DELAY_MS).toBe(100);
  });
});
