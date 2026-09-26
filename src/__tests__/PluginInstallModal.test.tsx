// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for
 * src/app/[locale]/marketplace/[slug]/components/PluginInstallModal.tsx
 * (baseline 0%).
 *
 * Exercises both states the component renders:
 *   - installedSuccess=false: spinner + "installing" copy, no close button
 *   - installedSuccess=true: success copy, the enable command, and the
 *     close button invoking onClose exactly once per click
 */

import { PluginInstallModal } from '@/app/[locale]/marketplace/[slug]/components/PluginInstallModal'
import type { Plugin } from '@/app/[locale]/marketplace/plugins'

const t = ((key: string, values?: Record<string, unknown>) => {
  if (values) return `${key}:${JSON.stringify(values)}`
  return key
}) as unknown as ReturnType<typeof import('next-intl').useTranslations>

const plugin: Plugin = {
  id: 'kubectl-multi',
  name: 'Kubectl Multi',
  slug: 'kubectl-multi',
  tagline: 'Manage many clusters at once',
  description: 'desc',
  longDescription: 'long desc',
  icon: '🚀',
  category: 'productivity',
  pricing: { type: 'free' },
  author: 'KubeStellar',
  downloads: 100,
  rating: 4.8,
  version: '1.0.0',
  features: ['feature-a'],
  requirements: ['req-a'],
  compatibility: ['linux'],
  screenshots: [],
  documentation: 'https://example.com/docs',
  tags: ['cli'],
}

afterEach(() => cleanup())

describe('PluginInstallModal', () => {
  it('renders the installing state with the plugin name and no close button', () => {
    render(<PluginInstallModal plugin={plugin} installedSuccess={false} onClose={() => {}} t={t} />)

    expect(
      screen.getByText('installation.installing:{"name":"Kubectl Multi"}'),
    ).toBeTruthy()
    expect(screen.getByText('installation.pleaseWait')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders the success state with the enable command and calls onClose once per click', () => {
    const onClose = vi.fn()
    render(<PluginInstallModal plugin={plugin} installedSuccess={true} onClose={onClose} t={t} />)

    expect(screen.getByText('installation.success.title')).toBeTruthy()
    expect(screen.getByText('kubectl ks plugin enable kubectl-multi')).toBeTruthy()

    const closeButton = screen.getByRole('button', { name: 'installation.success.close' })
    fireEvent.click(closeButton)
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
