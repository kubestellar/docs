// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for the presentational sub-components under
 * src/app/[locale]/leaderboard/[username]/components/** (baseline 0%,
 * see docs#7035): HeatmapCell, TopicBar, SuggestionCard, TimelineSparkline
 * and ContributionRadarChart. Each takes plain data props, so RTL renders
 * exercise their branches (empty/zero data, expand/collapse, unknown repo
 * color fallback) directly.
 */

import { HeatmapCell } from '../app/[locale]/leaderboard/[username]/components/HeatmapCell'
import { SuggestionCard } from '../app/[locale]/leaderboard/[username]/components/SuggestionCard'
import { TimelineSparkline } from '../app/[locale]/leaderboard/[username]/components/TimelineSparkline'
import { TopicBar } from '../app/[locale]/leaderboard/[username]/components/TopicBar'
import { ContributionRadarChart } from '../app/[locale]/leaderboard/[username]/components/ContributionRadarChart'
import type { Suggestion, TopicCluster } from '../app/[locale]/leaderboard/[username]/types'

afterEach(() => cleanup())

describe('HeatmapCell', () => {
  it('renders the value/label tooltip and a proportional opacity', () => {
    const { container } = render(<HeatmapCell value={5} max={10} label="Mon" />)
    expect(screen.getByText('Mon')).toBeTruthy()
    const wrapper = container.querySelector('[title="Mon: 5 issues"]') as HTMLElement
    const cell = wrapper.firstElementChild as HTMLElement
    expect(cell.style.backgroundColor).toBe('rgba(59, 130, 246, 0.5)')
  })

  it('clamps to the minimum opacity when max is 0', () => {
    const { container } = render(<HeatmapCell value={0} max={0} label="Sun" />)
    const wrapper = container.querySelector('[title="Sun: 0 issues"]') as HTMLElement
    const cell = wrapper.firstElementChild as HTMLElement
    expect(cell.style.backgroundColor).toBe('rgba(59, 130, 246, 0.05)')
  })
})

describe('SuggestionCard', () => {
  const suggestion: Suggestion = {
    title: 'Fix flaky test',
    url: 'https://github.com/kubestellar/docs/issues/1',
    repo: 'docs',
    topic_match: 'testing',
  }

  it('renders the title, repo badge color and topic match', () => {
    render(<SuggestionCard suggestion={suggestion} />)
    expect(screen.getByText('Fix flaky test')).toBeTruthy()
    const repoBadge = screen.getByText('docs')
    expect(repoBadge.className).toContain('text-green-400')
    expect(screen.getByText('testing')).toBeTruthy()
    expect(screen.getByRole('link')).toHaveProperty('href', suggestion.url)
  })

  it('falls back to the default badge color for an unknown repo', () => {
    render(<SuggestionCard suggestion={{ ...suggestion, repo: 'unknown-repo' }} />)
    const repoBadge = screen.getByText('unknown-repo')
    expect(repoBadge.className).toContain('text-gray-400')
  })
})

describe('TimelineSparkline', () => {
  it('renders one bar per timeline entry with a proportional height', () => {
    const { container } = render(
      <TimelineSparkline
        timeline={[
          { month: '2026-01', issue_count: 0 },
          { month: '2026-02', issue_count: 4 },
        ]}
      />
    )
    const bars = container.querySelectorAll('[title$="issues"]')
    expect(bars.length).toBe(2)
    expect(bars[0].getAttribute('title')).toBe('2026-01: 0 issues')
    // Zero-count month still renders the minimum visible height.
    const zeroBar = bars[0].querySelector('div') as HTMLElement
    expect(zeroBar.style.height).toBe('2px')
    const fullBar = bars[1].querySelector('div') as HTMLElement
    expect(fullBar.style.height).toBe('48px')
  })
})

function topic(overrides: Partial<TopicCluster> = {}): TopicCluster {
  return {
    name: 'Testing',
    issue_count: 10,
    recent_issue: {
      title: 'Add coverage',
      url: 'https://github.com/kubestellar/docs/issues/2',
      created_at: '2026-01-15T00:00:00Z',
    },
    repos: ['docs'],
    open_count: 4,
    closed_count: 6,
    ...overrides,
  }
}

describe('TopicBar', () => {
  it('renders the topic name, repo badges and closed/open counts collapsed', () => {
    render(<TopicBar topic={topic()} maxCount={10} />)
    expect(screen.getByText('Testing')).toBeTruthy()
    expect(screen.getByText('6 closed')).toBeTruthy()
    expect(screen.getByText('4 open')).toBeTruthy()
    // Recent-issue detail panel is not shown until expanded.
    expect(screen.queryByText('Add coverage')).toBeNull()
  })

  it('expands to show the most recent issue on click, and collapses again', () => {
    render(<TopicBar topic={topic()} maxCount={10} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Add coverage')).toBeTruthy()
    fireEvent.click(button)
    expect(screen.queryByText('Add coverage')).toBeNull()
  })

  it('handles a zero maxCount and zero issue_count without dividing by zero', () => {
    render(
      <TopicBar
        topic={topic({ issue_count: 0, open_count: 0, closed_count: 0 })}
        maxCount={0}
      />
    )
    expect(screen.getByText('0 closed')).toBeTruthy()
    expect(screen.getByText('0 open')).toBeTruthy()
  })
})

describe('ContributionRadarChart', () => {
  it('shows the "not enough data" message when all topics are empty', () => {
    render(<ContributionRadarChart topics={[]} />)
    expect(
      screen.getByText('Not enough topic data for contribution mapping')
    ).toBeTruthy()
  })

  it('renders the distribution message and legend once topics have data', () => {
    // "Testing" matches the "test" keyword in RADAR_DIMENSIONS, producing a
    // non-zero score on that axis (see src/lib/radar.ts computeRadarScores).
    render(
      <ContributionRadarChart
        topics={[topic({ name: 'Testing', issue_count: 20 })]}
      />
    )
    expect(
      screen.getByText('Contribution distribution across console domains')
    ).toBeTruthy()
    expect(
      screen.getByRole('img', { name: /Radar chart showing contribution/ })
    ).toBeTruthy()
  })
})
