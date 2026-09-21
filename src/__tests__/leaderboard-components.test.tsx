// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/app/[locale]/leaderboard/components.tsx (baseline 0%,
 * see docs#7035). These are the shared presentational sub-components used
 * by the leaderboard table: RankDisplay, LevelBadge, BreakdownPills,
 * ActivitySparkline and SocialBadge. All take plain props, so plain RTL
 * renders exercise every branch without extra mocking.
 */

import {
  ActivitySparkline,
  BreakdownPills,
  LevelBadge,
  RankDisplay,
  SocialBadge,
} from '../app/[locale]/leaderboard/components'
import type { LeaderboardBreakdown } from '../app/[locale]/leaderboard/types'

function breakdown(overrides: Partial<LeaderboardBreakdown> = {}): LeaderboardBreakdown {
  return {
    bug_issues: 0,
    feature_issues: 0,
    other_issues: 0,
    prs_opened: 0,
    prs_merged: 0,
    ...overrides,
  }
}

describe('RankDisplay', () => {
  it('renders the gold medal for rank 1', () => {
    render(<RankDisplay rank={1} />)
    expect(screen.getByTitle('1st place').textContent).toBe('🥇')
  })

  it('renders the silver medal for rank 2', () => {
    render(<RankDisplay rank={2} />)
    expect(screen.getByTitle('2nd place').textContent).toBe('🥈')
  })

  it('renders the bronze medal for rank 3', () => {
    render(<RankDisplay rank={3} />)
    expect(screen.getByTitle('3rd place').textContent).toBe('🥉')
  })

  it('renders a plain rank number for rank 4+', () => {
    render(<RankDisplay rank={42} />)
    expect(screen.getByText('#42')).toBeTruthy()
  })
})

describe('LevelBadge', () => {
  it('renders the styled badge for a known level', () => {
    render(<LevelBadge level="Legend" />)
    const badge = screen.getByText('Legend')
    expect(badge.className).toContain('text-yellow-300')
    expect(badge.className).toContain('border-yellow-400/50')
  })

  it('falls back to the Observer style for an unknown level', () => {
    render(<LevelBadge level="NotARealLevel" />)
    const badge = screen.getByText('NotARealLevel')
    expect(badge.className).toContain('text-gray-400')
    expect(badge.className).toContain('border-gray-500/30')
  })
})

describe('BreakdownPills', () => {
  it('renders nothing when every count is zero', () => {
    const { container } = render(<BreakdownPills breakdown={breakdown()} />)
    expect(container.firstChild).toBeNull()
  })

  it('pluralizes each pill label based on count', () => {
    render(
      <BreakdownPills
        breakdown={breakdown({
          prs_merged: 3,
          prs_opened: 1,
          bug_issues: 1,
          feature_issues: 2,
          other_issues: 5,
        })}
      />
    )
    expect(screen.getByText('3 Merged')).toBeTruthy()
    expect(screen.getByText('1 PR')).toBeTruthy()
    expect(screen.getByText('1 Bug')).toBeTruthy()
    expect(screen.getByText('2 Features')).toBeTruthy()
    expect(screen.getByText('5 Others')).toBeTruthy()
  })

  it('uses the plural form when a count is not exactly one', () => {
    render(<BreakdownPills breakdown={breakdown({ prs_opened: 2, bug_issues: 4 })} />)
    expect(screen.getByText('2 PRs')).toBeTruthy()
    expect(screen.getByText('4 Bugs')).toBeTruthy()
  })
})

describe('ActivitySparkline', () => {
  it('renders a placeholder dash when data is empty', () => {
    render(<ActivitySparkline data={[]} />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders a placeholder dash when data is undefined', () => {
    // @ts-expect-error exercising the falsy-data guard clause explicitly
    render(<ActivitySparkline data={undefined} />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders one bar per data point with week labels in the title', () => {
    const { container } = render(
      <ActivitySparkline data={[0, 3, 6]} weeks={['W1', 'W2', 'W3']} />
    )
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(3)
    expect(rects[0].querySelector('title')?.textContent).toBe('W1: 0 contributions')
    expect(rects[1].querySelector('title')?.textContent).toBe('W2: 3 contributions')
  })

  it('falls back to generic "Week N" labels when weeks is not provided', () => {
    const { container } = render(<ActivitySparkline data={[1, 2]} />)
    const rects = container.querySelectorAll('rect')
    expect(rects[0].querySelector('title')?.textContent).toBe('Week 1: 1 contributions')
  })
})

describe('SocialBadge', () => {
  it('renders a loading placeholder', () => {
    const { container } = render(<SocialBadge data={undefined} loading={true} />)
    expect(container.querySelector('[title="Loading social data…"]')).toBeTruthy()
  })

  it('renders a dash when there is no affiliate data', () => {
    render(<SocialBadge data={undefined} loading={false} />)
    expect(screen.getByTitle('No affiliate clicks yet')).toBeTruthy()
  })

  it('renders a dash when clicks is zero', () => {
    render(
      <SocialBadge
        data={{ clicks: 0, unique_users: 0, utm_term: 'x' }}
        loading={false}
      />
    )
    expect(screen.getByTitle('No affiliate clicks yet')).toBeTruthy()
  })

  it('renders the click count and tooltip when there is affiliate data', () => {
    render(
      <SocialBadge
        data={{ clicks: 12, unique_users: 7, utm_term: 'linkedin' }}
        loading={false}
      />
    )
    expect(screen.getByText('12')).toBeTruthy()
    expect(
      screen.getByTitle('12 clicks from 7 unique users via affiliate link')
    ).toBeTruthy()
  })
})
