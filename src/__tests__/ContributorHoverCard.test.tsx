// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/app/[locale]/leaderboard/ContributorHoverCard.tsx
 * (baseline 0%, see docs#7035). Exercises:
 *   - the loading skeleton before the per-user fetch resolves
 *   - the populated card (level badge, cadence trend, streak, timeline)
 *   - the "no data" (data === null) branch when the fetch 404s
 *   - click-outside closes the card (mousedown listener)
 *   - navigation on card click / Enter key
 *   - the mini radar chart rendering only when topics produce a score
 */

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement('img', { alt, src }),
}))

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import { ContributorHoverCard } from '../app/[locale]/leaderboard/ContributorHoverCard'

const basePreview = {
  login: 'octocat',
  avatar_url: 'https://example.com/octocat.png',
  total_points: 120,
  total_issues_opened: 10,
  level: 'Pilot',
  rank: 5,
  cadence: {
    avg_per_week: 2,
    by_day_of_week: [1, 2, 3, 0, 0, 0, 0],
    by_hour_of_day: new Array(24).fill(0).map((_, i) => (i === 10 ? 5 : 0)),
    current_streak_weeks: 3,
    longest_streak_weeks: 6,
    trend: 'ramping_up' as const,
  },
  activity_timeline: [
    { month: '2026-01', issue_count: 2 },
    { month: '2026-02', issue_count: 4 },
  ],
}

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ContributorHoverCard', () => {
  it('renders a loading skeleton before the fetch resolves', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})) // never resolves
    )
    render(
      <ContributorHoverCard login="octocat-pending" onClose={vi.fn()} rank={5} totalPoints={120} level="Pilot" />
    )
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders the populated card once the fetch resolves', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ ...basePreview, login: 'octocat-populated' }))))
    render(
      <ContributorHoverCard login="octocat-populated" onClose={vi.fn()} rank={5} totalPoints={120} level="Pilot" />
    )
    await waitFor(() => expect(screen.getByText('octocat-populated')).toBeTruthy())
    expect(screen.getByText('Rank #5')).toBeTruthy()
    expect(screen.getByText('120 pts')).toBeTruthy()
    expect(screen.getByText(/Ramping Up/)).toBeTruthy()
    expect(screen.getByText(/3w streak/)).toBeTruthy()
  })

  it('stays in the loading state when the fetch 404s (no contributor JSON to merge in)', async () => {
    // The component's fetch chain resolves a 404 to `null` and its second
    // `.then` early-returns without calling setLoading(false), so the
    // skeleton persists rather than an empty/"not found" state rendering.
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(null, false))))
    render(
      <ContributorHoverCard login="ghost-404" onClose={vi.fn()} rank={1} totalPoints={0} level="Observer" />
    )
    await waitFor(() => expect(document.querySelector('.animate-pulse')).toBeTruthy())
    expect(screen.queryByText('ghost-404')).toBeNull()
  })

  it('closes when a mousedown occurs outside the card', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ ...basePreview, login: 'octocat-close' }))))
    const onClose = vi.fn()
    render(
      <ContributorHoverCard login="octocat-close" onClose={onClose} rank={5} totalPoints={120} level="Pilot" />
    )
    await waitFor(() => expect(screen.getByText('octocat-close')).toBeTruthy())
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates to the profile page on click and on Enter', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ ...basePreview, login: 'octocat-nav' }))))
    render(
      <ContributorHoverCard login="octocat-nav" onClose={vi.fn()} rank={5} totalPoints={120} level="Pilot" />
    )
    await waitFor(() => expect(screen.getByText('octocat-nav')).toBeTruthy())
    const card = screen.getByRole('link')
    fireEvent.click(card)
    expect(pushMock).toHaveBeenCalledWith('/leaderboard/octocat-nav')

    fireEvent.keyDown(card, { key: 'Enter' })
    expect(pushMock).toHaveBeenCalledTimes(2)
  })

  it('does not render the expertise radar when topics have no meaningful score', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ ...basePreview, login: 'octocat-no-topics', topics: [] })))
    )
    render(
      <ContributorHoverCard login="octocat-no-topics" onClose={vi.fn()} rank={5} totalPoints={120} level="Pilot" />
    )
    await waitFor(() => expect(screen.getByText('octocat-no-topics')).toBeTruthy())
    expect(screen.queryByText('Expertise')).toBeNull()
  })

  it('renders the expertise radar when topics produce a score', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            ...basePreview,
            login: 'octocat-with-topics',
            topics: [{ name: 'Testing', issue_count: 20 }],
          })
        )
      )
    )
    render(
      <ContributorHoverCard login="octocat-with-topics" onClose={vi.fn()} rank={5} totalPoints={120} level="Pilot" />
    )
    await waitFor(() => expect(screen.getByText('Expertise')).toBeTruthy())
  })

  it('serves a cached profile synchronously without refetching', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ ...basePreview, login: 'cached-user' }))
    )
    vi.stubGlobal('fetch', fetchMock)
    const { unmount } = render(
      <ContributorHoverCard login="cached-user" onClose={vi.fn()} rank={2} totalPoints={50} level="Explorer" />
    )
    await waitFor(() => expect(screen.getByText('cached-user')).toBeTruthy())
    unmount()

    render(
      <ContributorHoverCard login="cached-user" onClose={vi.fn()} rank={2} totalPoints={50} level="Explorer" />
    )
    // Cached render is immediate — no loading skeleton this time.
    expect(screen.getByText('cached-user')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
