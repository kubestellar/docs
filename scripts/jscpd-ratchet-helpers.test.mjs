import { describe, it, expect } from "vitest";
import { evaluateRatchet } from "./jscpd-ratchet-helpers.mjs";

describe("evaluateRatchet", () => {
  it("fails when clones grew past the baseline", () => {
    const result = evaluateRatchet(16, 14);
    expect(result.ok).toBe(false);
    expect(result.errorLine).toMatch(/Duplication increased: 16 clones > baseline 14/);
    expect(result.logLines[0]).toMatch(/16 clone\(s\) found, baseline 14/);
  });

  it("passes and emits no notice when clones equal the baseline", () => {
    const result = evaluateRatchet(14, 14);
    expect(result.ok).toBe(true);
    expect(result.errorLine).toBeNull();
    expect(result.logLines).toHaveLength(1);
  });

  it("passes and emits a ratchet-down notice when clones dropped below the baseline", () => {
    const result = evaluateRatchet(10, 14);
    expect(result.ok).toBe(true);
    expect(result.errorLine).toBeNull();
    expect(result.logLines[1]).toMatch(/Duplication decreased.*lower "clones" in jscpd-baseline\.json to 10/);
  });

  it("treats a zero baseline as a pass when no clones are found", () => {
    const result = evaluateRatchet(0, 0);
    expect(result.ok).toBe(true);
    expect(result.errorLine).toBeNull();
  });

  it("fails on the smallest possible regression (baseline + 1)", () => {
    const result = evaluateRatchet(1, 0);
    expect(result.ok).toBe(false);
    expect(result.errorLine).toMatch(/1 clones > baseline 0/);
  });
});
