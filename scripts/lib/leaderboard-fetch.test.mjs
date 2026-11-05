/**
 * Unit tests for scripts/lib/leaderboard-fetch.mjs — the date-chunked
 * pagination wrapper used by scripts/generate-leaderboard.mjs. `ghFetch`
 * and `delay` are mocked so these tests stay network-free and deterministic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./github-fetch.mjs", () => ({
  API_BASE: "https://api.github.com",
  REST_PER_PAGE: 100,
  REST_PAGE_DELAY_MS: 100,
  ghFetch: vi.fn(),
  delay: vi.fn(() => Promise.resolve()),
}));

import { ghFetch, delay } from "./github-fetch.mjs";
import { fetchPagedItems, fetchItemsSince } from "./leaderboard-fetch.mjs";

describe("fetchPagedItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops after a short page and concatenates all items", async () => {
    ghFetch
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => ({ id: i, created_at: "2026-01-01" }))
      )
      .mockResolvedValueOnce([{ id: "last", created_at: "2026-01-02" }]);

    const items = await fetchPagedItems("o/r", "2026-01-01", null, {});

    expect(items).toHaveLength(101);
    expect(items.at(-1)).toEqual({ id: "last", created_at: "2026-01-02" });
    expect(ghFetch).toHaveBeenCalledTimes(2);
  });

  it("stops immediately on an empty first page", async () => {
    ghFetch.mockResolvedValueOnce([]);

    const items = await fetchPagedItems("o/r", "2026-01-01", null, {});

    expect(items).toEqual([]);
    expect(ghFetch).toHaveBeenCalledTimes(1);
  });

  it("filters out items created on/after untilDate", async () => {
    ghFetch.mockResolvedValueOnce([
      { id: 1, created_at: "2026-01-05" },
      { id: 2, created_at: "2026-01-10" },
      { id: 3, created_at: "2026-01-15" },
    ]);

    const items = await fetchPagedItems("o/r", "2026-01-01", "2026-01-10", {});

    expect(items).toEqual([{ id: 1, created_at: "2026-01-05" }]);
  });

  it("stops and returns items collected so far when a page hits the 422 pagination limit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    ghFetch
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => ({ id: i, created_at: "2026-01-01" }))
      )
      .mockRejectedValueOnce(new Error("GitHub API 422: too many pages"));

    const items = await fetchPagedItems("o/r", "2026-01-01", null, {});

    expect(items).toHaveLength(100);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("pagination limit"));
    warn.mockRestore();
  });

  it("rethrows non-422 errors", async () => {
    ghFetch.mockRejectedValueOnce(new Error("GitHub API 500: boom"));

    await expect(fetchPagedItems("o/r", "2026-01-01", null, {})).rejects.toThrow(
      "GitHub API 500"
    );
  });

  it("delays between pages but not before the first request", async () => {
    ghFetch
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => ({ id: i, created_at: "2026-01-01" }))
      )
      .mockResolvedValueOnce([{ id: "last", created_at: "2026-01-02" }]);

    await fetchPagedItems("o/r", "2026-01-01", null, {});

    expect(delay).toHaveBeenCalledTimes(1);
  });
});

describe("fetchItemsSince", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T00:00:00Z"));
  });

  it("fetches a single page directly when the range is within CHUNK_DAYS", async () => {
    ghFetch.mockResolvedValueOnce([{ id: 1, created_at: "2026-01-25" }]);

    const items = await fetchItemsSince("o/r", "2026-01-20T00:00:00Z", {});

    expect(items).toEqual([{ id: 1, created_at: "2026-01-25" }]);
    expect(ghFetch).toHaveBeenCalledTimes(1);
  });

  it("splits a range longer than CHUNK_DAYS into sequential chunks", async () => {
    // 60-day range from 2025-12-03 to 2026-02-01 -> 2 chunks of 30 days.
    ghFetch
      .mockResolvedValueOnce([{ id: "chunk1", created_at: "2025-12-10" }])
      .mockResolvedValueOnce([{ id: "chunk2", created_at: "2026-01-10" }]);

    const items = await fetchItemsSince("o/r", "2025-12-03T00:00:00Z", {});

    expect(items).toEqual([
      { id: "chunk1", created_at: "2025-12-10" },
      { id: "chunk2", created_at: "2026-01-10" },
    ]);
    expect(ghFetch).toHaveBeenCalledTimes(2);
  });
});
