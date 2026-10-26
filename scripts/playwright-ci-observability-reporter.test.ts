/**
 * Unit tests for scripts/playwright-ci-observability-reporter.ts — the pure
 * counting/formatting logic behind the CI_OBSERVABILITY line and
 * $GITHUB_STEP_SUMMARY table emitted on every `playwright test` run, plus
 * the `CiObservabilityReporter.onTestEnd`/`onEnd` hooks that wire them
 * together (mirrors vitest-ci-observability-reporter.test.ts).
 */
import { afterEach, describe, it, expect, vi } from "vitest"
import fs from "node:fs"
import type { FullResult, TestCase } from "@playwright/test/reporter"
import {
  summarizeTestCases,
  formatObservabilityLine,
  formatStepSummaryTable,
  CiObservabilityReporter,
  type PlaywrightRunCounts,
} from "./playwright-ci-observability-reporter"

function makeTestCase(id: string, outcome: ReturnType<TestCase["outcome"]>): TestCase {
  return { id, outcome: () => outcome } as unknown as TestCase
}

describe("summarizeTestCases", () => {
  it("counts each outcome bucket and reports pass status", () => {
    const outcomes = ["expected", "expected", "unexpected", "flaky", "skipped"] as const

    const counts = summarizeTestCases(outcomes, "passed")

    expect(counts).toEqual({
      tests: 5,
      passed: 2,
      failed: 1,
      flaky: 1,
      skipped: 1,
      status: "pass",
    })
  })

  it("reports fail status when the run status is not passed", () => {
    const counts = summarizeTestCases(["expected"], "failed")

    expect(counts.status).toBe("fail")
  })

  it("handles zero test cases", () => {
    expect(summarizeTestCases([], "passed")).toEqual({
      tests: 0,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      status: "pass",
    })
  })
})

describe("formatObservabilityLine", () => {
  it("emits a single grep-friendly CI_OBSERVABILITY line", () => {
    const counts: PlaywrightRunCounts = {
      tests: 10,
      passed: 7,
      failed: 1,
      flaky: 1,
      skipped: 1,
      status: "fail",
    }

    expect(formatObservabilityLine(counts)).toBe(
      "CI_OBSERVABILITY check=playwright tests=10 passed=7 failed=1 flaky=1 skipped=1 status=fail"
    )
  })
})

describe("formatStepSummaryTable", () => {
  it("renders a markdown table with every metric", () => {
    const counts: PlaywrightRunCounts = {
      tests: 3,
      passed: 3,
      failed: 0,
      flaky: 0,
      skipped: 0,
      status: "pass",
    }

    const table = formatStepSummaryTable(counts)

    expect(table).toContain("## Playwright")
    expect(table).toContain("| Tests | 3 |")
    expect(table).toContain("| Passed | 3 |")
    expect(table).toContain("| Failed | 0 |")
    expect(table).toContain("| Flaky | 0 |")
    expect(table).toContain("| Skipped | 0 |")
    expect(table).toContain("| Status | pass |")
  })
})

describe("CiObservabilityReporter", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GITHUB_STEP_SUMMARY
  })

  it("collapses a retried test's multiple onTestEnd calls into a single entry", () => {
    delete process.env.GITHUB_STEP_SUMMARY
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const appendSpy = vi.spyOn(fs, "appendFileSync").mockImplementation(() => {})
    const reporter = new CiObservabilityReporter()

    const retried = makeTestCase("t1", "unexpected")
    reporter.onTestEnd(retried, {} as unknown as Parameters<typeof reporter.onTestEnd>[1])
    // Same test id reported again after a retry succeeds — final outcome flips.
    const retriedAfterPass = makeTestCase("t1", "flaky")
    reporter.onTestEnd(retriedAfterPass, {} as unknown as Parameters<typeof reporter.onTestEnd>[1])
    reporter.onTestEnd(
      makeTestCase("t2", "expected"),
      {} as unknown as Parameters<typeof reporter.onTestEnd>[1]
    )

    reporter.onEnd({ status: "passed" } as unknown as FullResult)

    expect(logSpy).toHaveBeenCalledWith(
      "CI_OBSERVABILITY check=playwright tests=2 passed=1 failed=0 flaky=1 skipped=0 status=pass"
    )
    expect(appendSpy).not.toHaveBeenCalled()
  })

  it("appends the step-summary table when GITHUB_STEP_SUMMARY is set", () => {
    process.env.GITHUB_STEP_SUMMARY = "/tmp/step-summary.md"
    vi.spyOn(console, "log").mockImplementation(() => {})
    const appendSpy = vi.spyOn(fs, "appendFileSync").mockImplementation(() => {})
    const reporter = new CiObservabilityReporter()

    reporter.onTestEnd(
      makeTestCase("t1", "unexpected"),
      {} as unknown as Parameters<typeof reporter.onTestEnd>[1]
    )
    reporter.onEnd({ status: "failed" } as unknown as FullResult)

    expect(appendSpy).toHaveBeenCalledWith(
      "/tmp/step-summary.md",
      expect.stringContaining("## Playwright")
    )
  })
})
