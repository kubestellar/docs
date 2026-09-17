// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/master-page/HowToUseSection.tsx (baseline 0%).
 *
 * HowToUseSection is a "use client" component with state and effects:
 *   1. displayedText state for typing animation
 *   2. copied state for copy-to-clipboard feedback
 *   3. useEffect that animates typing of install script and counters
 *   4. handleCopy for clipboard.writeText() with success state
 * Structural render exercises JSX + effect setup path; jsdom doesn't provide
 * a real clipboard API, so navigator.clipboard.writeText is mocked.
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
  GlobeAnimation: () => React.createElement('div', { 'data-testid': 'globe-animation' }),
}))
vi.mock('../components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  GlobeAnimation: () => React.createElement('div', { 'data-testid': 'globe-animation' }),
}))

beforeEach(() => {
  vi.useFakeTimers()
  ;(navigator.clipboard as any) = {
    writeText: vi.fn().mockResolvedValue(undefined),
  }
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('HowToUseSection render', () => {
  it('renders without throwing and mounts the section root', async () => {
    const mod = await import('../components/master-page/HowToUseSection')
    const HowToUseSection = mod.default
    const { container } = render(<HowToUseSection />)
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
  })

  it('mounts the StarField and GridLines background decorations', async () => {
    const mod = await import('../components/master-page/HowToUseSection')
    const HowToUseSection = mod.default
    const { getByTestId } = render(<HowToUseSection />)
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
  })

  it('mounts the GlobeAnimation component', async () => {
    const mod = await import('../components/master-page/HowToUseSection')
    const HowToUseSection = mod.default
    const { getByTestId } = render(<HowToUseSection />)
    expect(getByTestId('globe-animation')).not.toBeNull()
  })

  it('renders the copy button and install command', async () => {
    const mod = await import('../components/master-page/HowToUseSection')
    const HowToUseSection = mod.default
    const { container } = render(<HowToUseSection />)
    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    const codeElement = container.querySelector('code')
    expect(codeElement).not.toBeNull()
  })

  it('renders navigation links', async () => {
    const mod = await import('../components/master-page/HowToUseSection')
    const HowToUseSection = mod.default
    const { container } = render(<HowToUseSection />)
    const links = container.querySelectorAll('a[href]')
    expect(links.length).toBeGreaterThan(0)
  })
})
