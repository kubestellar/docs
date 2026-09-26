/**
 * Unit tests for scripts/vitest-ci-observability-reporter.ts.
 *
 * Guards the CI_OBSERVABILITY summary emitted by every `vitest run`
 * invocation (wired in via vitest.config.ts's `test.reporters`, since
 * vitest.yml invokes `npx vitest run --coverage` directly with no wrapping
 * script to edit instead). A regression here would silently drop the
 * pass/fail/skip counts CI tooling greps for, or misreport `status` on a
 * failing run.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  summarizeTestModules,
  formatObservabilityLine,
  formatStepSummaryTable,
  CiObservabilityReporter,
  type VitestRunCounts,
} from '../../scripts/vitest-ci-observability-reporter'
import type { TestModule, TestCase, SerializedError, TestRunEndReason } from 'vitest/node'

// Minimal stand-ins for the real TestModule/TestCase shape: only the members
// summarizeTestModules() actually reads (`children.allTests()` and
// `test.result().state`) are implemented.
function makeTestCase(state: 'passed' | 'failed' | 'skipped'): TestCase {
  return { result: () => ({ state }) } as unknown as TestCase
}

function makeTestModule(states: Array<'passed' | 'failed' | 'skipped'>): TestModule {
  const tests = states.map(makeTestCase)
  return {
    children: {
      allTests: function* () {
        for (const t of tests) yield t
      },
    },
  } as unknown as TestModule
}

describe('summarizeTestModules', () => {
  it('counts passed/failed/skipped across all modules and reports status=pass when nothing failed', () => {
    const modules = [makeTestModule(['passed', 'passed']), makeTestModule(['skipped'])]
    const counts = summarizeTestModules(modules, [])

    expect(counts).toEqual<VitestRunCounts>({
      suites: 2,
      tests: 3,
      passed: 2,
      failed: 0,
      skipped: 1,
      status: 'pass',
    })
  })

  it('reports status=fail when any test failed', () => {
    const modules = [makeTestModule(['passed', 'failed'])]
    const counts = summarizeTestModules(modules, [])

    expect(counts.status).toBe('fail')
    expect(counts.failed).toBe(1)
  })

  it('reports status=fail on unhandled errors even with all tests passing', () => {
    const modules = [makeTestModule(['passed'])]
    const unhandled: SerializedError[] = [{ message: 'boom' } as SerializedError]
    const counts = summarizeTestModules(modules, unhandled)

    expect(counts.status).toBe('fail')
    expect(counts.failed).toBe(0)
  })

  it('handles zero modules without throwing', () => {
    const counts = summarizeTestModules([], [])
    expect(counts).toEqual<VitestRunCounts>({
      suites: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      status: 'pass',
    })
  })
})

describe('formatObservabilityLine', () => {
  it('emits one bounded, grep-friendly CI_OBSERVABILITY line', () => {
    const line = formatObservabilityLine({
      suites: 2,
      tests: 3,
      passed: 2,
      failed: 1,
      skipped: 0,
      status: 'fail',
    })

    expect(line).toBe(
      'CI_OBSERVABILITY check=vitest tests=3 passed=2 failed=1 skipped=0 suites=2 status=fail'
    )
  })
})

describe('formatStepSummaryTable', () => {
  it('renders a markdown table with all counters', () => {
    const table = formatStepSummaryTable({
      suites: 1,
      tests: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      status: 'pass',
    })

    expect(table).toContain('## Vitest')
    expect(table).toContain('| Test files | 1 |')
    expect(table).toContain('| Status | pass |')
  })
})

// ─── Reporter class ──────────────────────────────────────────────────
//
// The pure helpers above are covered, but nothing exercised the actual
// Vitest hook — `CiObservabilityReporter.onTestRunEnd()`. A regression
// that dropped the `console.log(formatObservabilityLine(counts))` call
// or the `fs.appendFileSync(summaryPath, ...)` branch would silently
// erase the grep-able CI_OBSERVABILITY line and the
// $GITHUB_STEP_SUMMARY table without any test failure — the exact
// class of silent-drop regression this reporter exists to prevent.

describe('CiObservabilityReporter.onTestRunEnd', () => {
  const REASON: TestRunEndReason = 'passed' as TestRunEndReason
  const originalSummary = process.env.GITHUB_STEP_SUMMARY

  afterEach(() => {
    if (originalSummary === undefined) {
      delete process.env.GITHUB_STEP_SUMMARY
    } else {
      process.env.GITHUB_STEP_SUMMARY = originalSummary
    }
    vi.restoreAllMocks()
  })

  it('logs the CI_OBSERVABILITY line derived from the given test modules', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.GITHUB_STEP_SUMMARY

    const reporter = new CiObservabilityReporter()
    reporter.onTestRunEnd(
      [makeTestModule(['passed', 'passed']), makeTestModule(['failed', 'skipped'])],
      [],
      REASON
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      'CI_OBSERVABILITY check=vitest tests=4 passed=2 failed=1 skipped=1 suites=2 status=fail'
    )
  })

  it('does NOT write a step-summary file when GITHUB_STEP_SUMMARY is unset', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.GITHUB_STEP_SUMMARY
    const appendSpy = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {})

    new CiObservabilityReporter().onTestRunEnd([makeTestModule(['passed'])], [], REASON)

    expect(appendSpy).not.toHaveBeenCalled()
  })

  it('appends the markdown summary table to GITHUB_STEP_SUMMARY when it is set', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const tmpFile = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'ci-observability-')),
      'step-summary.md'
    )
    fs.writeFileSync(tmpFile, '')
    process.env.GITHUB_STEP_SUMMARY = tmpFile

    try {
      new CiObservabilityReporter().onTestRunEnd(
        [makeTestModule(['passed', 'passed', 'skipped'])],
        [],
        REASON
      )

      const written = fs.readFileSync(tmpFile, 'utf8')
      expect(written).toContain('## Vitest')
      expect(written).toContain('| Tests | 3 |')
      expect(written).toContain('| Passed | 2 |')
      expect(written).toContain('| Skipped | 1 |')
      expect(written).toContain('| Status | pass |')
    } finally {
      fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true })
    }
  })

  it('reports status=fail on the observability line when there are unhandled errors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.GITHUB_STEP_SUMMARY

    new CiObservabilityReporter().onTestRunEnd(
      [makeTestModule(['passed'])],
      [{ message: 'boom' } as SerializedError],
      REASON
    )

    expect(spy.mock.calls[0][0]).toMatch(/status=fail/)
  })
})
