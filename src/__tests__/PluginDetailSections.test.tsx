// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for
 * src/app/[locale]/marketplace/[slug]/components/PluginDetailSections.tsx
 * (baseline 0%).
 *
 * Exercises:
 *   - free-plugin pricing branch ("plugin.free") and the install CTA firing
 *     onInstall exactly once per click
 *   - paid-plugin pricing branch (amount + monthly/one-time label)
 *   - the optional github link branch (rendered only when plugin.github is set)
 *   - features/requirements/compatibility/tags list rendering
 */

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...rest }, children),
}))

vi.mock('@/components', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))

import { PluginDetailSections } from '@/app/[locale]/marketplace/[slug]/components/PluginDetailSections'
import type { Plugin } from '@/app/[locale]/marketplace/plugins'

const t = ((key: string) => key) as unknown as ReturnType<typeof import('next-intl').useTranslations>

const basePlugin: Plugin = {
  id: 'kubectl-multi',
  name: 'Kubectl Multi',
  slug: 'kubectl-multi',
  tagline: 'Manage many clusters at once',
  description: 'desc',
  longDescription: 'A longer description of the plugin.',
  icon: '🚀',
  category: 'productivity',
  pricing: { type: 'free' },
  author: 'KubeStellar',
  downloads: 1234,
  rating: 4.8,
  version: '1.0.0',
  features: ['Multi-cluster kubectl context switching'],
  requirements: ['kubectl >= 1.28'],
  compatibility: ['linux', 'macos'],
  screenshots: [],
  documentation: 'https://example.com/docs',
  tags: ['cli', 'clusters'],
}

afterEach(() => cleanup())

describe('PluginDetailSections', () => {
  it('renders the free-pricing branch and invokes onInstall once per click', () => {
    const onInstall = vi.fn()
    render(<PluginDetailSections plugin={basePlugin} onInstall={onInstall} t={t} />)

    expect(screen.getByText('plugin.free')).toBeTruthy()
    expect(screen.getByText('Kubectl Multi')).toBeTruthy()
    expect(screen.getByText('Manage many clusters at once')).toBeTruthy()

    fireEvent.click(screen.getByText('plugin.installPlugin'))
    expect(onInstall).toHaveBeenCalledTimes(1)
  })

  it('renders the paid-pricing branch with amount and monthly/one-time label', () => {
    const monthlyPlugin: Plugin = { ...basePlugin, pricing: { type: 'monthly', amount: 9 } }
    render(<PluginDetailSections plugin={monthlyPlugin} onInstall={() => {}} t={t} />)

    expect(screen.getByText('$9')).toBeTruthy()
    expect(screen.getByText('plugin.monthly')).toBeTruthy()
    expect(screen.getByText('plugin.payAndInstall')).toBeTruthy()

    const oneTimePlugin: Plugin = { ...basePlugin, pricing: { type: 'one-time', amount: 49 } }
    cleanup()
    render(<PluginDetailSections plugin={oneTimePlugin} onInstall={() => {}} t={t} />)
    expect(screen.getByText('$49')).toBeTruthy()
    expect(screen.getByText('plugin.oneTime')).toBeTruthy()
  })

  it('only renders the GitHub link when plugin.github is set', () => {
    const { rerender } = render(
      <PluginDetailSections plugin={basePlugin} onInstall={() => {}} t={t} />,
    )
    expect(screen.queryByText('GitHub')).toBeNull()

    rerender(
      <PluginDetailSections
        plugin={{ ...basePlugin, github: 'https://github.com/kubestellar/kubectl-multi' }}
        onInstall={() => {}}
        t={t}
      />,
    )
    const githubLink = screen.getByText('GitHub').closest('a')
    expect(githubLink?.getAttribute('href')).toBe('https://github.com/kubestellar/kubectl-multi')
  })

  it('renders features, requirements, compatibility and tags lists', () => {
    render(<PluginDetailSections plugin={basePlugin} onInstall={() => {}} t={t} />)

    expect(screen.getByText('Multi-cluster kubectl context switching')).toBeTruthy()
    expect(screen.getByText('kubectl >= 1.28')).toBeTruthy()
    expect(screen.getByText('linux')).toBeTruthy()
    expect(screen.getByText('macos')).toBeTruthy()
    expect(screen.getByText('#cli')).toBeTruthy()
    expect(screen.getByText('#clusters')).toBeTruthy()
  })
})
