// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/leaderboard/[username]/page.tsx (docs#7295).
 * Sub-components, PageShell, next/image and next/link are mocked so the
 * test exercises only the page's fetch/merge logic and conditional sections.
 */

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement("img", { src, alt }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));
vi.mock("../components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));
vi.mock("../app/[locale]/leaderboard/[username]/components/ContributionRadarChart", () => ({
  ContributionRadarChart: () => React.createElement("div", { "data-testid": "radar" }),
}));
vi.mock("../app/[locale]/leaderboard/[username]/components/HeatmapCell", () => ({
  HeatmapCell: ({ label }: { label: string }) =>
    React.createElement("span", { "data-testid": "heat" }, label),
}));
vi.mock("../app/[locale]/leaderboard/[username]/components/TopicBar", () => ({
  TopicBar: ({ topic }: { topic: { name: string } }) =>
    React.createElement("div", { "data-testid": "topic" }, topic.name),
}));
vi.mock("../app/[locale]/leaderboard/[username]/components/SuggestionCard", () => ({
  SuggestionCard: ({ suggestion }: { suggestion: { title: string } }) =>
    React.createElement("div", { "data-testid": "suggestion" }, suggestion.title),
}));
vi.mock("../app/[locale]/leaderboard/[username]/components/TimelineSparkline", () => ({
  TimelineSparkline: () => React.createElement("div", { "data-testid": "timeline" }),
}));

import ContributorProfilePage from "../app/[locale]/leaderboard/[username]/page";

// Already-fulfilled thenable so React's use() resolves synchronously.
function resolvedParams(username: string) {
  const value = { username };
  const p = Promise.resolve(value) as Promise<typeof value> & { status?: string; value?: typeof value };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    login: "Alice",
    generated_at: "2025-03-04T10:30:00Z",
    total_issues_opened: 12,
    avatar_url: "https://a/a.png",
    total_points: 1234,
    level: "Contributor",
    level_rank: 2,
    rank: 5,
    cadence: {
      avg_per_week: 2.5,
      avg_per_day: 0.4,
      by_day_of_week: [0, 0, 9, 1, 0, 0, 0],
      by_hour_of_day: Array.from({ length: 24 }, (_, i) => (i === 14 ? 8 : 0)),
      current_streak_weeks: 3,
      longest_streak_weeks: 6,
      trend: "steady",
      first_issue_at: null,
      last_issue_at: null,
    },
    topics: [
      { name: "networking", issue_count: 5, recent_issue: { title: "t", url: "u", created_at: "" }, repos: ["console", "docs"], open_count: 1, closed_count: 4 },
    ],
    suggestions: {
      deepen: [{ title: "Fix flaky test", url: "https://x/1", repo: "docs", topic_match: "testing" }],
      stretch: [{ name: "Cards", path: "web/src/cards", description: "Card UI", url: "https://x/cards" }],
    },
    activity_timeline: [],
    repo_breakdown: [
      { repo: "console", bug_issues: 1, feature_issues: 2, other_issues: 3, prs_opened: 4, prs_merged: 2 },
      { repo: "docs", bug_issues: 0, feature_issues: 0, other_issues: 0, prs_opened: 0, prs_merged: 0 },
    ],
    ...overrides,
  };
}

