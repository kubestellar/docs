// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/app/[locale]/marketplace/components/MarketplaceCard.tsx
 * (baseline 0%).
 *
 * Exercises:
 *   - structural render (name, version, description, tags, author link)
 *   - the "+N" tag overflow branch when an item has more than 4 tags
 *   - the themeColors swatch branch for type: "theme" items
 *   - the author-without-github plain-text branch
 *   - clicking "Install" mounts InstallModal, and its onClose collapses it
 */

vi.mock('../app/[locale]/marketplace/components/InstallModal', () => ({
  InstallModal: ({ item, onClose }: { item: { name: string }; onClose: () => void }) =>
    React.createElement(
      'div',
      { 'data-testid': 'install-modal' },
      `Installing ${item.name}`,
      React.createElement('button', { onClick: onClose }, 'close-modal'),
    ),
}))

import type { MarketplaceItem } from '@/app/[locale]/marketplace/lib/types'
import { MarketplaceCard } from '@/app/[locale]/marketplace/components/MarketplaceCard'

afterEach(() => cleanup())

const baseItem: MarketplaceItem = {
  id: 'dash-1',
  name: 'Cluster Overview',
  description: 'A dashboard for cluster health.',
  author: 'jane-doe',
  authorGithub: 'jane-doe',
  version: '1.2.0',
  downloadUrl: 'https://example.com/dash-1.json',
  tags: ['clusters', 'health'],
  cardCount: 3,
  type: 'dashboard',
}

describe('MarketplaceCard', () => {
  it('renders name, version, description, author link and card count', () => {
    render(<MarketplaceCard item={baseItem} />)

    expect(screen.getByText('Cluster Overview')).toBeTruthy()
    expect(screen.getByText('v1.2.0')).toBeTruthy()
    expect(screen.getByText('A dashboard for cluster health.')).toBeTruthy()
    expect(screen.getByText('· 3 cards')).toBeTruthy()

    const authorLink = screen.getByRole('link', { name: 'jane-doe' })
    expect(authorLink.getAttribute('href')).toBe('https://github.com/jane-doe')
  })

  it('renders the author as plain text when authorGithub is absent', () => {
    const item: MarketplaceItem = { ...baseItem, authorGithub: undefined, author: 'anon' }
    render(<MarketplaceCard item={item} />)

    expect(screen.queryByRole('link', { name: 'anon' })).toBeNull()
    expect(screen.getByText('anon')).toBeTruthy()
  })

  it('shows a "+N" overflow indicator when there are more than 4 tags', () => {
    const item: MarketplaceItem = {
      ...baseItem,
      tags: ['a', 'b', 'c', 'd', 'e', 'f'],
    }
    render(<MarketplaceCard item={item} />)

    expect(screen.getByText('+2')).toBeTruthy()
  })

  it('renders theme color swatches for theme-type items', () => {
    const item: MarketplaceItem = {
      ...baseItem,
      type: 'theme',
      themeColors: ['#111111', '#222222'],
    }
    const { container } = render(<MarketplaceCard item={item} />)

    const swatches = container.querySelectorAll('div[style*="background-color"]')
    expect(swatches.length).toBe(2)
  })

  it('opens the InstallModal on Install click and closes it via onClose', () => {
    render(<MarketplaceCard item={baseItem} />)

    expect(screen.queryByTestId('install-modal')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /install/i }))
    const modal = screen.getByTestId('install-modal')
    expect(modal.textContent).toContain('Installing Cluster Overview')

    fireEvent.click(screen.getByRole('button', { name: 'close-modal' }))
    expect(screen.queryByTestId('install-modal')).toBeNull()
  })
})
