/**
 * Unit tests for scripts/playwright-ci-observability-reporter.ts.
 *
 * Guards the CI_OBSERVABILITY summary emitted by every `playwright test`
 * run (wired in via playwright.config.ts's CI `reporter` array, since
 * e2e.yml invokes `npm run test:e2e` directly with no wrapping script to
 * edit instead). A regression here would silently drop the
 * pass/fail/flaky/skip counts CI tooling greps for, or misreport `status`
 * on a failing run.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  summarizeTestCases,
  formatObservabilityLine,
  formatStepSummaryTable,
  CiObservabilityReporter,
  type PlaywrightRunCounts,
} from '../../scripts/playwright-ci-observability-reporter'
import type { FullResult, TestCase, TestResult } from '@playwright/test/reporter'

let nextTestId = 0

// Minimal stand-in for the real TestCase shape: only the members the
// reporter actually reads (`id` and `outcome()`) are implemented.
function makeTestCase(outcome: ReturnType<TestCase['outcome']>): TestCase {
  return { id: `test-${nextTestId++}`, outcome: () => outcome } as unknown as TestCase
}

function makeFullResult(status: FullResult['status']): FullResult {
  return { status, startTime: new Date(), duration: 0 }
}

describe('summarizeTestCases', () => {
  it('counts passed/failed/flaky/skipped and reports status=pass when the run passed', () => {
    const outcomes: Array<ReturnType<TestCase['outcome']>> = [
      'expected',
      'expected',
      'flaky',
      'skipped',
    ]
    const counts = summarizeTestCases(outcomes, 'passed')

    expect(counts).toEqual<PlaywrightRunCounts>({
      tests: 4,
      passed: 2,
      failed: 0,
      flaky: 1,
      skipped: 1,
      status: 'pass',
    })
  })

  it('reports status=fail when the run status is not passed, even if every test outcome was expected', () => {
    // A global error (onError) or timeout can fail the run without any
    // individual test outcome being 'unexpected' — status must come from
    // the run result, not be re-derived from the outcome counts.
    const counts = summarizeTestCases(['expected', 'expected'], 'timedout')
    expect(counts.status).toBe('fail')
    expect(counts.failed).toBe(0)
  })

  it('counts unexpected outcomes as failed', () => {
    const counts = summarizeTestCases(['expected', 'unexpected'], 'failed')
    expect(counts.status).toBe('fail')
    expect(counts.failed).toBe(1)
  })

  it('handles zero test cases without throwing', () => {
    const counts = summarizeTestCases([], 'passed')
    expect(counts).toEqual<PlaywrightRunCounts>({
      tests: 0,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      status: 'pass',
    })
  })
})

describe('formatObservabilityLine', () => {
  it('emits one bounded, grep-friendly CI_OBSERVABILITY line', () => {
    const line = formatObservabilityLine({
      tests: 4,
      passed: 2,
      failed: 1,
      flaky: 1,
      skipped: 0,
      status: 'fail',
    })

    expect(line).toBe(
      'CI_OBSERVABILITY check=playwright tests=4 passed=2 failed=1 flaky=1 skipped=0 status=fail'
    )
  })
})

describe('formatStepSummaryTable', () => {
  it('renders a markdown table with all counters', () => {
    const table = formatStepSummaryTable({
      tests: 1,
      passed: 1,
      failed: 0,
      flaky: 0,
      skipped: 0,
      status: 'pass',
    })

    expect(table).toContain('## Playwright')
    expect(table).toContain('| Tests | 1 |')
    expect(table).toContain('| Status | pass |')
  })
})

// ─── Reporter class ──────────────────────────────────────────────────
//
// The pure helpers above are covered, but nothing exercised the actual
// Playwright hooks — `CiObservabilityReporter.onTestEnd()`/`onEnd()`. A
// regression that dropped the `console.log(formatObservabilityLine(counts))`
// call or the `fs.appendFileSync(summaryPath, ...)` branch would silently
// erase the grep-able CI_OBSERVABILITY line and the $GITHUB_STEP_SUMMARY
// table without any test failure — the exact class of silent-drop
// regression this reporter exists to prevent.

describe('CiObservabilityReporter', () => {
  const originalSummary = process.env.GITHUB_STEP_SUMMARY

  afterEach(() => {
    if (originalSummary === undefined) {
      delete process.env.GITHUB_STEP_SUMMARY
    } else {
      process.env.GITHUB_STEP_SUMMARY = originalSummary
    }
    vi.restoreAllMocks()
  })

  it('logs the CI_OBSERVABILITY line derived from the test cases seen via onTestEnd', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.GITHUB_STEP_SUMMARY

    const reporter = new CiObservabilityReporter()
    reporter.onTestEnd(makeTestCase('expected'), {} as TestResult)
    reporter.onTestEnd(makeTestCase('expected'), {} as TestResult)
    reporter.onTestEnd(makeTestCase('unexpected'), {} as TestResult)
    reporter.onTestEnd(makeTestCase('skipped'), {} as TestResult)
    reporter.onEnd(makeFullResult('failed'))

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      'CI_OBSERVABILITY check=playwright tests=4 passed=2 failed=1 flaky=0 skipped=1 status=fail'
    )
  })

  it('collapses repeated onTestEnd() calls for the same retried test into one counted outcome', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.GITHUB_STEP_SUMMARY

    const reporter = new CiObservabilityReporter()
    const retried = makeTestCase('flaky')
    // Two attempts of the same test (Playwright calls onTestEnd once per
    // attempt); the second call's TestCase object is the same reference,
    // so the Map keyed by `id` must not double-count it.
    reporter.onTestEnd(retried, {} as TestResult)
    reporter.onTestEnd(retried, {} as TestResult)
    reporter.onEnd(makeFullResult('passed'))

    expect(spy).toHaveBeenCalledWith(
      'CI_OBSERVABILITY check=playwright tests=1 passed=0 failed=0 flaky=1 skipped=0 status=pass'
    )
  })

  it('does NOT write a step-summary file when GITHUB_STEP_SUMMARY is unset', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.GITHUB_STEP_SUMMARY
    const appendSpy = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {})

    const reporter = new CiObservabilityReporter()
    reporter.onTestEnd(makeTestCase('expected'), {} as TestResult)
    reporter.onEnd(makeFullResult('passed'))

    expect(appendSpy).not.toHaveBeenCalled()
  })

  it('appends the markdown summary table to GITHUB_STEP_SUMMARY when it is set', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const tmpFile = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-ci-observability-')),
      'step-summary.md'
    )
    fs.writeFileSync(tmpFile, '')
    process.env.GITHUB_STEP_SUMMARY = tmpFile

    try {
      const reporter = new CiObservabilityReporter()
      reporter.onTestEnd(makeTestCase('expected'), {} as TestResult)
      reporter.onTestEnd(makeTestCase('expected'), {} as TestResult)
      reporter.onTestEnd(makeTestCase('skipped'), {} as TestResult)
      reporter.onEnd(makeFullResult('passed'))

      const written = fs.readFileSync(tmpFile, 'utf8')
      expect(written).toContain('## Playwright')
      expect(written).toContain('| Tests | 3 |')
      expect(written).toContain('| Passed | 2 |')
      expect(written).toContain('| Skipped | 1 |')
      expect(written).toContain('| Status | pass |')
    } finally {
      fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true })
    }
  })
})