function mockFetch(opts: {
  profile?: unknown;
  profileStatus?: number;
  leaderboard?: unknown;
  leaderboardStatus?: number;
  leaderboardReject?: boolean;
}) {
  const fn = vi.fn((url: string) => {
    if (url.startsWith("/data/contributors/")) {
      const status = opts.profileStatus ?? 200;
      return Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve(opts.profile) });
    }
    if (opts.leaderboardReject) return Promise.reject(new Error("lb down"));
    const status = opts.leaderboardStatus ?? 200;
    return Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve(opts.leaderboard) });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ContributorProfilePage", () => {
  it("fetches the profile for the username and renders header, cadence and sections", async () => {
    const fn = mockFetch({ profile: makeProfile(), leaderboard: { generated_at: "", entries: [] } });
    render(<ContributorProfilePage params={resolvedParams("Alice")} />);
    expect(screen.getByText("Loading contributor profile...")).toBeTruthy();

    await screen.findByRole("heading", { name: "Alice" });
    expect(fn).toHaveBeenCalledWith("/data/contributors/Alice.json");
    expect(fn).toHaveBeenCalledWith("/data/leaderboard.json");
    expect(screen.getByText("#5")).toBeTruthy();
    expect(screen.getByText("1,234 pts")).toBeTruthy();
    expect(screen.getByText(/Averages 2.5 issues\/week/).textContent).toContain(
      "Most active on Wednesdays \u00B7 Peak hours: 14:00\u201317:00 UTC"
    );
    expect(screen.getByText(/Longest:/).textContent).toBeTruthy();
    expect(screen.getAllByTestId("heat").length).toBe(7);
    expect(screen.getByTestId("radar")).toBeTruthy();
    expect(screen.getByTestId("timeline")).toBeTruthy();
    expect(screen.getByTestId("topic").textContent).toBe("networking");
    expect(screen.getByTestId("suggestion").textContent).toBe("Fix flaky test");
    expect(screen.getByText("Cards")).toBeTruthy();
    expect(screen.getByText("Stretch Into New Areas")).toBeTruthy();
    expect(screen.getByText("CONSOLE")).toBeTruthy();
    expect(screen.getByText("50% merged")).toBeTruthy();
    expect(screen.getByText("No PR activity")).toBeTruthy();
    expect(screen.getByText(/12 issues opened across/).textContent).toContain("2 repos");
  });

  it("overrides points/rank/level with leaderboard.json values (case-insensitive match)", async () => {
    mockFetch({
      profile: makeProfile(),
      leaderboard: {
        generated_at: "",
        entries: [{ rank: 1, login: "alice", total_points: 9999, level: "Maintainer", level_rank: 1 }],
      },
    });
    render(<ContributorProfilePage params={resolvedParams("ALICE")} />);
    await screen.findByText("9,999 pts");
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("Maintainer")).toBeTruthy();
  });

  it("keeps profile values when leaderboard fetch fails", async () => {
    mockFetch({ profile: makeProfile(), leaderboardReject: true });
    render(<ContributorProfilePage params={resolvedParams("Alice")} />);
    await screen.findByText("1,234 pts");
    expect(console.error).toHaveBeenCalled();
  });

  it("keeps profile values when leaderboard returns non-OK", async () => {
    mockFetch({ profile: makeProfile(), leaderboardStatus: 500 });
    render(<ContributorProfilePage params={resolvedParams("Alice")} />);
    await screen.findByText("1,234 pts");
  });

  it("renders not-found state on 404", async () => {
    mockFetch({ profileStatus: 404 });
    render(<ContributorProfilePage params={resolvedParams("ghost")} />);
    expect(await screen.findByText("Contributor not found")).toBeTruthy();
    expect(screen.getByText("ghost")).toBeTruthy();
  });

  it("renders generic error state on other HTTP failures", async () => {
    mockFetch({ profileStatus: 503 });
    render(<ContributorProfilePage params={resolvedParams("Alice")} />);
    expect(await screen.findByText("Failed to load profile")).toBeTruthy();
    expect(screen.getByText("HTTP 503")).toBeTruthy();
  });

  it("renders fallbacks: initial avatar, empty topics, no suggestions or repo breakdown", async () => {
    mockFetch({
      profile: makeProfile({
        avatar_url: "",
        topics: [],
        suggestions: { deepen: [], stretch: [] },
        repo_breakdown: [],
      }),
      leaderboard: { generated_at: "", entries: [] },
    });
    render(<ContributorProfilePage params={resolvedParams("Alice")} />);
    await waitFor(() => expect(screen.getByText("Not enough issues for topic analysis")).toBeTruthy());
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("Requires at least 3 issues for clustering")).toBeTruthy();
    expect(screen.queryByText("Repository Contributions")).toBeNull();
    expect(screen.queryByText("Deepen Your Expertise")).toBeNull();
    expect(screen.queryByText("Stretch Into New Areas")).toBeNull();
    expect(screen.getByText(/12 issues opened across/).textContent).toContain("multiple repos");
  });
});
