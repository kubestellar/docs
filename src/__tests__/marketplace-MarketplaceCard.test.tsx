// @vitest-environment jsdom
/**
 * Coverage for src/app/[locale]/marketplace/components/MarketplaceCard.tsx.
 *
 * The card is a pure client component that consumes a MarketplaceItem and
 * renders name, version, description, optional theme swatches, tag chips
 * (with overflow), author link (with vs without GitHub handle), a JSON
 * download link, and an "Install" button that toggles the <InstallModal />.
 * Before this file it sat at 0/… line coverage — the marketplace page that
 * would exercise it has no tests either. This file targets the branches
 * that ship user-visible regressions: tag overflow past 4, theme colors
 * only rendered for `type === "theme"`, author with vs without GitHub URL,
 * and modal open/close on Install click.
 *
 * `InstallModal` is a heavy child (fetches, timers, clipboard) — we mock
 * it so this file stays a *card* test, not an install test. `InstallModal`
 * has its own dedicated test file.
 */

import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'

// Mock the heavy install modal — its logic is covered in
// marketplace-InstallModal.test.tsx. Here we only care that clicking
// Install mounts something and clicking close unmounts it again.
vi.mock('../app/[locale]/marketplace/components/InstallModal', () => ({
  InstallModal: ({ onClose, item }: { onClose: () => void; item: { id: string } }) =>
    React.createElement(
      'div',
      { 'data-testid': 'install-modal', 'data-item-id': item.id },
      React.createElement('button', { onClick: onClose, 'data-testid': 'install-modal-close' }, 'x'),
    ),
}))

// eslint-disable-next-line import/first
import { MarketplaceCard } from '../app/[locale]/marketplace/components/MarketplaceCard'
// eslint-disable-next-line import/first
import type { MarketplaceItem } from '../app/[locale]/marketplace/lib/types'

function makeItem(overrides: Partial<MarketplaceItem> = {}): MarketplaceItem {
  return {
    id: 'sample-dashboard',
    name: 'Sample Dashboard',
    description: 'A dashboard for sampling.',
    author: 'Ada Lovelace',
    authorGithub: 'ada',
    version: '1.2.3',
    downloadUrl: 'https://example.test/sample.json',
    tags: ['analytics', 'metrics'],
    cardCount: 3,
    type: 'dashboard',
    ...overrides,
  }
}

describe('MarketplaceCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders name, version, description, and author link when authorGithub is set', () => {
    render(<MarketplaceCard item={makeItem()} />)
    expect(screen.getByText('Sample Dashboard')).toBeTruthy()
    expect(screen.getByText('v1.2.3')).toBeTruthy()
    expect(screen.getByText('A dashboard for sampling.')).toBeTruthy()
    // authorGithub set → author renders as an <a> to github.com/<handle>
    const authorLink = screen.getByRole('link', { name: 'Ada Lovelace' }) as HTMLAnchorElement
    expect(authorLink.href).toBe('https://github.com/ada')
    expect(authorLink.target).toBe('_blank')
    expect(authorLink.rel).toContain('noopener')
  })

  it('renders author as plain text (not a link) when authorGithub is absent', () => {
    render(<MarketplaceCard item={makeItem({ authorGithub: undefined })} />)
    // No link with the author's name means the <span> branch was taken.
    expect(screen.queryByRole('link', { name: 'Ada Lovelace' })).toBeNull()
    expect(screen.getByText('Ada Lovelace')).toBeTruthy()
  })

  it('renders the singular "card" suffix when cardCount === 1 and hides it entirely when 0', () => {
    const { rerender } = render(<MarketplaceCard item={makeItem({ cardCount: 1 })} />)
    // "· 1 card" — no trailing "s"
    expect(screen.getByText(/·\s*1\s+card$/)).toBeTruthy()

    rerender(<MarketplaceCard item={makeItem({ cardCount: 0 })} />)
    // cardCount === 0 → the whole "· N card(s)" span is not rendered.
    expect(screen.queryByText(/·\s*0\s+card/)).toBeNull()
  })

  it('renders only the first 4 tags and shows a "+N" overflow when there are more', () => {
    render(
      <MarketplaceCard
        item={makeItem({ tags: ['a', 'b', 'c', 'd', 'e', 'f'] })}
      />,
    )
    // First 4 tags rendered as chips
    for (const tag of ['a', 'b', 'c', 'd']) {
      expect(screen.getByText(tag)).toBeTruthy()
    }
    // Overflow indicator is "+2" (6 - 4)
    expect(screen.getByText('+2')).toBeTruthy()
    // 5th/6th tags NOT rendered as chips
    expect(screen.queryByText('e')).toBeNull()
    expect(screen.queryByText('f')).toBeNull()
  })

  it('does not render the overflow indicator when there are exactly 4 tags', () => {
    render(<MarketplaceCard item={makeItem({ tags: ['a', 'b', 'c', 'd'] })} />)
    // No "+N" chip should appear
    expect(screen.queryByText(/^\+\d+$/)).toBeNull()
  })

  it('renders theme color swatches only for type="theme" with themeColors', () => {
    // dashboard item → no swatch container even if themeColors is set
    const { container: dashboardContainer } = render(
      <MarketplaceCard
        item={makeItem({ type: 'dashboard', themeColors: ['#111', '#222'] })}
      />,
    )
    expect(
      dashboardContainer.querySelectorAll('div[style*="background-color"]').length,
    ).toBe(0)
    cleanup()

    // theme item with 2 colors → 2 swatches with the colors we passed in
    const { container: themeContainer } = render(
      <MarketplaceCard
        item={makeItem({ type: 'theme', themeColors: ['#111111', '#222222'] })}
      />,
    )
    const swatches = themeContainer.querySelectorAll('div[style*="background-color"]')
    expect(swatches.length).toBe(2)
  })

  it('renders the JSON download link pointing at item.downloadUrl', () => {
    render(<MarketplaceCard item={makeItem()} />)
    const jsonLink = screen.getByRole('link', { name: /JSON/ }) as HTMLAnchorElement
    expect(jsonLink.href).toBe('https://example.test/sample.json')
    expect(jsonLink.target).toBe('_blank')
    expect(jsonLink.rel).toContain('noopener')
  })

  it('opens the InstallModal on Install click and closes it via onClose', () => {
    render(<MarketplaceCard item={makeItem()} />)
    // No modal until the button is clicked
    expect(screen.queryByTestId('install-modal')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Install/ }))
    const modal = screen.getByTestId('install-modal')
    expect(modal).toBeTruthy()
    // Modal received the correct item.id (proves prop wiring, not just render)
    expect(modal.getAttribute('data-item-id')).toBe('sample-dashboard')

    fireEvent.click(screen.getByTestId('install-modal-close'))
    expect(screen.queryByTestId('install-modal')).toBeNull()
  })

  it('renders the "card-preset" and "theme" type badges from TYPE_CONFIG', () => {
    const { rerender } = render(
      <MarketplaceCard item={makeItem({ type: 'card-preset' })} />,
    )
    expect(screen.getByText('Card Preset')).toBeTruthy()

    rerender(<MarketplaceCard item={makeItem({ type: 'theme' })} />)
    expect(screen.getByText('Theme')).toBeTruthy()
  })
})
