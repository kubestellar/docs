/**
 * Unit tests for scripts/lib/dates.mjs — the pure date helpers used by
 * scripts/generate-leaderboard.mjs to compute the incremental snapshot's
 * live-window boundary.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, it, expect } from "vitest";
import { startOfDayUTC, addDays } from "./dates.mjs";

describe("startOfDayUTC", () => {
  it("truncates a date to midnight UTC", () => {
    const d = startOfDayUTC("2026-03-15T14:32:07.123Z");
    expect(d.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("leaves a date already at midnight UTC unchanged", () => {
    const d = startOfDayUTC("2026-01-01T00:00:00.000Z");
    expect(d.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("accepts a Date instance as input", () => {
    const input = new Date("2026-06-30T23:59:59.999Z");
    const d = startOfDayUTC(input);
    expect(d.toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });
});

describe("addDays", () => {
  it("adds a positive number of days", () => {
    const d = addDays("2026-03-15T00:00:00.000Z", 7);
    expect(d.toISOString()).toBe("2026-03-22T00:00:00.000Z");
  });

  it("subtracts days when given a negative value", () => {
    const d = addDays("2026-03-15T00:00:00.000Z", -7);
    expect(d.toISOString()).toBe("2026-03-08T00:00:00.000Z");
  });

  it("rolls over a month boundary", () => {
    const d = addDays("2026-01-30T00:00:00.000Z", 3);
    expect(d.toISOString()).toBe("2026-02-02T00:00:00.000Z");
  });

  it("returns a new Date instance without mutating the input", () => {
    const input = new Date("2026-03-15T00:00:00.000Z");
    const result = addDays(input, 1);
    expect(result).not.toBe(input);
    expect(input.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });
});
