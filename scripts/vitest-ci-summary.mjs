#!/usr/bin/env node
// Reads Vitest's own JSON reporter output and emits a bounded CI-observability
// summary: one fixed-shape JSON line to stdout plus a short Markdown block to
// $GITHUB_STEP_SUMMARY. No test names, file paths, or error text are included
// so the summary stays bounded regardless of suite size or failure content.
import { readFileSync, appendFileSync } from 'node:fs'
import { buildSummary, renderMarkdown } from './vitest-ci-summary-helpers.mjs'

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
const summary = buildSummary(report)

// Single bounded JSON line for log-based observability tooling.
console.log(`VITEST_CI_SUMMARY ${JSON.stringify(summary)}`)

const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY
if (stepSummaryPath) {
  appendFileSync(stepSummaryPath, renderMarkdown(summary))
}

if (!summary.success) {
  process.exitCode = 1
}
