// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/leaderboard/page.tsx (docs#7294).
 * Child components, PageShell, next/image and next/link are mocked so the
 * test exercises only the page's own fetch, filter, sort and render logic.
 */

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement("img", { src, alt }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));
vi.mock("../components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));
vi.mock("../components/index", () => ({
  ContributionCallToAction: () => React.createElement("div", { "data-testid": "cta" }),
}));

vi.mock("../app/[locale]/leaderboard/components", () => ({
  ActivitySparkline: () => React.createElement("span", { "data-testid": "spark" }),
  BreakdownPills: () => React.createElement("span", { "data-testid": "pills" }),
  LevelBadge: ({ level }: { level: string }) =>
    React.createElement("span", { "data-testid": "level" }, level),
  RankDisplay: ({ rank }: { rank: number }) =>
    React.createElement("span", { "data-testid": "rank" }, `#${rank}`),
  SocialBadge: ({ data, loading }: { data?: { clicks: number }; loading: boolean }) =>
    React.createElement(
      "span",
      { "data-testid": "social" },
      loading ? "loading" : data ? `clicks:${data.clicks}` : "none"
    ),
}));

vi.mock("../app/[locale]/leaderboard/ContributorHoverCard", () => ({
  HOVER_FETCH_DELAY_MS: 0,
  ContributorHoverCard: ({ login }: { login: string }) =>
    React.createElement("div", { "data-testid": "hover-card" }, login),
}));

import LeaderboardPage from "../app/[locale]/leaderboard/page";

const breakdown = {
  bug_issues: 0,
  feature_issues: 0,
  other_issues: 0,
  prs_opened: 0,
  prs_merged: 0,
};

const leaderboard = {
  generated_at: "2025-03-04T10:30:00Z",
  git_hash: "abc1234",
  entries: [
    { rank: 2, login: "Bob", avatar_url: "https://a/b.png", total_points: 100, level: "Contributor", level_rank: 1, breakdown, recent_activity_score: 50 },
    { rank: 1, login: "Alice", avatar_url: "https://a/a.png", total_points: 900, level: "Maintainer", level_rank: 1, breakdown, recent_activity_score: 5 },
    { rank: 3, login: "Carol", avatar_url: "https://a/c.png", total_points: 500, level: "Observer", level_rank: 1, breakdown },
  ],
};

function mockFetch(opts: {
  lb?: unknown;
  lbStatus?: number;
  lbReject?: boolean;
  affiliate?: unknown;
  affiliateReject?: boolean;
}) {
  const fn = vi.fn((url: string) => {
    if (url === "/data/leaderboard.json") {
      if (opts.lbReject) return Promise.reject(new Error("network down"));
      const status = opts.lbStatus ?? 200;
      return Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve(opts.lb) });
    }
    if (opts.affiliateReject) return Promise.reject(new Error("timeout"));
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(opts.affiliate ?? {}) });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function loginOrder() {
  // Each row renders RankDisplay twice (desktop grid cell + mobile inline),
  // so collapse the per-row duplicate before comparing order.
  return screen
    .getAllByTestId("rank")
    .map((el) => el.textContent)
    .filter((_, i) => i % 2 === 0);
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LeaderboardPage", () => {
  it("shows loading state then rows sorted by points desc with metadata", async () => {
    mockFetch({ lb: leaderboard });
    render(<LeaderboardPage />);
    expect(screen.getByText("Loading leaderboard...")).toBeTruthy();

    await screen.findByText("Alice");
    expect(loginOrder()).toEqual(["#1", "#3", "#2"]);
    expect(screen.getByText("abc1234")).toBeTruthy();
    expect(screen.getByText(/Generated:/)).toBeTruthy();
    expect(screen.getByText("Point Values")).toBeTruthy();
    expect(screen.getByTestId("cta")).toBeTruthy();
  });

  it("shows the error message when leaderboard fetch returns non-OK", async () => {
    mockFetch({ lbStatus: 500 });
    render(<LeaderboardPage />);
    expect(await screen.findByText("Failed to load leaderboard")).toBeTruthy();
    expect(screen.getByText("HTTP 500")).toBeTruthy();
  });

  it("shows the error message when leaderboard fetch rejects", async () => {
    mockFetch({ lbReject: true });
    render(<LeaderboardPage />);
    expect(await screen.findByText("network down")).toBeTruthy();
  });

  it("shows empty state when there are no entries", async () => {
    mockFetch({ lb: { generated_at: "", entries: [] } });
    render(<LeaderboardPage />);
    expect(await screen.findByText("No contributor data available yet")).toBeTruthy();
  });

  it("filters case-insensitively and shows no-match state", async () => {
    mockFetch({ lb: leaderboard });
    render(<LeaderboardPage />);
    await screen.findByText("Alice");
    const input = screen.getByPlaceholderText("Search by GitHub username...");

    fireEvent.change(input, { target: { value: "  bO " } });
    expect(screen.queryByText("Alice")).toBeNull();

    fireEvent.change(input, { target: { value: "bo" } });
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.queryByText("Alice")).toBeNull();

    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No contributors match your search")).toBeTruthy();
  });

  it("toggles points sort direction and switches to activity sort", async () => {
    mockFetch({ lb: leaderboard });
    render(<LeaderboardPage />);
    await screen.findByText("Alice");

    fireEvent.click(screen.getByRole("button", { name: /Points/ }));
    expect(loginOrder()).toEqual(["#2", "#3", "#1"]);

    fireEvent.click(screen.getByRole("button", { name: /Activity/ }));
    // activity desc: Bob(50), Alice(5), Carol(0 fallback)
    expect(loginOrder()).toEqual(["#2", "#1", "#3"]);

    fireEvent.click(screen.getByRole("button", { name: /Activity/ }));
    expect(loginOrder()).toEqual(["#3", "#1", "#2"]);
  });

  it("normalizes affiliate keys to lowercase for per-row lookup", async () => {
    mockFetch({ lb: leaderboard, affiliate: { ALICE: { clicks: 7, unique_users: 3, utm_term: "x" } } });
    render(<LeaderboardPage />);
    await screen.findByText("Alice");
    await waitFor(() => expect(screen.getByText("clicks:7")).toBeTruthy());
    expect(screen.getAllByText("none").length).toBe(2);
  });

  it("retries the affiliate fetch once after failure, then gives up", async () => {
    vi.useFakeTimers();
    const fn = mockFetch({ lb: leaderboard, affiliateReject: true });
    render(<LeaderboardPage />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const affiliateCalls = () => fn.mock.calls.filter(([u]) => u !== "/data/leaderboard.json").length;
    expect(affiliateCalls()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(affiliateCalls()).toBe(2);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to fetch affiliate data after retry:",
      expect.any(Error)
    );
    expect(screen.queryAllByText("loading").length).toBe(0);
  });

  it("toggles the affiliate banner", async () => {
    mockFetch({ lb: leaderboard });
    render(<LeaderboardPage />);
    await screen.findByText("Alice");
    const toggle = screen.getByRole("button", { name: /Earn Social Clicks/ });
    const before = document.body.innerHTML;
    fireEvent.click(toggle);
    expect(document.body.innerHTML).not.toBe(before);
    fireEvent.click(toggle);
    expect(document.body.innerHTML).toBe(before);
  });
});
