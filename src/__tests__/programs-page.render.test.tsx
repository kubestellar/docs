// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/app/[locale]/programs/page.tsx (baseline 0%).
 *
 * ProgramsPage is a "use client" component that:
 *   - reads the program list via getAllPrograms()
 *   - iterates programs with .map(), rendering a card per entry with an
 *     Image and a paid/unpaid pill (two ternary branches)
 *   - installs and later removes an inline <style> element via useEffect
 *
 * A structural render exercises the entire component body, both ternary
 * branches (isPaid true and false), and the effect cleanup path.
 */

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `t.${key}`,
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement('img', { alt, src }),
}))

vi.mock('@/components', () => ({
  Navbar: () => React.createElement('nav', { 'data-testid': 'navbar' }),
  Footer: () => React.createElement('footer', { 'data-testid': 'footer' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => React.createElement('a', { href, className }, children),
}))

vi.mock('../app/[locale]/programs/programs', () => ({
  getAllPrograms: () => [
    {
      id: 'paid-one',
      name: 'PaidOne',
      fullName: 'Paid Program One',
      description: 'paid description',
      logo: '/paid.png',
      isPaid: true,
      theme: {
        gradient: '',
        primaryColor: '',
        secondaryColor: '',
        floatingShapes: [],
      },
      sections: {
        benefits: '',
        description: '',
        overview: '',
        eligibility: '',
        timeline: '',
        structure: '',
        howToApply: '',
        resources: [],
      },
    },
    {
      id: 'unpaid-one',
      name: 'UnpaidOne',
      fullName: 'Unpaid Program One',
      description: 'unpaid description',
      logo: '/unpaid.png',
      isPaid: false,
      theme: {
        gradient: '',
        primaryColor: '',
        secondaryColor: '',
        floatingShapes: [],
      },
      sections: {
        benefits: '',
        description: '',
        overview: '',
        eligibility: '',
        timeline: '',
        structure: '',
        howToApply: '',
        resources: [],
      },
    },
  ],
}))

afterEach(() => {
  cleanup()
})

describe('ProgramsPage render', () => {
  it('renders navbar, footer, starfield, and gridlines decorations', async () => {
    const mod = await import('../app/[locale]/programs/page')
    const ProgramsPage = mod.default
    const { getByTestId } = render(<ProgramsPage />)
    expect(getByTestId('navbar')).not.toBeNull()
    expect(getByTestId('footer')).not.toBeNull()
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
  })

  it('renders a link card per program with correct href', async () => {
    const mod = await import('../app/[locale]/programs/page')
    const ProgramsPage = mod.default
    const { container } = render(<ProgramsPage />)
    const paid = container.querySelector('a[href="/programs/paid-one"]')
    const unpaid = container.querySelector('a[href="/programs/unpaid-one"]')
    expect(paid).not.toBeNull()
    expect(unpaid).not.toBeNull()
  })

  it('exercises both isPaid ternary branches (paid vs unpaid pill styling)', async () => {
    const mod = await import('../app/[locale]/programs/page')
    const ProgramsPage = mod.default
    const { container } = render(<ProgramsPage />)
    // Paid card link carries the blue hover-border class from the true branch;
    // unpaid carries the purple hover-border class from the false branch.
    const paid = container.querySelector('a[href="/programs/paid-one"]')
    const unpaid = container.querySelector('a[href="/programs/unpaid-one"]')
    expect(paid?.className).toMatch(/hover:border-blue-500/)
    expect(unpaid?.className).toMatch(/hover:border-purple-500/)
    // Pill text also branches: t.paid vs t.unpaid.
    expect(paid?.textContent).toContain('t.paid')
    expect(unpaid?.textContent).toContain('t.unpaid')
  })

  it('installs a style element on mount and removes it on unmount (useEffect cleanup)', async () => {
    const mod = await import('../app/[locale]/programs/page')
    const ProgramsPage = mod.default
    const beforeCount = document.head.querySelectorAll('style').length
    const { unmount } = render(<ProgramsPage />)
    const mountedCount = document.head.querySelectorAll('style').length
    expect(mountedCount).toBeGreaterThan(beforeCount)
    unmount()
    const afterCount = document.head.querySelectorAll('style').length
    expect(afterCount).toBe(beforeCount)
  })
})
