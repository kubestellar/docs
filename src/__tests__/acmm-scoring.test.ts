import { describe, it, expect } from 'vitest'
import {
  LEVELS,
  CUMULATIVE_SCANNABLE,
  TOTAL_SCANNABLE,
  TOTAL_CRITERIA,
  MIN_LEVEL,
  MAX_LEVEL,
  levelFromDetectedIds,
  levelFromScore,
} from '../app/[locale]/acmm-leaderboard/scoring'

// ---------------------------------------------------------------------------
// scoring.ts unit tests
//
// scoring.ts is the ACMM (AI Contribution Maturity Model) level-computation
// module that drives the acmm-leaderboard page. It has no unit tests on main,
// yet its thresholds, cumulative counts, and virtual OR-group logic must stay
// in sync with kubestellar/console web/src/lib/acmm/scannableIdsByLevel.ts.
// A silent drift (renamed criterion id, off-by-one in SCANNABLE_PER_LEVEL,
// wrong threshold) would misclassify every project on the leaderboard.
// These tests pin the observable contract so drift shows up in CI.
// ---------------------------------------------------------------------------

describe('LEVELS metadata', () => {
  it('defines an entry for every level 0..6', () => {
    for (let n = 0; n <= 6; n++) {
      expect(LEVELS[n]).toBeDefined()
      expect(typeof LEVELS[n].emoji).toBe('string')
      expect(LEVELS[n].emoji.length).toBeGreaterThan(0)
      expect(typeof LEVELS[n].name).toBe('string')
      expect(LEVELS[n].name.length).toBeGreaterThan(0)
      expect(typeof LEVELS[n].description).toBe('string')
      expect(LEVELS[n].bg).toMatch(/^bg-/)
      expect(LEVELS[n].text).toMatch(/^text-/)
      expect(LEVELS[n].border).toMatch(/^border-/)
    }
  })

  it('MIN_LEVEL and MAX_LEVEL match the exported bounds', () => {
    expect(MIN_LEVEL).toBe(1)
    expect(MAX_LEVEL).toBe(6)
  })

  it('level names are unique', () => {
    const names = Object.values(LEVELS).map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('CUMULATIVE_SCANNABLE', () => {
  it('is monotonically non-decreasing across levels 0..6', () => {
    let prev = -1
    for (let n = 0; n <= 6; n++) {
      const v = CUMULATIVE_SCANNABLE[n]
      expect(typeof v).toBe('number')
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('reaches TOTAL_SCANNABLE at the top level', () => {
    expect(CUMULATIVE_SCANNABLE[MAX_LEVEL]).toBe(TOTAL_SCANNABLE)
  })

  it('has a non-zero L0 baseline (prerequisite criteria)', () => {
    expect(CUMULATIVE_SCANNABLE[0]).toBeGreaterThan(0)
  })

  it('TOTAL_SCANNABLE does not exceed TOTAL_CRITERIA', () => {
    // Some criteria are OR-grouped; scannable count is always <= raw count.
    expect(TOTAL_SCANNABLE).toBeLessThanOrEqual(TOTAL_CRITERIA)
    expect(TOTAL_CRITERIA).toBeGreaterThan(0)
  })
})

describe('levelFromScore', () => {
  it('returns 0 for a score of 0', () => {
    expect(levelFromScore(0)).toBe(0)
  })

  it('returns 1 for any positive score below the L0 cumulative', () => {
    // Anything > 0 but below CUMULATIVE_SCANNABLE[0] cannot satisfy any tier
    // threshold, so the function short-circuits to L1.
    for (let s = 1; s < CUMULATIVE_SCANNABLE[0]; s++) {
      expect(levelFromScore(s)).toBe(1)
    }
  })

  it('returns MAX_LEVEL for scores at or above TOTAL_SCANNABLE', () => {
    expect(levelFromScore(TOTAL_SCANNABLE)).toBe(MAX_LEVEL)
    expect(levelFromScore(TOTAL_SCANNABLE + 100)).toBe(MAX_LEVEL)
  })

  it('returns the highest level whose cumulative threshold is met', () => {
    // For each level from 2..6, a score equal to that level's cumulative
    // should classify at that level (nothing higher is met).
    for (let n = 2; n <= MAX_LEVEL; n++) {
      const cumul = CUMULATIVE_SCANNABLE[n]
      expect(levelFromScore(cumul)).toBe(n)
    }
  })

  it('does not skip forward when a score is one short of the next level', () => {
    for (let n = 2; n < MAX_LEVEL; n++) {
      const nextCumul = CUMULATIVE_SCANNABLE[n + 1]
      const currCumul = CUMULATIVE_SCANNABLE[n]
      if (nextCumul <= currCumul) continue
      expect(levelFromScore(nextCumul - 1)).toBe(n)
    }
  })
})

describe('levelFromDetectedIds', () => {
  it('returns MIN_LEVEL when no criteria are detected', () => {
    expect(levelFromDetectedIds([])).toBe(MIN_LEVEL)
  })

  it('promotes to L2 via any single agent-instruction OR-group member', () => {
    // Each of the four instruction files should independently satisfy the L2
    // virtual OR-group under the 1/N threshold rule (met=1, N=3, 1/3 >= 1/3).
    for (const id of [
      'acmm:claude-md',
      'acmm:copilot-instructions',
      'acmm:agents-md',
      'acmm:cursor-rules',
    ]) {
      expect(levelFromDetectedIds([id])).toBe(2)
    }
  })

  it('accepts the pre-synthesised virtual agent-instructions id directly', () => {
    expect(levelFromDetectedIds(['acmm:agent-instructions'])).toBe(2)
  })

  it('does not promote past L2 when L3 criteria are absent', () => {
    expect(levelFromDetectedIds(['acmm:claude-md'])).toBe(2)
  })

  it('promotes to L3 only once >=70% of L3 criteria are met', () => {
    // L3 has 4 criteria; 70% => need at least 3.
    const l2 = ['acmm:agent-instructions']
    const l3ids = [
      'acmm:pr-acceptance-metric',
      'acmm:pr-review-rubric',
      'acmm:quality-dashboard',
      'acmm:ci-matrix',
    ]
    // 2/4 = 50% is below threshold -> stays at L2
    expect(levelFromDetectedIds([...l2, l3ids[0], l3ids[1]])).toBe(2)
    // 3/4 = 75% meets threshold -> L3
    expect(levelFromDetectedIds([...l2, l3ids[0], l3ids[1], l3ids[2]])).toBe(3)
  })

  it('breaks (does not skip) at the first level that fails the threshold', () => {
    // Meeting all of L2 and L4 but not L3 must NOT jump to L4; the walk breaks
    // at L3 and returns L2. This guards against a future refactor that iterates
    // levels independently instead of walking them in order.
    const detected = [
      'acmm:agent-instructions',
      // Skip L3 entirely
      // Meet all of L4
      'acmm:auto-qa-tuning',
      'acmm:nightly-compliance',
      'acmm:copilot-review-apply',
      'acmm:auto-label',
      'acmm:ai-fix-workflow',
      'acmm:tier-classifier',
      'acmm:security-ai-md',
    ]
    expect(levelFromDetectedIds(detected)).toBe(2)
  })

  it('promotes to MAX_LEVEL when every L2..L6 criterion is detected', () => {
    const all = [
      // L2
      'acmm:agent-instructions',
      'acmm:prompts-catalog',
      'acmm:editor-config',
      // L3
      'acmm:pr-acceptance-metric',
      'acmm:pr-review-rubric',
      'acmm:quality-dashboard',
      'acmm:ci-matrix',
      // L4
      'acmm:auto-qa-tuning',
      'acmm:nightly-compliance',
      'acmm:copilot-review-apply',
      'acmm:auto-label',
      'acmm:ai-fix-workflow',
      'acmm:tier-classifier',
      'acmm:security-ai-md',
      // L5
      'acmm:github-actions-ai',
      'acmm:auto-qa-self-tuning',
      'acmm:public-metrics',
      'acmm:policy-as-code',
      'acmm:reflection-log',
      'acmm:audit-trail',
      // L6
      'acmm:auto-issue-gen',
      'acmm:multi-agent-orchestration',
      'acmm:merge-queue',
      'acmm:strategic-dashboard',
      'acmm:risk-assessment-config',
      'acmm:observability-runbook',
    ]
    expect(levelFromDetectedIds(all)).toBe(MAX_LEVEL)
  })

  it('ignores unrelated / unknown criterion ids', () => {
    // Random unknown ids must not raise, must not promote past L1.
    expect(levelFromDetectedIds(['acmm:not-a-real-id', 'foo', ''])).toBe(MIN_LEVEL)
  })

  it('tolerates duplicate ids in the input array', () => {
    // The function normalises via Set(); duplicates must not double-count.
    expect(
      levelFromDetectedIds(['acmm:claude-md', 'acmm:claude-md', 'acmm:claude-md']),
    ).toBe(2)
  })
})
