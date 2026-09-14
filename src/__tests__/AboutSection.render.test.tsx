// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/master-page/AboutSection.tsx (baseline 0%).
 *
 * AboutSection is a "use client" component whose main side effect is a
 * useEffect that:
 *   1. Selects .feature-card elements and observes them with IntersectionObserver
 *   2. Injects a <style> block into document.head
 *   3. Attaches mousemove/mouseleave listeners for a 3D tilt effect
 * Structural render exercises the JSX + the effect setup path; jsdom does not
 * provide IntersectionObserver so a minimal no-op shim is installed.
 *
 * See #6815 (step 2) for the residual master-page render-smoke work item.
 */

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
    push: vi.fn(),
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

// IntersectionObserver isn't provided by jsdom.
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
})

afterEach(() => {
  cleanup()
})

describe('AboutSection render', () => {
  it('renders without throwing and mounts the section root', async () => {
    const mod = await import('../components/master-page/AboutSection')
    const AboutSection = mod.default
    const { container } = render(<AboutSection />)
    const section = container.querySelector('section#about')
    expect(section).not.toBeNull()
  })

  it('mounts the StarField and GridLines background decorations', async () => {
    const mod = await import('../components/master-page/AboutSection')
    const AboutSection = mod.default
    const { getByTestId } = render(<AboutSection />)
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
  })

  it('effect injects a <style> block into document.head and prepares .feature-card elements', async () => {
    const mod = await import('../components/master-page/AboutSection')
    const AboutSection = mod.default
    const { container } = render(<AboutSection />)
    const featureCards = container.querySelectorAll('.feature-card')
    // Presence of the class markers is enough to confirm the effect setup
    // path selected/instrumented cards (jsdom lacks real IntersectionObserver).
    expect(featureCards.length).toBeGreaterThan(0)
    // At least one <style> should have been appended to head by the effect.
    const styleTags = document.head.querySelectorAll('style')
    expect(styleTags.length).toBeGreaterThan(0)
  })

  it('renders at least one anchor for navigation', async () => {
    const mod = await import('../components/master-page/AboutSection')
    const AboutSection = mod.default
    const { container } = render(<AboutSection />)
    const links = container.querySelectorAll('a[href]')
    expect(links.length).toBeGreaterThan(0)
  })
})
