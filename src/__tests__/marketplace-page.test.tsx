// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import MarketplacePage from "../app/[locale]/marketplace/page";

/**
 * Coverage for src/app/[locale]/marketplace/page.tsx (kubestellar/docs#7296).
 * PageShell and MarketplaceCard are mocked; fetch is stubbed.
 */

vi.mock("@/components/master-page/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "page-shell" }, children),
}));

vi.mock("../app/[locale]/marketplace/components/MarketplaceCard", () => ({
  MarketplaceCard: ({ item }: { item: { id: string; name: string } }) =>
    React.createElement("div", { "data-testid": "card" }, item.name),
}));

function makeItem(over: Record<string, unknown> = {}) {
  return {
    id: "a",
    name: "Alpha Board",
    description: "Cluster overview",
    author: "x",
    version: "1.0.0",
    downloadUrl: "https://example.test/a.json",
    tags: ["ops", "gpu"],
    cardCount: 1,
    type: "dashboard",
    ...over,
  };
}

const REGISTRY = {
  version: "9.9",
  updatedAt: "2026-01-01",
  items: [
    makeItem(),
    makeItem({ id: "b", name: "Dark Theme", description: "Night mode", tags: ["ui"], type: "theme" }),
  ],
  presets: [
    makeItem({ id: "c", name: "Pods Preset", description: "Pod cards", tags: ["ops"], type: "card-preset" }),
  ],
};

function okResponse(body: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

describe("MarketplacePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => okResponse(REGISTRY)));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows loading state before fetch resolves", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<MarketplacePage />);
    expect(screen.getByText("Loading marketplace...")).toBeTruthy();
  });

  it("merges items and presets and renders cards with counts", async () => {
    render(<MarketplacePage />);
    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(3));
    expect(screen.getByText(/3 items available/)).toBeTruthy();
    expect(screen.getByText(/Registry v9.9/)).toBeTruthy();
    expect(screen.getByText("Showing 3 of 3 items")).toBeTruthy();
    expect(screen.getByText("(3)")).toBeTruthy();
  });

  it("tolerates registry without items/presets arrays", async () => {
    vi.stubGlobal("fetch", vi.fn(() => okResponse({ version: "1", updatedAt: "" })));
    render(<MarketplacePage />);
    await waitFor(() => expect(screen.getByText("No items match your filters.")).toBeTruthy());
  });

  it("filters by search over name, description and tags", async () => {
    render(<MarketplacePage />);
    await waitFor(() => screen.getAllByTestId("card"));
    const input = screen.getByPlaceholderText("Search dashboards, presets, themes...");
    fireEvent.change(input, { target: { value: "night" } });
    expect(screen.getAllByTestId("card")).toHaveLength(1);
    expect(screen.getByText(/matching "night"/)).toBeTruthy();
    fireEvent.change(input, { target: { value: "GPU" } });
    expect(screen.getByText("Alpha Board")).toBeTruthy();
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No items match your filters.")).toBeTruthy();
  });

  it("filters by type", async () => {
    render(<MarketplacePage />);
    await waitFor(() => screen.getAllByTestId("card"));
    fireEvent.click(screen.getByText("Themes"));
    expect(screen.getAllByTestId("card")).toHaveLength(1);
    expect(screen.getByText("Dark Theme")).toBeTruthy();
    fireEvent.click(screen.getByText("All"));
    expect(screen.getAllByTestId("card")).toHaveLength(3);
  });

  it("filters by tag via dropdown, then resets with All Tags", async () => {
    render(<MarketplacePage />);
    await waitFor(() => screen.getAllByTestId("card"));
    fireEvent.click(screen.getByText("Tag"));
    expect(screen.getByText("All Tags")).toBeTruthy();
    fireEvent.click(screen.getByText("ops"));
    expect(screen.getAllByTestId("card")).toHaveLength(2);
    expect(screen.queryByText("All Tags")).toBeNull();

    fireEvent.click(screen.getByText("ops"));
    fireEvent.click(screen.getByText("All Tags"));
    expect(screen.getAllByTestId("card")).toHaveLength(3);
  });

  it("closes tag dropdown on outside mousedown", async () => {
    render(<MarketplacePage />);
    await waitFor(() => screen.getAllByTestId("card"));
    fireEvent.click(screen.getByText("Tag"));
    expect(screen.getByText("All Tags")).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("All Tags")).toBeNull();
  });

  it("shows error on non-ok response and retries successfully", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockImplementation(() => okResponse(REGISTRY));
    vi.stubGlobal("fetch", fetchMock);
    render(<MarketplacePage />);
    await waitFor(() => expect(screen.getByText("Failed to load marketplace")).toBeTruthy());
    expect(screen.getByText("Failed to fetch marketplace data")).toBeTruthy();
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(3));
    expect(screen.queryByText("Failed to load marketplace")).toBeNull();
  });

  it("shows error again when retry fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("boom"))));
    render(<MarketplacePage />);
    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());
  });

  it("shows timeout message on AbortError", async () => {
    const err = Object.assign(new Error("aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(err)));
    render(<MarketplacePage />);
    await waitFor(() =>
      expect(screen.getByText(/Request timed out/)).toBeTruthy(),
    );
  });

  it("aborts the request after the fetch timeout", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: { signal: AbortSignal }) => {
        signal = init.signal;
        return new Promise(() => {});
      }),
    );
    render(<MarketplacePage />);
    expect(signal?.aborted).toBe(false);
    vi.advanceTimersByTime(10000);
    expect(signal?.aborted).toBe(true);
  });

  it("renders contribute links to the GitHub registry", async () => {
    render(<MarketplacePage />);
    expect(screen.getByText("View on GitHub").closest("a")?.getAttribute("href")).toBe(
      "https://github.com/kubestellar/console-marketplace",
    );
  });
});
