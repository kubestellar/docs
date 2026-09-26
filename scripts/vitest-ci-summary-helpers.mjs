/**
 * Pure helpers extracted from scripts/vitest-ci-summary.mjs so the
 * summary-shape logic (report parsing, latest-endTime derivation,
 * summary object construction, markdown rendering) can be unit-tested
 * independently of stdout / GITHUB_STEP_SUMMARY / process.exitCode side
 * effects. Same pattern as scripts/lint-dashboard-helpers.mjs.
 *
 * The runner (vitest-ci-summary.mjs) reads the JSON report from disk and
 * hands the parsed object to these helpers. See
 * scripts/vitest-ci-summary-helpers.test.mjs for the contract.
 */

/**
 * Derive the run's total wall-clock duration from a Vitest JSON reporter
 * report. Vitest's JSON reporter has no top-level `endTime`; we take the
 * max `endTime` across per-suite `testResults` and subtract `startTime`.
 * Returns 0 for a null report and floors the result at 0 so a report
 * whose `startTime` exceeds every suite `endTime` (e.g. after a clock
 * skew or a corrupted report) does not produce a negative duration.
 *
 * @param {object|null} report Parsed Vitest JSON report.
 * @returns {number} duration in milliseconds
 */
export function deriveDurationMs(report) {
  if (!report) return 0
  const latestEndTime = (report.testResults ?? []).reduce(
    (max, suite) => Math.max(max, suite.endTime ?? 0),
    0,
  )
  return Math.max(0, Math.round(latestEndTime - (report.startTime ?? 0)))
}

/**
 * Build the fixed-shape CI-observability summary object emitted as
 * a single JSON line by the runner. Every field falls back to a safe
 * numeric / boolean default when the report is missing or partial, so
 * the log-line shape stays constant across success, failure, and
 * unreadable-report cases.
 *
 * @param {object|null} report Parsed Vitest JSON report.
 * @returns {object} summary
 */
export function buildSummary(report) {
  return {
    event: 'vitest_ci_summary',
    success: report?.success ?? false,
    suites: report?.numTotalTestSuites ?? 0,
    tests_total: report?.numTotalTests ?? 0,
    tests_passed: report?.numPassedTests ?? 0,
    tests_failed: report?.numFailedTests ?? 0,
    tests_skipped: report?.numPendingTests ?? 0,
    duration_ms: deriveDurationMs(report),
  }
}

/**
 * Render the Markdown block appended to $GITHUB_STEP_SUMMARY.
 * Deterministic pure function of the summary object; the runner only
 * decides whether to call it based on env presence.
 *
 * @param {object} summary Summary produced by buildSummary().
 * @returns {string} markdown
 */
export function renderMarkdown(summary) {
  const status = summary.success ? '✅ passed' : '❌ failed'
  return [
    '### Vitest CI Summary',
    '',
    `**Status:** ${status}`,
    '',
    '| Suites | Total | Passed | Failed | Skipped | Duration (ms) |',
    '|---|---|---|---|---|---|',
    `| ${summary.suites} | ${summary.tests_total} | ${summary.tests_passed} | ${summary.tests_failed} | ${summary.tests_skipped} | ${summary.duration_ms} |`,
    '',
  ].join('\n')
}
