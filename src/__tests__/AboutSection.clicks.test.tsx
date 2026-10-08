// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for the click handlers on each .feature-card in
 * src/components/master-page/AboutSection.tsx (baseline 38.46% lines /
 * 11.11% functions — AboutSection.render.test.tsx only exercised the
 * render + effect-setup path, never invoked any of the 8 onClick arrow
 * functions attached to the feature cards).
 *
 * Each card either calls router.push(path) or window.open(url, '_blank').
 * This asserts every card's handler fires with its documented target.
 */

const pushMock = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `t.${key}`,
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
  }) => React.createElement('a', { href, ...rest }, children),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))
vi.mock('../components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  root = null
  rootMargin = ''
  thresholds: number[] = []
}

beforeEach(() => {
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    NoopIntersectionObserver
  pushMock.mockClear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// Documented in source order (AboutSection.tsx), card index -> expected action.
const expectedActions = [
  { kind: 'push', target: '/docs/console/ai-integration/ai-features' },
  { kind: 'push', target: '/docs/console/features/dashboards' },
  { kind: 'push', target: '/docs/console/programs/marketplace' },
  { kind: 'open', target: 'https://console.kubestellar.io/from-lens' },
  { kind: 'open', target: 'https://console.kubestellar.io/from-headlamp' },
  { kind: 'open', target: 'https://console.kubestellar.io/from-holmesgpt' },
  { kind: 'push', target: 'docs/news/reviews' },
  { kind: 'open', target: 'https://console.kubestellar.io/white-label' },
] as const

describe('AboutSection feature-card click handlers', () => {
  it('invokes router.push or window.open with the documented target for every card', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const mod = await import('../components/master-page/AboutSection')
    const AboutSection = mod.default
    const { container } = render(<AboutSection />)

    const cards = container.querySelectorAll('.feature-card')
    expect(cards.length).toBe(expectedActions.length)

    cards.forEach((card, i) => {
      const expected = expectedActions[i]
      fireEvent.click(card)
      if (expected.kind === 'push') {
        expect(pushMock).toHaveBeenLastCalledWith(expected.target)
      } else {
        expect(openSpy).toHaveBeenLastCalledWith(expected.target, '_blank')
      }
    })

    expect(pushMock).toHaveBeenCalledTimes(4)
    expect(openSpy).toHaveBeenCalledTimes(4)
  })
})
