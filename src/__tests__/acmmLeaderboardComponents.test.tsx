// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

import {
  LevelBadge,
  ScoreBar,
  Sparkline,
  MIN_DATA_POINTS_FOR_SPARKLINE,
} from '@/app/[locale]/acmm-leaderboard/components'
import {
  LEVELS,
  MIN_LEVEL,
  CUMULATIVE_SCANNABLE,
  TOTAL_SCANNABLE,
} from '@/app/[locale]/acmm-leaderboard/scoring'

/**
 * Coverage for src/app/[locale]/acmm-leaderboard/components.tsx (baseline 0%).
 *
 * The file exports three presentational primitives (`LevelBadge`, `ScoreBar`,
 * `Sparkline`) plus a re-export of `RankDisplay`. All rendering is pure — no
 * effects, no client state — so the tests exercise the level-clamping, bar
 * color thresholds and sparkline point/color branches directly.
 */

afterEach(() => cleanup())

describe('LevelBadge', () => {
  it('renders the emoji and Lx label for a valid level', () => {
    const { container } = render(<LevelBadge level={5} />)
    // No unmet-prereqs marker → title attribute and amber marker are absent.
    expect(container.textContent).toContain(LEVELS[5].emoji)
    expect(container.textContent).toContain('L5')
    expect(container.querySelector('span[title]')).toBeNull()
    expect(container.querySelector('[aria-label]')).toBeNull()
  })

  it('clamps L0 up to MIN_LEVEL when displayed', () => {
    const { container } = render(<LevelBadge level={0} />)
    expect(container.textContent).toContain(`L${MIN_LEVEL}`)
    expect(container.textContent).toContain(LEVELS[MIN_LEVEL].emoji)
    // The internal L0 emoji must never be shown as a standalone tier.
    expect(container.textContent).not.toContain(LEVELS[0].emoji)
  })

  it('falls back to MIN_LEVEL metadata when the level key is missing', () => {
    // 99 is not in LEVELS → meta falls back to LEVELS[MIN_LEVEL].
    const { container } = render(<LevelBadge level={99} />)
    expect(container.textContent).toContain(LEVELS[MIN_LEVEL].emoji)
    expect(container.textContent).toContain('L99')
  })

  it('shows the unmet-prereqs marker and title when flagged', () => {
    const { container } = render(<LevelBadge level={3} unmetPrereqs />)
    const badge = container.querySelector('span[title]') as HTMLElement | null
    expect(badge?.getAttribute('title')).toBe('Baseline prerequisites not yet met')
    const marker = container.querySelector('[aria-label="Baseline prerequisites not yet met"]')
    expect(marker?.textContent).toBe('*')
  })
})

describe('ScoreBar', () => {
  const barFill = (container: HTMLElement) =>
    container.querySelector('div.h-full') as HTMLElement

  it('renders score/max using the cumulative max at that level', () => {
    const max = CUMULATIVE_SCANNABLE[3]
    const { container } = render(<ScoreBar score={0} level={3} />)
    expect(container.textContent).toContain(`0/${max}`)
  })

  it('falls back to TOTAL_SCANNABLE when the level max is missing', () => {
    // Level 99 has no CUMULATIVE_SCANNABLE entry → max defaults to TOTAL_SCANNABLE.
    // This also covers the falsy-max branch (`|| TOTAL_SCANNABLE`).
    const { container } = render(<ScoreBar score={10} level={99} />)
    expect(container.textContent).toContain(`10/${TOTAL_SCANNABLE}`)
  })

  it.each([
    // score/max = pct → expected color class
    { score: 0,  denom: 10, cls: 'bg-gray-600'   }, // < 10%
    { score: 2,  denom: 10, cls: 'bg-yellow-500' }, // >= 10%
    { score: 4,  denom: 10, cls: 'bg-blue-500'   }, // >= 30%
    { score: 8,  denom: 10, cls: 'bg-green-500'  }, // >= 60%
  ])('uses $cls at score $score/$denom', ({ score, denom, cls }) => {
    const originalMax = CUMULATIVE_SCANNABLE[3]
    ;(CUMULATIVE_SCANNABLE as Record<number, number>)[3] = denom
    try {
      const { container } = render(<ScoreBar score={score} level={3} />)
      expect(barFill(container).className).toContain(cls)
    } finally {
      ;(CUMULATIVE_SCANNABLE as Record<number, number>)[3] = originalMax
    }
  })

  it('caps the rendered bar width at 100% when score exceeds max', () => {
    const originalMax = CUMULATIVE_SCANNABLE[3]
    ;(CUMULATIVE_SCANNABLE as Record<number, number>)[3] = 10
    try {
      const { container } = render(<ScoreBar score={999} level={3} />)
      expect(barFill(container).style.width).toBe('100%')
    } finally {
      ;(CUMULATIVE_SCANNABLE as Record<number, number>)[3] = originalMax
    }
  })
})

describe('Sparkline', () => {
  it('renders nothing with fewer than MIN_DATA_POINTS_FOR_SPARKLINE values', () => {
    expect(MIN_DATA_POINTS_FOR_SPARKLINE).toBeGreaterThanOrEqual(2)
    const { container } = render(<Sparkline values={[7]} />)
    expect(container.querySelector('svg')).toBeNull()
    // Also cover the empty-array branch.
    const empty = render(<Sparkline values={[]} />)
    expect(empty.container.querySelector('svg')).toBeNull()
  })

  it('colors the polyline green when trending up', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} />)
    const line = container.querySelector('polyline')!
    expect(line.getAttribute('stroke')).toBe('#22c55e')
    // 3 points → "x1,y1 x2,y2 x3,y3" (2 spaces between them).
    expect(line.getAttribute('points')!.split(' ')).toHaveLength(3)
  })

  it('colors the polyline red when trending down', () => {
    const { container } = render(<Sparkline values={[5, 4, 3]} />)
    expect(container.querySelector('polyline')!.getAttribute('stroke')).toBe('#ef4444')
  })

  it('colors the polyline gray when start and end are equal', () => {
    const { container } = render(<Sparkline values={[2, 5, 2]} />)
    expect(container.querySelector('polyline')!.getAttribute('stroke')).toBe('#6b7280')
  })

  it('handles a flat series without dividing by zero', () => {
    const { container } = render(<Sparkline values={[3, 3, 3]} />)
    const points = container.querySelector('polyline')!.getAttribute('points')!
    // All coordinates must be finite numbers; NaN would appear as "NaN,NaN".
    expect(points).not.toContain('NaN')
    expect(container.querySelector('polyline')!.getAttribute('stroke')).toBe('#6b7280')
  })
})
