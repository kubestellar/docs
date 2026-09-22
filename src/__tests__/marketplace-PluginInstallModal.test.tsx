// @vitest-environment jsdom
/**
 * Coverage for src/app/[locale]/marketplace/[slug]/components/PluginInstallModal.tsx.
 *
 * PluginInstallModal is a two-state presentational overlay:
 *   - installedSuccess=false → spinner + "Installing {name}" text
 *   - installedSuccess=true  → checkmark + success copy + kubectl command
 *                              + a Close button that fires onClose exactly
 *                              once per click.
 *
 * Neither `usePlugins` nor `useTranslations` is called from this file — the
 * translator is passed in as the `t` prop. That makes it a good fit for a
 * plain unit test with a fake translator, and lets this file cover both
 * branches without touching next-intl.
 */

import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'

import { PluginInstallModal } from '../app/[locale]/marketplace/[slug]/components/PluginInstallModal'
import type { Plugin } from '../app/[locale]/marketplace/plugins'

/**
 * A fake `t` that records every key it was asked for and echoes the key
 * back so we can assert on it in the rendered DOM without wiring next-intl.
 */
function makeT() {
  const keys: string[] = []
  const t = ((key: string, values?: Record<string, string | number>) => {
    keys.push(key)
    if (values && 'name' in values) return `${key}[name=${values.name}]`
    return key
  }) as unknown as Parameters<typeof PluginInstallModal>[0]['t']
  return { t, keys }
}

function makePlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'plg-1',
    name: 'Test Plugin',
    slug: 'test-plugin',
    tagline: 'tagline',
    description: 'desc',
    longDescription: 'long',
    icon: '🚀',
    category: 'utility',
    pricing: { type: 'free' },
    author: 'anon',
    downloads: 0,
    rating: 5,
    version: '1.0.0',
    features: [],
    requirements: [],
    compatibility: [],
    screenshots: [],
    documentation: 'https://example.test/docs',
    tags: [],
    ...overrides,
  }
}

describe('PluginInstallModal', () => {
  afterEach(() => cleanup())

  it('renders the installing spinner state when installedSuccess=false', () => {
    const { t, keys } = makeT()
    render(
      <PluginInstallModal
        plugin={makePlugin()}
        installedSuccess={false}
        onClose={() => {}}
        t={t}
      />,
    )
    // The name is interpolated into the "installing" key
    expect(
      screen.getByText('installation.installing[name=Test Plugin]'),
    ).toBeTruthy()
    expect(screen.getByText('installation.pleaseWait')).toBeTruthy()
    expect(keys).toContain('installation.installing')
    expect(keys).toContain('installation.pleaseWait')
    // Success-state elements MUST NOT be present
    expect(screen.queryByText('installation.success.title')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders the success state, embeds the plugin slug in the kubectl hint, and fires onClose exactly once', () => {
    const { t } = makeT()
    const onClose = vi.fn()
    render(
      <PluginInstallModal
        plugin={makePlugin({ slug: 'my-plugin' })}
        installedSuccess
        onClose={onClose}
        t={t}
      />,
    )
    // Success copy + interpolated subtitle
    expect(screen.getByText('installation.success.title')).toBeTruthy()
    expect(
      screen.getByText('installation.success.subtitle[name=Test Plugin]'),
    ).toBeTruthy()
    // Slug is embedded in the kubectl command line
    expect(
      screen.getByText(/kubectl ks plugin enable my-plugin/),
    ).toBeTruthy()

    // Close button — one, and one click fires onClose exactly once
    const closeBtn = screen.getByRole('button', {
      name: 'installation.success.close',
    })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
