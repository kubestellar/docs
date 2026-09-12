/**
 * Contract tests for scripts/vitest-ci-summary-helpers.mjs.
 *
 * The runner (scripts/vitest-ci-summary.mjs) is a thin I/O wrapper —
 * process.argv, readFileSync, stdout, GITHUB_STEP_SUMMARY, exitCode.
 * All shape logic (report parsing, duration derivation, summary object
 * construction, markdown rendering) lives in the helper module so it
 * can be tested here without touching the filesystem.
 */
import { describe, it, expect } from 'vitest'
import {
  deriveDurationMs,
  buildSummary,
  renderMarkdown,
} from '../scripts/vitest-ci-summary-helpers.mjs'

// ─── deriveDurationMs ────────────────────────────────────────────────

describe('deriveDurationMs', () => {
  it('returns 0 for a null report', () => {
    expect(deriveDurationMs(null)).toBe(0)
  })

  it('returns 0 when testResults is missing', () => {
    expect(deriveDurationMs({ startTime: 1000 })).toBe(0)
  })

  it('returns 0 when testResults is empty', () => {
    expect(deriveDurationMs({ startTime: 1000, testResults: [] })).toBe(0)
  })

  it('subtracts startTime from the max suite endTime', () => {
    const report = {
      startTime: 1000,
      testResults: [
        { endTime: 2500 },
        { endTime: 3800 },
        { endTime: 2100 },
      ],
    }
    expect(deriveDurationMs(report)).toBe(2800)
  })

  it('floors negative durations at 0 (guards against corrupted timestamps)', () => {
    const report = {
      startTime: 5000,
      testResults: [{ endTime: 1000 }],
    }
    expect(deriveDurationMs(report)).toBe(0)
  })

  it('treats a missing suite endTime as 0 when computing max', () => {
    const report = {
      startTime: 100,
      testResults: [{}, { endTime: 500 }, {}],
    }
    expect(deriveDurationMs(report)).toBe(400)
  })

  it('rounds fractional millisecond deltas', () => {
    const report = {
      startTime: 0.4,
      testResults: [{ endTime: 100.6 }],
    }
    expect(deriveDurationMs(report)).toBe(100)
  })
})

// ─── buildSummary ────────────────────────────────────────────────────

describe('buildSummary', () => {
  it('returns a fixed-shape all-defaults object for a null report', () => {
    expect(buildSummary(null)).toEqual({
      event: 'vitest_ci_summary',
      success: false,
      suites: 0,
      tests_total: 0,
      tests_passed: 0,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 0,
    })
  })

  it('always sets event to "vitest_ci_summary"', () => {
    expect(buildSummary({}).event).toBe('vitest_ci_summary')
    expect(buildSummary(null).event).toBe('vitest_ci_summary')
  })

  it('propagates every numeric field from a successful report', () => {
    const report = {
      success: true,
      numTotalTestSuites: 12,
      numTotalTests: 340,
      numPassedTests: 336,
      numFailedTests: 0,
      numPendingTests: 4,
      startTime: 1000,
      testResults: [{ endTime: 6000 }],
    }
    expect(buildSummary(report)).toEqual({
      event: 'vitest_ci_summary',
      success: true,
      suites: 12,
      tests_total: 340,
      tests_passed: 336,
      tests_failed: 0,
      tests_skipped: 4,
      duration_ms: 5000,
    })
  })

  it('propagates a failure report with a non-zero tests_failed', () => {
    const summary = buildSummary({
      success: false,
      numTotalTestSuites: 3,
      numTotalTests: 20,
      numPassedTests: 18,
      numFailedTests: 2,
      numPendingTests: 0,
    })
    expect(summary.success).toBe(false)
    expect(summary.tests_failed).toBe(2)
  })

  it('defaults every missing numeric field to 0 (partial report)', () => {
    const summary = buildSummary({ success: true })
    expect(summary).toEqual({
      event: 'vitest_ci_summary',
      success: true,
      suites: 0,
      tests_total: 0,
      tests_passed: 0,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 0,
    })
  })
})

// ─── renderMarkdown ──────────────────────────────────────────────────

describe('renderMarkdown', () => {
  const baseSummary = {
    event: 'vitest_ci_summary',
    success: true,
    suites: 3,
    tests_total: 20,
    tests_passed: 20,
    tests_failed: 0,
    tests_skipped: 0,
    duration_ms: 1234,
  }

  it('emits the fixed heading and 3-column status line', () => {
    const md = renderMarkdown(baseSummary)
    expect(md).toContain('### Vitest CI Summary')
    expect(md).toContain('**Status:** ✅ passed')
  })

  it('flips the status glyph on failure', () => {
    const md = renderMarkdown({ ...baseSummary, success: false })
    expect(md).toContain('**Status:** ❌ failed')
    expect(md).not.toContain('✅ passed')
  })

  it('renders a 6-column pipe table with the summary numbers in order', () => {
    const md = renderMarkdown(baseSummary)
    expect(md).toContain('| Suites | Total | Passed | Failed | Skipped | Duration (ms) |')
    expect(md).toContain('|---|---|---|---|---|---|')
    expect(md).toContain('| 3 | 20 | 20 | 0 | 0 | 1234 |')
  })

  it('renders zero-count summaries without dropping the row', () => {
    const md = renderMarkdown({
      event: 'vitest_ci_summary',
      success: false,
      suites: 0,
      tests_total: 0,
      tests_passed: 0,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 0,
    })
    expect(md).toContain('| 0 | 0 | 0 | 0 | 0 | 0 |')
  })

  it('ends with a trailing newline so appendFileSync stacks cleanly', () => {
    expect(renderMarkdown(baseSummary).endsWith('\n')).toBe(true)
  })
})
