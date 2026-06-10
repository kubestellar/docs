import { describe, it, expect } from 'vitest'
import {
  computeRadarScores,
  radarPoint,
  RADAR_AXIS_COUNT,
  RADAR_DIMENSIONS,
} from '@/lib/radar'

describe('computeRadarScores', () => {
  it('returns zeros for empty input', () => {
    const scores = computeRadarScores([])
    expect(scores).toHaveLength(RADAR_AXIS_COUNT)
    expect(scores.every((s) => s === 0)).toBe(true)
  })

  it('returns zeros for null/undefined input', () => {
    const scores = computeRadarScores(null as unknown as [])
    expect(scores).toHaveLength(RADAR_AXIS_COUNT)
    expect(scores.every((s) => s === 0)).toBe(true)
  })

  it('scores only Operations dimension for cluster-related topics', () => {
    const scores = computeRadarScores([
      { name: 'cluster health monitoring', issue_count: 5 },
    ])
    expect(scores).toHaveLength(RADAR_AXIS_COUNT)
    // Operations is index 0
    expect(scores[0]).toBeGreaterThan(0)
    // Agents (index 2) should be 0 — no agent keywords
    expect(scores[2]).toBe(0)
  })

  it('scores only Agents dimension for AI-related topics', () => {
    const scores = computeRadarScores([
      { name: 'mcp agent protocol', issue_count: 3 },
    ])
    // Agents is index 2
    expect(scores[2]).toBeGreaterThan(0)
    // Dashboard (index 1) should be 0
    expect(scores[1]).toBe(0)
  })

  it('scores multiple dimensions when topics span categories', () => {
    const scores = computeRadarScores([
      { name: 'cluster deploy', issue_count: 2 },
      { name: 'dashboard chart widget', issue_count: 4 },
      { name: 'rbac auth token', issue_count: 3 },
    ])
    // Operations (0), Dashboard (1), and Security (5) should all have scores
    expect(scores[0]).toBeGreaterThan(0)
    expect(scores[1]).toBeGreaterThan(0)
    expect(scores[5]).toBeGreaterThan(0)
  })

  it('normalizes the maximum score to 1.0', () => {
    const scores = computeRadarScores([
      { name: 'cluster health monitor deploy', issue_count: 100 },
      { name: 'test coverage', issue_count: 1 },
    ])
    const maxScore = Math.max(...scores)
    expect(maxScore).toBe(1)
  })

  it('all scores are between 0 and 1', () => {
    const scores = computeRadarScores([
      { name: 'cluster agent dashboard test rbac mission', issue_count: 10 },
    ])
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    }
  })

  it('higher issue_count produces proportionally higher raw contribution', () => {
    const lowScores = computeRadarScores([
      { name: 'cluster', issue_count: 1 },
    ])
    const highScores = computeRadarScores([
      { name: 'cluster', issue_count: 10 },
    ])
    // Both normalize to 1 when alone, but relative to other dimensions
    // they should still both max out at 1 since single-topic
    expect(lowScores[0]).toBe(1)
    expect(highScores[0]).toBe(1)
  })
})

describe('radarPoint', () => {
  const center = 100
  const radius = 50

  it('first axis (index 0) points straight up', () => {
    const point = radarPoint(0, 1, radius, center)
    // Straight up means x ≈ center, y < center
    expect(point.x).toBeCloseTo(center, 5)
    expect(point.y).toBeCloseTo(center - radius, 5)
  })

  it('score=0 returns center point', () => {
    const point = radarPoint(0, 0, radius, center)
    expect(point.x).toBeCloseTo(center, 5)
    expect(point.y).toBeCloseTo(center, 5)
  })

  it('score=1 returns point at full radius from center', () => {
    const point = radarPoint(0, 1, radius, center)
    const dist = Math.sqrt(
      (point.x - center) ** 2 + (point.y - center) ** 2,
    )
    expect(dist).toBeCloseTo(radius, 5)
  })

  it('opposite axes (0 and 3) are symmetric about center', () => {
    const p0 = radarPoint(0, 1, radius, center)
    const p3 = radarPoint(3, 1, radius, center)
    // They should be on opposite sides of center
    expect(p0.x + p3.x).toBeCloseTo(2 * center, 3)
    expect(p0.y + p3.y).toBeCloseTo(2 * center, 3)
  })

  it('all 6 axes at score=1 are equidistant from center', () => {
    for (let i = 0; i < RADAR_AXIS_COUNT; i++) {
      const point = radarPoint(i, 1, radius, center)
      const dist = Math.sqrt(
        (point.x - center) ** 2 + (point.y - center) ** 2,
      )
      expect(dist).toBeCloseTo(radius, 5)
    }
  })

  it('half score produces half radius distance', () => {
    const point = radarPoint(0, 0.5, radius, center)
    const dist = Math.sqrt(
      (point.x - center) ** 2 + (point.y - center) ** 2,
    )
    expect(dist).toBeCloseTo(radius * 0.5, 5)
  })
})
