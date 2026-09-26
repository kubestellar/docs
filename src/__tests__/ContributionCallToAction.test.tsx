// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/ContributionCallToAction.tsx.
 *
 * A "pure" render component: three cards (GitHub repo, Community Slack,
 * Contribution Guide) plus a two-button hero row (Community Meetings, GitHub
 * Discussions). All text comes from next-intl, one CTA uses IntlLink from
 * @/i18n/navigation, and one link is post-processed by getLocalizedUrl().
 * We assert:
 *   - renders without throwing
 *   - all six translation keys we care about are looked up
 *   - external links have the expected href/target/rel attributes
 *   - getLocalizedUrl is invoked with the Slack URL and its output is used
 *   - the internal handbook link is rendered as an <a> from the IntlLink mock
 */

// t() returns the key so we can assert lookups + verify no missing keys throw.
const lookedUpKeys: string[] = []
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    return (key: string) => {
      lookedUpKeys.push(`${ns}.${key}`)
      return `[${ns}.${key}]`
    }
  },
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, 'data-intl-link': 'true', ...rest }, children),
}))

const getLocalizedUrlMock = vi.fn((u: string) => `${u}?locale=en`)
vi.mock('@/lib/url', () => ({
  getLocalizedUrl: (u: string) => getLocalizedUrlMock(u),
}))

vi.mock('@/components/index', () => ({
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
}))

// The tested file imports from './index' (relative). Also register the specifier
// vitest sees for that path.
vi.mock('../components/index', () => ({
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
}))

import ContributionCallToAction from '@/components/ContributionCallToAction'

describe('ContributionCallToAction', () => {
  afterEach(() => {
    cleanup()
    lookedUpKeys.length = 0
    getLocalizedUrlMock.mockClear()
  })

  it('renders the section with all decorative chrome and does not throw', () => {
    const { container } = render(<ContributionCallToAction />)
    expect(container.querySelector('section')).toBeTruthy()
    expect(container.querySelector('[data-testid="gridlines"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="starfield"]')).toBeTruthy()
  })

  it('looks up every ladderPage.callToAction translation key it uses', () => {
    render(<ContributionCallToAction />)
    // Titles/subtitle + hero button labels + three card key sets.
    const expected = [
      'ladderPage.callToAction.title',
      'ladderPage.callToAction.subtitle',
      'ladderPage.callToAction.communityMeetingsButton',
      'ladderPage.callToAction.viewIssuesButton',
      'ladderPage.callToAction.exploreCodeTitle',
      'ladderPage.callToAction.exploreCodeDescription',
      'ladderPage.callToAction.viewRepositoryLink',
      'ladderPage.callToAction.joinSlackTitle',
      'ladderPage.callToAction.joinSlackDescription',
      'ladderPage.callToAction.joinCommunityLink',
      'ladderPage.callToAction.learnGuideTitle',
      'ladderPage.callToAction.learnGuideDescription',
      'ladderPage.callToAction.viewHandbookLink',
    ]
    for (const key of expected) {
      expect(lookedUpKeys, `should look up ${key}`).toContain(key)
    }
  })

  it('renders the community-meetings external link with target=_blank + rel=noopener noreferrer', () => {
    const { container } = render(<ContributionCallToAction />)
    const link = container.querySelector('a[href="https://github.com/kubestellar/kubestellar/wiki"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders the kubestellar repo card link', () => {
    const { container } = render(<ContributionCallToAction />)
    const link = container.querySelector('a[href="https://github.com/kubestellar/kubestellar"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('passes the Slack URL through getLocalizedUrl and uses the returned href', () => {
    const { container } = render(<ContributionCallToAction />)
    expect(getLocalizedUrlMock).toHaveBeenCalledWith('https://kubestellar.io/slack')
    const link = container.querySelector('a[href="https://kubestellar.io/slack?locale=en"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('renders the handbook IntlLink pointing at /contribute-handbook', () => {
    const { container } = render(<ContributionCallToAction />)
    const intlLink = container.querySelector('a[data-intl-link="true"][href="/contribute-handbook"]') as HTMLAnchorElement
    expect(intlLink).toBeTruthy()
    expect(intlLink.textContent).toBe('[ladderPage.callToAction.viewHandbookLink]')
  })
})
