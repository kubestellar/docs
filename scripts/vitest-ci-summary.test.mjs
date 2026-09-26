/**
 * Integration tests for scripts/vitest-ci-summary.mjs — the thin I/O
 * wrapper around vitest-ci-summary-helpers.mjs.
 *
 * The helpers file has its own unit tests (see
 * vitest-ci-summary-helpers.test.mjs); its own preamble explicitly
 * notes that the runner "is a thin I/O wrapper — process.argv,
 * readFileSync, stdout, GITHUB_STEP_SUMMARY, exitCode" and that all
 * shape logic is tested elsewhere. Nothing was actually testing those
 * four I/O side effects, so a regression that dropped the stdout line,
 * the GITHUB_STEP_SUMMARY append, or the failing-run exit code would
 * silently break the CI-observability contract without any test
 * failure.
 *
 * These tests exercise the runner as a subprocess so the real
 * process.argv / process.env / process.exitCode / console.log paths
 * are used, and assert on the observable outputs.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'

const RUNNER = fileURLToPath(new URL('./vitest-ci-summary.mjs', import.meta.url))

/**
 * Minimal Vitest JSON-reporter shape the runner reads. Only the fields
 * buildSummary() actually looks at are populated — see
 * vitest-ci-summary-helpers.mjs.
 */
function makeReport({
  success = true,
  suites = 2,
  total = 5,
  passed = 5,
  failed = 0,
  pending = 0,
  startTime = 1_000_000,
  endTime = 1_000_500,
} = {}) {
  return {
    success,
    numTotalTestSuites: suites,
    numTotalTests: total,
    numPassedTests: passed,
    numFailedTests: failed,
    numPendingTests: pending,
    startTime,
    testResults: [{ endTime }],
  }
}

function runRunner({ reportPath, env = {}, cwd }) {
  return spawnSync(process.execPath, [RUNNER, reportPath], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  })
}

describe('scripts/vitest-ci-summary.mjs runner', () => {
  let tmp

  beforeEach(() => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'vitest-ci-summary-'))
  })
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
  })

  it('emits one bounded VITEST_CI_SUMMARY JSON line on stdout for a passing report', () => {
    const reportPath = path.join(tmp, 'report.json')
    writeFileSync(
      reportPath,
      JSON.stringify(makeReport({ suites: 3, total: 7, passed: 7 })),
    )

    const result = runRunner({
      reportPath,
      env: { GITHUB_STEP_SUMMARY: '' },
      cwd: tmp,
    })

    expect(result.status).toBe(0)
    const stdoutLines = result.stdout.trim().split('\n')
    expect(stdoutLines).toHaveLength(1)
    expect(stdoutLines[0]).toMatch(/^VITEST_CI_SUMMARY \{.*\}$/)

    const parsed = JSON.parse(stdoutLines[0].replace(/^VITEST_CI_SUMMARY /, ''))
    expect(parsed).toMatchObject({
      event: 'vitest_ci_summary',
      success: true,
      suites: 3,
      tests_total: 7,
      tests_passed: 7,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 500,
    })
  })

  it('exits 1 and emits success=false on a failing report', () => {
    const reportPath = path.join(tmp, 'report.json')
    writeFileSync(
      reportPath,
      JSON.stringify(
        makeReport({ success: false, passed: 4, failed: 1, total: 5 }),
      ),
    )

    const result = runRunner({ reportPath, env: { GITHUB_STEP_SUMMARY: '' }, cwd: tmp })

    expect(result.status).toBe(1)
    const parsed = JSON.parse(
      result.stdout.trim().replace(/^VITEST_CI_SUMMARY /, ''),
    )
    expect(parsed.success).toBe(false)
    expect(parsed.tests_failed).toBe(1)
  })

  it('appends a Markdown block to GITHUB_STEP_SUMMARY when it is a real path', () => {
    const reportPath = path.join(tmp, 'report.json')
    const stepSummaryPath = path.join(tmp, 'step-summary.md')
    writeFileSync(reportPath, JSON.stringify(makeReport({ passed: 5, total: 5 })))
    writeFileSync(stepSummaryPath, 'PREEXISTING\n')

    const result = runRunner({
      reportPath,
      env: { GITHUB_STEP_SUMMARY: stepSummaryPath },
      cwd: tmp,
    })

    expect(result.status).toBe(0)
    const written = readFileSync(stepSummaryPath, 'utf8')
    expect(written.startsWith('PREEXISTING\n')).toBe(true)
    expect(written).toContain('### Vitest CI Summary')
    expect(written).toContain('✅ passed')
    expect(written).toMatch(/\| 2 \| 5 \| 5 \| 0 \| 0 \| \d+ \|/)
  })

  it('does not create a step-summary file when GITHUB_STEP_SUMMARY is unset', () => {
    const reportPath = path.join(tmp, 'report.json')
    const stepSummaryPath = path.join(tmp, 'step-summary.md')
    writeFileSync(reportPath, JSON.stringify(makeReport()))

    // Explicitly strip GITHUB_STEP_SUMMARY so we test the unset branch.
    const env = { ...process.env }
    delete env.GITHUB_STEP_SUMMARY
    const result = spawnSync(process.execPath, [RUNNER, reportPath], {
      cwd: tmp,
      env,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(existsSync(stepSummaryPath)).toBe(false)
  })

  it('handles a missing report path: writes a diagnostic to stderr and emits an all-zero summary with success=false', () => {
    const missing = path.join(tmp, 'does-not-exist.json')

    const result = runRunner({ reportPath: missing, env: { GITHUB_STEP_SUMMARY: '' }, cwd: tmp })

    expect(result.stderr).toContain('VITEST_CI_SUMMARY: failed to read/parse')
    expect(result.stderr).toContain(missing)

    const parsed = JSON.parse(
      result.stdout.trim().replace(/^VITEST_CI_SUMMARY /, ''),
    )
    expect(parsed).toMatchObject({
      event: 'vitest_ci_summary',
      success: false,
      suites: 0,
      tests_total: 0,
      tests_passed: 0,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 0,
    })
    // success=false → exit 1, so the CI job fails fast on an unreadable report.
    expect(result.status).toBe(1)
  })

  it('handles malformed JSON: same all-zero-with-failure summary and diagnostic stderr', () => {
    const reportPath = path.join(tmp, 'report.json')
    writeFileSync(reportPath, '{ not json at all')

    const result = runRunner({ reportPath, env: { GITHUB_STEP_SUMMARY: '' }, cwd: tmp })

    expect(result.stderr).toContain('VITEST_CI_SUMMARY: failed to read/parse')
    const parsed = JSON.parse(
      result.stdout.trim().replace(/^VITEST_CI_SUMMARY /, ''),
    )
    expect(parsed.success).toBe(false)
    expect(result.status).toBe(1)
  })

  it('defaults the report path to vitest-report.json in the CWD when no argv[2] is given', () => {
    // Write the report under the runner's CWD-default filename in a scratch dir.
    const reportPath = path.join(tmp, 'vitest-report.json')
    writeFileSync(reportPath, JSON.stringify(makeReport({ passed: 3, total: 3 })))

    // No explicit path argument — argv[2] is absent.
    const result = spawnSync(process.execPath, [RUNNER], {
      cwd: tmp,
      env: { ...process.env, GITHUB_STEP_SUMMARY: '' },
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    const parsed = JSON.parse(
      result.stdout.trim().replace(/^VITEST_CI_SUMMARY /, ''),
    )
    expect(parsed.tests_total).toBe(3)
    expect(parsed.tests_passed).toBe(3)
    expect(parsed.success).toBe(true)
  })
})
