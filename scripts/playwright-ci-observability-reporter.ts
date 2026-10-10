/**
 * playwright-ci-observability-reporter.ts — a custom Playwright reporter
 * that emits a single bounded, grep-friendly `CI_OBSERVABILITY` line (and a
 * short $GITHUB_STEP_SUMMARY table) summarizing an `e2e` (`playwright test`)
 * run, mirroring scripts/vitest-ci-observability-reporter.ts for the vitest
 * suite (see kubestellar/docs#7323).
 *
 * Why a reporter and not a wrapping script: `.github/workflows/e2e.yml`
 * invokes `npm run test:e2e` (= `playwright test`) directly, with no
 * wrapping script to edit, and agent tokens cannot write to
 * `.github/workflows/*`. Registering this as a Playwright reporter (via
 * `playwright.config.ts`'s `reporter` array) runs it as part of every
 * `playwright test` invocation regardless of how it's invoked, so no
 * workflow edit is required.
 *
 * Only aggregate counts are emitted — no test names, file paths, or error
 * text (those remain in the existing `github`/`html` reporters' output,
 * unbounded and unchanged).
 */
import fs from 'node:fs'
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter'

export interface PlaywrightRunCounts {
  tests: number
  passed: number
  failed: number
  flaky: number
  skipped: number
  status: 'pass' | 'fail'
}

/**
 * Pure counting logic, extracted so it can be unit tested without a real
 * Playwright run. Takes the final `outcome()` of every test case — not raw
 * per-attempt `TestResult`s — so a test that passes on retry is counted
 * once as `flaky`, not once as `failed` and once as `passed`.
 */
export function summarizeTestCases(
  outcomes: ReadonlyArray<ReturnType<TestCase['outcome']>>,
  runStatus: FullResult['status']
): PlaywrightRunCounts {
  let passed = 0
  let failed = 0
  let flaky = 0
  let skipped = 0

  for (const outcome of outcomes) {
    if (outcome === 'expected') passed++
    else if (outcome === 'unexpected') failed++
    else if (outcome === 'flaky') flaky++
    else if (outcome === 'skipped') skipped++
  }

  const status: PlaywrightRunCounts['status'] =
    runStatus === 'passed' ? 'pass' : 'fail'

  return { tests: outcomes.length, passed, failed, flaky, skipped, status }
}

export function formatObservabilityLine(counts: PlaywrightRunCounts): string {
  return (
    `CI_OBSERVABILITY check=playwright tests=${counts.tests} passed=${counts.passed} ` +
    `failed=${counts.failed} flaky=${counts.flaky} skipped=${counts.skipped} status=${counts.status}`
  )
}

export function formatStepSummaryTable(counts: PlaywrightRunCounts): string {
  return (
    '## Playwright\n\n' +
    '| Metric | Value |\n' +
    '| --- | --- |\n' +
    `| Tests | ${counts.tests} |\n` +
    `| Passed | ${counts.passed} |\n` +
    `| Failed | ${counts.failed} |\n` +
    `| Flaky | ${counts.flaky} |\n` +
    `| Skipped | ${counts.skipped} |\n` +
    `| Status | ${counts.status} |\n`
  )
}

export class CiObservabilityReporter implements Reporter {
  // Keyed by TestCase.id so a retried test's multiple onTestEnd() calls
  // collapse to a single entry; `outcome()` already reflects the final,
  // post-retry result for that test.
  private readonly tests = new Map<string, TestCase>()

  onTestEnd(test: TestCase, _result: TestResult): void {
    this.tests.set(test.id, test)
  }

  onEnd(result: FullResult): void {
    const outcomes = Array.from(this.tests.values(), test => test.outcome())
    const counts = summarizeTestCases(outcomes, result.status)

    // eslint-disable-next-line no-console
    console.log(formatObservabilityLine(counts))

    const summaryPath = process.env.GITHUB_STEP_SUMMARY
    if (summaryPath) {
      fs.appendFileSync(summaryPath, formatStepSummaryTable(counts))
    }
  }
}

export default CiObservabilityReporter
