#!/usr/bin/env node
// Reads Vitest's own JSON reporter output and emits a bounded CI-observability
// summary: one fixed-shape JSON line to stdout plus a short Markdown block to
// $GITHUB_STEP_SUMMARY. No test names, file paths, or error text are included
// so the summary stays bounded regardless of suite size or failure content.
import { readFileSync, appendFileSync } from 'node:fs'

const REPORT_PATH = process.argv[2] ?? 'vitest-report.json'

function loadReport(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(`VITEST_CI_SUMMARY: failed to read/parse ${path}: ${err.message}`)
    return null
  }
}

const report = loadReport(REPORT_PATH)

// Vitest's JSON reporter has no top-level `endTime`; derive overall duration
// from the latest per-suite `endTime` instead, relative to the run's start.
const latestEndTime = (report?.testResults ?? []).reduce(
  (max, suite) => Math.max(max, suite.endTime ?? 0),
  0,
)

const summary = {
  event: 'vitest_ci_summary',
  success: report?.success ?? false,
  suites: report?.numTotalTestSuites ?? 0,
  tests_total: report?.numTotalTests ?? 0,
  tests_passed: report?.numPassedTests ?? 0,
  tests_failed: report?.numFailedTests ?? 0,
  tests_skipped: report?.numPendingTests ?? 0,
  duration_ms: report
    ? Math.max(0, Math.round(latestEndTime - (report.startTime ?? 0)))
    : 0,
}

// Single bounded JSON line for log-based observability tooling.
console.log(`VITEST_CI_SUMMARY ${JSON.stringify(summary)}`)

const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY
if (stepSummaryPath) {
  const status = summary.success ? '✅ passed' : '❌ failed'
  const markdown = [
    '### Vitest CI Summary',
    '',
    `**Status:** ${status}`,
    '',
    '| Suites | Total | Passed | Failed | Skipped | Duration (ms) |',
    '|---|---|---|---|---|---|',
    `| ${summary.suites} | ${summary.tests_total} | ${summary.tests_passed} | ${summary.tests_failed} | ${summary.tests_skipped} | ${summary.duration_ms} |`,
    '',
  ].join('\n')
  appendFileSync(stepSummaryPath, markdown)
}

if (!summary.success) {
  process.exitCode = 1
}
