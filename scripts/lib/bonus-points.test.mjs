/**
 * Unit tests for scripts/lib/bonus-points.mjs — the `[bonus] @user +N reason`
 * issue-title parser and point-aggregation logic used by
 * scripts/generate-leaderboard.mjs. The network call is stubbed via
 * `vi.stubGlobal("fetch", ...)`, matching the pattern used in
 * scripts/lib/github-fetch.test.mjs.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBonusPoints } from "./bonus-points.mjs";

const AUTHORIZED_USER = "clubanderson";

function mockIssuesResponse(issues) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => issues,
  }));
}

function issue({ number, title, login = AUTHORIZED_USER }) {
  return { number, title, user: { login } };
}

describe("fetchBonusPoints", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty map when there are no bonus issues", async () => {
    vi.stubGlobal("fetch", mockIssuesResponse([]));

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.size).toBe(0);
  });

  it("parses a well-formed bonus issue title and records the reason", async () => {
    vi.stubGlobal(
      "fetch",
      mockIssuesResponse([
        issue({ number: 101, title: "[bonus] @alice +5 great triage work" }),
      ])
    );

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.has("alice")).toBe(true);
    expect(bonuses.get("alice")).toEqual({
      points: 5,
      reasons: ["#101: +5 great triage work"],
    });
  });

  it("sums points across multiple issues for the same login", async () => {
    vi.stubGlobal(
      "fetch",
      mockIssuesResponse([
        issue({ number: 1, title: "[bonus] @bob +3 docs fix" }),
        issue({ number: 2, title: "[bonus] @bob +2 another docs fix" }),
      ])
    );

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.get("bob").points).toBe(5);
    expect(bonuses.get("bob").reasons).toEqual([
      "#1: +3 docs fix",
      "#2: +2 another docs fix",
    ]);
  });

  it("falls back to '(no reason)' when the title has no trailing reason text", async () => {
    vi.stubGlobal(
      "fetch",
      mockIssuesResponse([issue({ number: 7, title: "[bonus] @carol +1" })])
    );

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.get("carol").reasons).toEqual(["#7: +1 (no reason)"]);
  });

  it("skips issues whose title does not match the bonus title regex", async () => {
    vi.stubGlobal(
      "fetch",
      mockIssuesResponse([
        issue({ number: 9, title: "not a bonus issue" }),
        issue({ number: 10, title: "[bonus] missing the @ sigil +5" }),
      ])
    );

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.size).toBe(0);
  });

  it("skips issues with a zero or negative point value", async () => {
    vi.stubGlobal(
      "fetch",
      mockIssuesResponse([
        issue({ number: 11, title: "[bonus] @dave +0 no-op" }),
      ])
    );

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.size).toBe(0);
  });

  it("ignores issues not authored by the authorized bonus-granting user", async () => {
    vi.stubGlobal(
      "fetch",
      mockIssuesResponse([
        issue({ number: 12, title: "[bonus] @erin +4 impersonation attempt", login: "someone-else" }),
      ])
    );

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.size).toBe(0);
  });

  it("returns an empty map and warns, without throwing, when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => "boom",
      }))
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const bonuses = await fetchBonusPoints({});

    expect(bonuses.size).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
