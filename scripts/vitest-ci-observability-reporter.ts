/**
 * vitest-ci-observability-reporter.ts — a custom Vitest reporter that emits a
 * single bounded, grep-friendly `CI_OBSERVABILITY` line (and a short
 * $GITHUB_STEP_SUMMARY table) summarizing a `vitest run` invocation.
 *
 * Why a reporter and not a wrapping script: `.github/workflows/vitest.yml`
 * invokes `npx vitest run --coverage` directly, with no wrapping script to
 * edit the way `check-internal-links.ts` / `fuzz-mdx-sanitizer.ts` do, and
 * agent tokens cannot write to `.github/workflows/*`. Registering this as a
 * Vitest reporter (via `vitest.config.ts`'s `test.reporters`) runs it as part
 * of every `vitest run` invocation regardless of how it's invoked, so no
 * workflow edit is required.
 *
 * Only aggregate counts are emitted — no test names, file paths, or error
 * text (those remain in the existing default reporter's output, unbounded
 * and unchanged).
 */
import fs from 'node:fs'
import type { Reporter, TestModule, SerializedError, TestRunEndReason } from 'vitest/node'

export interface VitestRunCounts {
  suites: number
  tests: number
  passed: number
  failed: number
  skipped: number
  status: 'pass' | 'fail'
}

/** Pure counting logic, extracted so it can be unit tested without a real Vitest run. */
export function summarizeTestModules(
  testModules: ReadonlyArray<TestModule>,
  unhandledErrors: ReadonlyArray<SerializedError>
): VitestRunCounts {
  let passed = 0
  let failed = 0
  let skipped = 0

  for (const testModule of testModules) {
    for (const test of testModule.children.allTests()) {
      const state = test.result().state
      if (state === 'passed') passed++
      else if (state === 'failed') failed++
      else if (state === 'skipped') skipped++
    }
  }

  const tests = passed + failed + skipped
  const status: VitestRunCounts['status'] = failed > 0 || unhandledErrors.length > 0 ? 'fail' : 'pass'

  return { suites: testModules.length, tests, passed, failed, skipped, status }
}

export function formatObservabilityLine(counts: VitestRunCounts): string {
  return (
    `CI_OBSERVABILITY check=vitest tests=${counts.tests} passed=${counts.passed} ` +
    `failed=${counts.failed} skipped=${counts.skipped} suites=${counts.suites} status=${counts.status}`
  )
}

export function formatStepSummaryTable(counts: VitestRunCounts): string {
  return (
    '## Vitest\n\n' +
    '| Metric | Value |\n' +
    '| --- | --- |\n' +
    `| Test files | ${counts.suites} |\n` +
    `| Tests | ${counts.tests} |\n` +
    `| Passed | ${counts.passed} |\n` +
    `| Failed | ${counts.failed} |\n` +
    `| Skipped | ${counts.skipped} |\n` +
    `| Status | ${counts.status} |\n`
  )
}

export class CiObservabilityReporter implements Reporter {
  onTestRunEnd(
    testModules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason
  ): void {
    const counts = summarizeTestModules(testModules, unhandledErrors)

    // eslint-disable-next-line no-console
    console.log(formatObservabilityLine(counts))

    const summaryPath = process.env.GITHUB_STEP_SUMMARY
    if (summaryPath) {
      fs.appendFileSync(summaryPath, formatStepSummaryTable(counts))
    }
  }
}
