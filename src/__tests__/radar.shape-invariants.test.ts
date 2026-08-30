import { describe, it, expect } from 'vitest'
import {
  computeRadarScores,
  RADAR_AXIS_COUNT,
  RADAR_DIMENSIONS,
  RADAR_MIN_DISPLAY_SCORE,
} from '@/lib/radar'

/**
 * Shape invariants for src/lib/radar.ts.
 *
 * radar.test.ts covers computeRadarScores() and radarPoint() behavior on
 * well-formed inputs. It does not lock the shape of RADAR_DIMENSIONS itself,
 * nor the promised output-range clamping behavior of computeRadarScores
 * under adversarial inputs (negative issue_count, huge issue_count).
 *
 * Regressions this suite catches:
 *   - Someone bumps RADAR_AXIS_COUNT (or adds a 7th dimension) without
 *     keeping RADAR_DIMENSIONS.length in lockstep. The chart renders
 *     with a phantom axis or a missing lobe.
 *   - Someone adds a keyword like "GitOps" or "  cluster " — the topic
 *     matcher lowercases input words but not the keyword table, so any
 *     non-lowercase / whitespace-padded keyword is silently dead code.
 *   - Duplicate label ("Operations" twice) or duplicate keyword within
 *     a dimension — silent double-counting.
 *   - computeRadarScores() returning a negative score when a caller
 *     hands it a negative issue_count (upstream data bug); the map()
 *     clamp is the only thing keeping the chart from rendering an
 *     inside-out polygon.
 *   - RADAR_MIN_DISPLAY_SCORE drifting outside [0, 1] or NaN.
 */

describe('RADAR_DIMENSIONS shape', () => {
  it('length equals RADAR_AXIS_COUNT', () => {
    expect(RADAR_DIMENSIONS.length).toBe(RADAR_AXIS_COUNT)
  })

  it('every dimension label is a non-empty string', () => {
    for (const dim of RADAR_DIMENSIONS) {
      expect(typeof dim.label).toBe('string')
      expect(dim.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('dimension labels are unique', () => {
    const labels = RADAR_DIMENSIONS.map((d) => d.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('every dimension has a non-empty keywords array', () => {
    for (const dim of RADAR_DIMENSIONS) {
      expect(Array.isArray(dim.keywords)).toBe(true)
      expect(dim.keywords.length).toBeGreaterThan(0)
    }
  })

  it('every keyword is a non-empty, whitespace-free, lowercase string', () => {
    // The matcher in computeRadarScores() calls topic.name.toLowerCase()
    // but does NOT lowercase the keyword table. A capitalized keyword or
    // one padded with whitespace is silent dead code.
    const offenders: string[] = []
    for (const dim of RADAR_DIMENSIONS) {
      for (const kw of dim.keywords) {
        if (
          typeof kw !== 'string' ||
          kw.length === 0 ||
          kw !== kw.toLowerCase() ||
          /\s/.test(kw)
        ) {
          offenders.push(`${dim.label}: ${JSON.stringify(kw)}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('keywords are unique within each dimension', () => {
    for (const dim of RADAR_DIMENSIONS) {
      const set = new Set(dim.keywords)
      expect(set.size).toBe(dim.keywords.length)
    }
  })
})

describe('RADAR_MIN_DISPLAY_SCORE', () => {
  it('is a finite number strictly between 0 and 1', () => {
    expect(typeof RADAR_MIN_DISPLAY_SCORE).toBe('number')
    expect(Number.isFinite(RADAR_MIN_DISPLAY_SCORE)).toBe(true)
    expect(RADAR_MIN_DISPLAY_SCORE).toBeGreaterThan(0)
    expect(RADAR_MIN_DISPLAY_SCORE).toBeLessThan(1)
  })
})

describe('computeRadarScores — output-range clamping', () => {
  it('clamps negative issue_count contributions to a non-negative score', () => {
    // Upstream data can bring in a negative issue_count via a mis-typed
    // aggregate. Without the Math.max(s / maxScore, 0) clamp in radar.ts,
    // the chart renders an inside-out polygon.
    const scores = computeRadarScores([
      { name: 'cluster deploy monitor', issue_count: -50 },
    ])
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0)
    }
  })

  it('never returns a score greater than 1, even with a very large issue_count', () => {
    const scores = computeRadarScores([
      { name: 'cluster agent dashboard test rbac mission deploy', issue_count: 1_000_000 },
    ])
    for (const s of scores) {
      expect(s).toBeLessThanOrEqual(1)
    }
  })

  it('returns an array of exactly RADAR_AXIS_COUNT entries', () => {
    // Regression guard for a future refactor that changes the loop bounds.
    expect(computeRadarScores([]).length).toBe(RADAR_AXIS_COUNT)
    expect(
      computeRadarScores([{ name: 'x', issue_count: 1 }]).length,
    ).toBe(RADAR_AXIS_COUNT)
    expect(
      computeRadarScores([
        { name: 'a', issue_count: 1 },
        { name: 'b', issue_count: 2 },
      ]).length,
    ).toBe(RADAR_AXIS_COUNT)
  })
})
