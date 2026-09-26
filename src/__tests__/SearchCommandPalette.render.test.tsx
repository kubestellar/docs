// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React, { createRef } from 'react'

/**
 * Coverage for src/components/docs/navbar/SearchCommandPalette.tsx. This
 * presentational overlay was previously only imported by DocsNavbar.tsx
 * and is mocked in DocsNavbar.handlers.test.tsx (see the
 * `SearchCommandPalette: () => <div data-testid="scp" />` mock there), so
 * every branch here — closed, empty-query, loading, no-results, results
 * with selected index, click/hover handlers, isDark theming, and the
 * pluralised footer count — has been running at 0 % coverage.
 *
 * The component only takes plain data props (booleans, strings, refs,
 * arrays and callbacks), so straight RTL renders exercise all branches
 * without extra mocking.
 */

import SearchCommandPalette from '../components/docs/navbar/SearchCommandPalette'
import type { SearchResult } from '../components/docs/navbar/types'

afterEach(() => cleanup())

const mkResult = (over: Partial<SearchResult> = {}): SearchResult => ({
  title: 'Getting Started',
  url: '/docs/getting-started',
  category: 'Guide',
  snippet: 'How to get started with KubeStellar',
  highlightedSnippet: 'How to <mark>get started</mark> with KubeStellar',
  matchType: 'title',
  ...over,
})

const baseProps = () => {
  const searchInputRef = createRef<HTMLInputElement>()
  const commandPaletteRef = createRef<HTMLDivElement>()
  return {
    isDark: false,
    isSearchOpen: true,
    searchQuery: '',
    isSearching: false,
    searchResults: [] as SearchResult[],
    selectedIndex: 0,
    searchInputRef,
    commandPaletteRef,
    onQueryChange: vi.fn(),
    onClose: vi.fn(),
    onSelectIndex: vi.fn(),
    onResultClick: vi.fn(),
  }
}

describe('SearchCommandPalette', () => {
  it('renders nothing when isSearchOpen is false', () => {
    const props = { ...baseProps(), isSearchOpen: false }
    const { container } = render(<SearchCommandPalette {...props} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the empty-query prompt when the query is blank', () => {
    render(<SearchCommandPalette {...baseProps()} />)
    expect(
      screen.getByText(/Search for any word or phrase/i),
    ).toBeTruthy()
    // The "try …" hint is only shown in the empty state.
    expect(screen.getByText(/kubectl/)).toBeTruthy()
    // No footer while there are no results.
    expect(screen.queryByText(/to navigate/i)).toBeNull()
  })

  it('renders the loading state while searching a non-empty query', () => {
    const props = { ...baseProps(), searchQuery: 'kube', isSearching: true }
    render(<SearchCommandPalette {...props} />)
    expect(screen.getByText(/Searching documentation/i)).toBeTruthy()
  })

  it('renders the no-results state when the query has no matches', () => {
    const props = { ...baseProps(), searchQuery: 'zzz', isSearching: false }
    render(<SearchCommandPalette {...props} />)
    expect(screen.getByText(/No results found for/i)).toBeTruthy()
    expect(screen.getByText(/"zzz"/)).toBeTruthy()
  })

  it('renders each result and marks the selected index', () => {
    const results = [mkResult({ title: 'First' }), mkResult({ title: 'Second', url: '/docs/second' })]
    const props = { ...baseProps(), searchQuery: 'q', searchResults: results, selectedIndex: 1 }
    const { container } = render(<SearchCommandPalette {...props} />)
    const anchors = container.querySelectorAll('a[href]')
    expect(anchors.length).toBe(2)
    // The second anchor is the selected one — it must carry the
    // "border-blue-*" selected style, while the first must not.
    expect(anchors[0].className).not.toMatch(/border-blue-/)
    expect(anchors[1].className).toMatch(/border-blue-/)
    // Footer shows plural "results" for >1.
    expect(screen.getByText('2 results')).toBeTruthy()
  })

  it('uses the singular "result" label when there is exactly one hit', () => {
    const props = {
      ...baseProps(),
      searchQuery: 'q',
      searchResults: [mkResult()],
      selectedIndex: 0,
    }
    render(<SearchCommandPalette {...props} />)
    expect(screen.getByText('1 result')).toBeTruthy()
  })

  it('injects highlighted snippet HTML into each result row', () => {
    const props = {
      ...baseProps(),
      searchQuery: 'q',
      searchResults: [mkResult()],
      selectedIndex: 0,
    }
    const { container } = render(<SearchCommandPalette {...props} />)
    // The <mark> tags from highlightedSnippet must reach the DOM.
    expect(container.querySelector('mark')).not.toBeNull()
  })

  it('fires onQueryChange as the user types', () => {
    const props = baseProps()
    render(<SearchCommandPalette {...props} />)
    const input = screen.getByPlaceholderText(/Search documentation/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'workload' } })
    expect(props.onQueryChange).toHaveBeenCalledWith('workload')
  })

  it('fires onClose when the backdrop is clicked', () => {
    const props = baseProps()
    const { container } = render(<SearchCommandPalette {...props} />)
    // The backdrop is the first fixed-inset div.
    const backdrop = container.querySelector('div.fixed.inset-0') as HTMLElement
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('fires onSelectIndex on hover and onResultClick on click', () => {
    const results = [mkResult({ title: 'First' }), mkResult({ title: 'Second' })]
    const props = { ...baseProps(), searchQuery: 'q', searchResults: results, selectedIndex: 0 }
    const { container } = render(<SearchCommandPalette {...props} />)
    const anchors = container.querySelectorAll('a[href]')
    fireEvent.mouseEnter(anchors[1])
    expect(props.onSelectIndex).toHaveBeenCalledWith(1)
    fireEvent.click(anchors[1])
    expect(props.onResultClick).toHaveBeenCalledWith(results[1], 1)
  })

  it('applies dark-theme classes when isDark is true', () => {
    const props = { ...baseProps(), isDark: true }
    const { container } = render(<SearchCommandPalette {...props} />)
    // The command-palette shell picks up the dark background/border pair.
    const shell = container.querySelector('.bg-neutral-900')
    expect(shell).not.toBeNull()
  })

  it('applies light-theme classes when isDark is false', () => {
    const { container } = render(<SearchCommandPalette {...baseProps()} />)
    const shell = container.querySelector('.bg-white')
    expect(shell).not.toBeNull()
  })
})
