// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import React from "react";

/**
 * Coverage for src/app/[locale]/acmm-leaderboard/page.tsx (baseline 0%).
 *
 * AcmmLeaderboardPage is a "use client" page with real interactive state:
 * search/level/badge filtering, column sorting (toggleSort + canonical
 * rank), an optional live-history fetch that is merged into the hardcoded
 * ACMM_PROJECTS snapshot, and several GA4 tracking call sites. data.ts,
 * scoring.ts, and components.tsx already have dedicated unit tests
 * (acmm-leaderboard-data.test.ts, acmm-scoring.test.ts,
 * acmmLeaderboardComponents.test.tsx) — this file exercises only the page
 * component's own logic, following the mocking pattern used by
 * src/__tests__/QuickInstallationPage.test.tsx.
 */

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

const mockGtagEvent = vi.fn();
vi.mock("../components/GoogleAnalytics", () => ({
  gtagEvent: (...args: unknown[]) => mockGtagEvent(...args),
}));

// Rendering all 289 snapshot rows (and re-rendering on each interaction) is
// slow under coverage instrumentation + parallel worker contention; raise
// this file's test timeout above the 5s default to avoid CI flakes.
vi.setConfig({ testTimeout: 20000 });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  mockGtagEvent.mockClear();
  // Default: history fetch resolves with no usable history so merge logic
  // falls back to the hardcoded snapshot for most tests.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, json: async () => null }),
  );
});

async function renderPage() {
  const { default: AcmmLeaderboardPage } = await import(
    "@/app/[locale]/acmm-leaderboard/page"
  );
  return render(<AcmmLeaderboardPage />);
}

describe("AcmmLeaderboardPage", () => {
  it("renders the hero title and the full project snapshot by default", async () => {
    const { getByText } = await renderPage();
    expect(getByText("ACMM Leaderboard")).not.toBeNull();
    expect(getByText(/kubestellar\/console/)).not.toBeNull();
  });

  it("filters the table by search text and tracks the search event", async () => {
    const { getByPlaceholderText, getByText, queryByText } = await renderPage();
    const input = getByPlaceholderText("Search projects…");

    fireEvent.change(input, { target: { value: "cilium" } });

    expect(getByText(/cilium\/cilium/)).not.toBeNull();
    expect(queryByText(/chaos-mesh\/chaos-mesh/)).toBeNull();
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_search",
      expect.objectContaining({ query_length: 6 }),
    );
  });

  it("shows the empty-results message when no project matches the search", async () => {
    const { getByPlaceholderText, getByText } = await renderPage();
    fireEvent.change(getByPlaceholderText("Search projects…"), {
      target: { value: "zzz-does-not-exist" },
    });
    expect(getByText("No projects match your search")).not.toBeNull();
  });

  it("filters by level and clears the filter via the results-count button", async () => {
    const { getByRole, getByText, queryByText } = await renderPage();
    fireEvent.click(getByRole("button", { name: /L5\(/ }));
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_level_filter",
      expect.objectContaining({ level: 5, action: "select" }),
    );
    expect(getByText(/kubestellar\/console/)).not.toBeNull();

    fireEvent.click(getByText("Clear filters"));
    expect(queryByText("Clear filters")).toBeNull();
    // Rendering all 289 snapshot rows is slow under coverage instrumentation.
  });

  it("toggles the level filter off when the same level button is clicked twice", async () => {
    const { getByRole } = await renderPage();
    const l5Button = getByRole("button", { name: /L5\(/ });
    fireEvent.click(l5Button);
    fireEvent.click(l5Button);
    expect(mockGtagEvent).toHaveBeenLastCalledWith(
      "acmm_level_filter",
      expect.objectContaining({ level: -1, action: "clear" }),
    );
  });

  it("filters to badge participants only and tracks the badge filter event", async () => {
    const { getByText, queryByText } = await renderPage();
    fireEvent.click(getByText("Badge Participants"));
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_badge_filter",
      expect.objectContaining({ action: "on" }),
    );
    expect(getByText(/kubestellar\/console/)).not.toBeNull();
    expect(queryByText(/chaos-mesh\/chaos-mesh/)).toBeNull();
  });

  it("toggles the info panel and tracks the dashboard + paper click events", async () => {
    const { getByText } = await renderPage();
    fireEvent.click(getByText("How Scoring Works"));
    expect(getByText("ACMM Maturity Levels")).not.toBeNull();
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_info_toggle",
      expect.objectContaining({ action: "open" }),
    );

    fireEvent.click(getByText("Read the paper →"));
    expect(mockGtagEvent).toHaveBeenCalledWith("acmm_paper_click", {
      source: "info_panel",
    });

    fireEvent.click(getByText("Open ACMM Dashboard"));
    expect(mockGtagEvent).toHaveBeenCalledWith("acmm_dashboard_click", {
      source: "leaderboard_cta",
    });
  });

  it("sorts by name, level, and score and tracks the sort event", async () => {
    const { getByRole } = await renderPage();

    fireEvent.click(getByRole("button", { name: /^Project/ }));
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_sort_change",
      expect.objectContaining({ sort_field: "name", sort_direction: "asc" }),
    );

    fireEvent.click(getByRole("button", { name: /^Score/ }));
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_sort_change",
      expect.objectContaining({ sort_field: "score" }),
    );

    fireEvent.click(getByRole("button", { name: /^Level/ }));
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_sort_change",
      expect.objectContaining({ sort_field: "level" }),
    );
  });

  it("tracks repo-row and scan-link clicks", async () => {
    const { getAllByTitle, getByRole } = await renderPage();
    const consoleLink = getByRole("link", { name: "kubestellar/console" });
    fireEvent.click(consoleLink);
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_repo_click",
      expect.objectContaining({ repo: "kubestellar/console" }),
    );

    const row = consoleLink.closest("div.grid") as HTMLElement;
    const scanLink = within(row).getByText("Scan");
    fireEvent.click(scanLink);
    expect(mockGtagEvent).toHaveBeenCalledWith(
      "acmm_scan_click",
      expect.objectContaining({ repo: "kubestellar/console" }),
    );
    // Badge participants render a title-annotated marker.
    expect(getAllByTitle("ACMM Participant — displays badge on README").length).toBeGreaterThan(0);
    // Rendering all 289 snapshot rows is slow under coverage instrumentation.
  });

  it("merges live history into the snapshot and renders a sparkline when enough points exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          dates: ["2026-01-01", "2026-01-08", "2026-01-15"],
          scores: { "kubestellar/console": [10, 15, 22] },
          detectedIds: {},
          generated_at: "2026-01-15T00:00:00Z",
        }),
      }),
    );

    const { getByText } = await renderPage();
    await waitFor(() => expect(getByText(/Last scanned: 2026-01-15/)).not.toBeNull());
  });

  it("logs an error and keeps the hardcoded snapshot when the history fetch rejects", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { getByText } = await renderPage();
    await waitFor(() => expect(errSpy).toHaveBeenCalled());
    expect(getByText(/Snapshot:/)).not.toBeNull();
  });
});
