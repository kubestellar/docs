// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/ComingSoonCTA.tsx.
 *
 * Pure-render CTA section that renders three cards (Documentation via
 * next/link, Quick Installation via @/i18n/navigation Link, Community via a
 * raw <a>) plus a four-link bottom row of IntlLinks. All text comes from
 * next-intl. We assert:
 *   - renders without throwing
 *   - all 15 translation keys under comingSoonPage.* are looked up
 *   - NextLink "/docs" is rendered
 *   - IntlLinks are rendered for /quick-installation, /contribute-handbook,
 *     /ladder, /programs, /partners
 *   - community external link has correct href/target/rel attributes
 */

const lookedUpKeys: string[] = []
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => {
    lookedUpKeys.push(`${ns}.${key}`)
    return `[${ns}.${key}]`
  },
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, 'data-intl-link': 'true', ...rest }, children),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, 'data-next-link': 'true', ...rest }, children),
}))

import ComingSoonCTA from '@/components/ComingSoonCTA'

describe('ComingSoonCTA', () => {
  afterEach(() => {
    cleanup()
    lookedUpKeys.length = 0
  })

  it('renders the section without throwing', () => {
    const { container } = render(<ComingSoonCTA />)
    expect(container.querySelector('section')).toBeTruthy()
  })

  it('looks up every comingSoonPage.cta translation key it uses', () => {
    render(<ComingSoonCTA />)
    const expected = [
      'comingSoonPage.cta.title',
      'comingSoonPage.cta.subtitle',
      'comingSoonPage.cta.documentsButton',
      'comingSoonPage.cta.documentsDescription',
      'comingSoonPage.cta.documentsAction',
      'comingSoonPage.cta.quickStartButton',
      'comingSoonPage.cta.quickStartDescription',
      'comingSoonPage.cta.quickStartAction',
      'comingSoonPage.cta.communityButton',
      'comingSoonPage.cta.communityDescription',
      'comingSoonPage.cta.communityAction',
      'comingSoonPage.cta.handbookButton',
      'comingSoonPage.cta.ladderButton',
      'comingSoonPage.cta.programsButton',
      'comingSoonPage.cta.partnersButton',
    ]
    for (const key of expected) {
      expect(lookedUpKeys, `should look up ${key}`).toContain(key)
    }
  })

  it('renders NextLink to /docs for the Documentation card', () => {
    const { container } = render(<ComingSoonCTA />)
    const link = container.querySelector('a[data-next-link="true"][href="/docs"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.textContent).toBe('[comingSoonPage.cta.documentsAction]')
  })

  it('renders IntlLinks for /quick-installation, /contribute-handbook, /ladder, /programs, /partners', () => {
    const { container } = render(<ComingSoonCTA />)
    for (const href of ['/quick-installation', '/contribute-handbook', '/ladder', '/programs', '/partners']) {
      const link = container.querySelector(`a[data-intl-link="true"][href="${href}"]`)
      expect(link, `IntlLink to ${href} should render`).toBeTruthy()
    }
  })

  it('renders community external link with target=_blank + rel=noopener noreferrer', () => {
    const { container } = render(<ComingSoonCTA />)
    const link = container.querySelector('a[href="https://github.com/kubestellar/kubestellar"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
