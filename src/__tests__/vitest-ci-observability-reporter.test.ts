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
import { describe, it, expect } from 'vitest'
import {
  summarizeTestModules,
  formatObservabilityLine,
  formatStepSummaryTable,
  type VitestRunCounts,
} from '../../scripts/vitest-ci-observability-reporter'
import type { TestModule, TestCase, SerializedError } from 'vitest/node'

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
