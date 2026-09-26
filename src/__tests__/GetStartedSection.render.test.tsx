// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/master-page/GetStartedSection.tsx (baseline 0%).
 *
 * GetStartedSection is a "use client" component with no local state and no
 * effects — just static markup driven by useTranslations plus two `next/link`
 * anchors and a small local Icon subcomponent used in each of the four "path"
 * cards. Structural render is enough to reach the entire component body and
 * exercise the Icon helper on every code path.
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

vi.mock('@/lib/url', () => ({
  getLocalizedUrl: (path: string) => path,
}))

vi.mock('@/components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))
vi.mock('../components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))

afterEach(() => {
  cleanup()
})

describe('GetStartedSection render', () => {
  it('renders without throwing and mounts the section root', async () => {
    const mod = await import('../components/master-page/GetStartedSection')
    const GetStartedSection = mod.default
    const { container } = render(<GetStartedSection />)
    const section = container.querySelector('section#get-started')
    expect(section).not.toBeNull()
  })

  it('mounts the StarField and GridLines background decorations', async () => {
    const mod = await import('../components/master-page/GetStartedSection')
    const GetStartedSection = mod.default
    const { getByTestId } = render(<GetStartedSection />)
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
  })

  it('renders link anchors (Icon subcomponent exercised via card rendering)', async () => {
    const mod = await import('../components/master-page/GetStartedSection')
    const GetStartedSection = mod.default
    const { container } = render(<GetStartedSection />)
    const links = container.querySelectorAll('a[href]')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders at least one svg (Icon helper renders svg path)', async () => {
    const mod = await import('../components/master-page/GetStartedSection')
    const GetStartedSection = mod.default
    const { container } = render(<GetStartedSection />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })
})
