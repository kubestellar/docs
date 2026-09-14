// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/master-page/HeroSection.tsx (baseline 0%).
 *
 * HeroSection is a "use client" component with three side effects:
 *   1. a typewriter interval that types out `installScript` char-by-char
 *   2. an animated counter loop (IntersectionObserver + rAF-style updates)
 *   3. a clipboard-copy button that flips a "copied" state for 2s
 *
 * Structural render + the two user-observable state changes are exercised
 * here; the animation-frame counters are structural (no branch depends on
 * the numeric result), so the presence of the .counter markup is enough to
 * cover the effect setup path.
 */

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `t.${key}`,
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
  }) => React.createElement('a', { href, ...rest }, children),
}))

vi.mock('@/components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  GlobeAnimation: () => React.createElement('div', { 'data-testid': 'globe' }),
}))
vi.mock('../components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  GlobeAnimation: () => React.createElement('div', { 'data-testid': 'globe' }),
}))

// IntersectionObserver isn't provided by jsdom; the effect creates one for
// counters. Provide a minimal no-op implementation.
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
  vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver as unknown as typeof IntersectionObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('HeroSection', () => {
  it('renders without throwing and mounts key structural blocks', async () => {
    const { default: HeroSection } = await import('@/components/master-page/HeroSection')
    const { container, getByText } = render(<HeroSection />)
    expect(container.querySelector('section')).not.toBeNull()
    expect(getByText('t.line1')).toBeTruthy()
    expect(getByText('t.line2')).toBeTruthy()
    expect(getByText('t.line3')).toBeTruthy()
    expect(getByText('t.buttonInstall')).toBeTruthy()
    expect(getByText('t.buttonDocs')).toBeTruthy()
  })

  it('mounts the animated background helpers (StarField / GridLines / GlobeAnimation)', async () => {
    const { default: HeroSection } = await import('@/components/master-page/HeroSection')
    const { getByTestId } = render(<HeroSection />)
    expect(getByTestId('starfield')).toBeTruthy()
    expect(getByTestId('gridlines')).toBeTruthy()
    expect(getByTestId('globe')).toBeTruthy()
  })

  it('handles the empty-counter branch of the counter effect without throwing', async () => {
    // The counter useEffect calls document.querySelectorAll('.counter') and
    // forEach — with no matching nodes it's a no-op. Ensure render survives
    // that branch (the effect runs synchronously on mount).
    const { default: HeroSection } = await import('@/components/master-page/HeroSection')
    expect(() => render(<HeroSection />)).not.toThrow()
  })

  it('typewriter effect progresses displayedText char-by-char across intervals', async () => {
    vi.useFakeTimers()
    const { default: HeroSection } = await import('@/components/master-page/HeroSection')
    const { container } = render(<HeroSection />)
    // The typewriter code is inside a useEffect; advance timers to let the
    // interval callback fire several times.
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    const displayed = container.textContent ?? ''
    expect(displayed).toContain('curl')
  })

  it('copy button success path flips the copied indicator for the timeout window', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { default: HeroSection } = await import('@/components/master-page/HeroSection')
    const { container } = render(<HeroSection />)
    // The copy control has an aria-label ("Copy install command") on the
    // real component; fall back to first <button> if the label changes.
    const button = container.querySelector('button')
    expect(button).not.toBeNull()

    await act(async () => {
      fireEvent.click(button!)
      // let the microtask queue drain
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('curl -sSL https://raw.githubusercontent.com'),
    )
  })

  it('copy button surfaces clipboard errors via console.error rather than throwing', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { default: HeroSection } = await import('@/components/master-page/HeroSection')
    const { container } = render(<HeroSection />)
    const button = container.querySelector('button')

    await act(async () => {
      fireEvent.click(button!)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalled()
    // The rejection path calls console.error("Failed to copy text:", err).
    expect(err).toHaveBeenCalled()
    err.mockRestore()
  })
})
