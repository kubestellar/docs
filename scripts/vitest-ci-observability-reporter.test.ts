/**
 * Unit tests for scripts/vitest-ci-observability-reporter.ts — the pure
 * counting/formatting logic behind the CI_OBSERVABILITY line and
 * $GITHUB_STEP_SUMMARY table emitted on every `vitest run`, plus the
 * `CiObservabilityReporter.onTestRunEnd` hook that wires them together.
 */
import { afterEach, describe, it, expect, vi } from "vitest"
import fs from "node:fs"
import type { TestModule, SerializedError } from "vitest/node"
import {
  summarizeTestModules,
  formatObservabilityLine,
  formatStepSummaryTable,
  CiObservabilityReporter,
  type VitestRunCounts,
} from "./vitest-ci-observability-reporter"

function makeTest(state: "passed" | "failed" | "skipped") {
  return { result: () => ({ state }) }
}

function makeTestModule(states: Array<"passed" | "failed" | "skipped">): TestModule {
  const tests = states.map(makeTest)
  return {
    children: {
      allTests: () => tests,
    },
  } as unknown as TestModule
}

describe("summarizeTestModules", () => {
  it("counts passed/failed/skipped across all modules and reports pass status", () => {
    const modules = [
      makeTestModule(["passed", "passed"]),
      makeTestModule(["skipped"]),
    ]

    const counts = summarizeTestModules(modules, [])

    expect(counts).toEqual({
      suites: 2,
      tests: 3,
      passed: 2,
      failed: 0,
      skipped: 1,
      status: "pass",
    })
  })

  it("reports fail status when any test failed", () => {
    const modules = [makeTestModule(["passed", "failed"])]

    const counts = summarizeTestModules(modules, [])

    expect(counts.failed).toBe(1)
    expect(counts.status).toBe("fail")
  })

  it("reports fail status on unhandled errors even with zero failed tests", () => {
    const modules = [makeTestModule(["passed"])]
    const unhandledErrors = [{ message: "boom" }] as unknown as ReadonlyArray<SerializedError>

    const counts = summarizeTestModules(modules, unhandledErrors)

    expect(counts.failed).toBe(0)
    expect(counts.status).toBe("fail")
  })

  it("handles zero modules", () => {
    expect(summarizeTestModules([], [])).toEqual({
      suites: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      status: "pass",
    })
  })
})

describe("formatObservabilityLine", () => {
  it("emits a single grep-friendly CI_OBSERVABILITY line", () => {
    const counts: VitestRunCounts = {
      suites: 4,
      tests: 10,
      passed: 8,
      failed: 1,
      skipped: 1,
      status: "fail",
    }

    expect(formatObservabilityLine(counts)).toBe(
      "CI_OBSERVABILITY check=vitest tests=10 passed=8 failed=1 skipped=1 suites=4 status=fail"
    )
  })
})

describe("formatStepSummaryTable", () => {
  it("renders a markdown table with every metric", () => {
    const counts: VitestRunCounts = {
      suites: 2,
      tests: 5,
      passed: 5,
      failed: 0,
      skipped: 0,
      status: "pass",
    }

    const table = formatStepSummaryTable(counts)

    expect(table).toContain("## Vitest")
    expect(table).toContain("| Test files | 2 |")
    expect(table).toContain("| Tests | 5 |")
    expect(table).toContain("| Passed | 5 |")
    expect(table).toContain("| Failed | 0 |")
    expect(table).toContain("| Skipped | 0 |")
    expect(table).toContain("| Status | pass |")
  })
})

describe("CiObservabilityReporter.onTestRunEnd", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GITHUB_STEP_SUMMARY
  })

  it("logs the observability line and skips the step-summary write when unset", () => {
    delete process.env.GITHUB_STEP_SUMMARY
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const appendSpy = vi.spyOn(fs, "appendFileSync").mockImplementation(() => {})
    const reporter = new CiObservabilityReporter()

    reporter.onTestRunEnd(
      [makeTestModule(["passed"])],
      [],
      "passed" as unknown as Parameters<CiObservabilityReporter["onTestRunEnd"]>[2]
    )

    expect(logSpy).toHaveBeenCalledWith(
      "CI_OBSERVABILITY check=vitest tests=1 passed=1 failed=0 skipped=0 suites=1 status=pass"
    )
    expect(appendSpy).not.toHaveBeenCalled()
  })

  it("appends the step-summary table when GITHUB_STEP_SUMMARY is set", () => {
    process.env.GITHUB_STEP_SUMMARY = "/tmp/step-summary.md"
    vi.spyOn(console, "log").mockImplementation(() => {})
    const appendSpy = vi.spyOn(fs, "appendFileSync").mockImplementation(() => {})
    const reporter = new CiObservabilityReporter()

    reporter.onTestRunEnd(
      [makeTestModule(["failed"])],
      [],
      "failed" as unknown as Parameters<CiObservabilityReporter["onTestRunEnd"]>[2]
    )

    expect(appendSpy).toHaveBeenCalledWith(
      "/tmp/step-summary.md",
      expect.stringContaining("## Vitest")
    )
  })
})
