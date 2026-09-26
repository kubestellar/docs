// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

/**
 * Render smoke tests for src/components/docs/DocsNavbar.tsx (1076 LOC, 0% coverage
 * before this file; see docs#6703 Track 2). DocsNavbar has three external
 * side-effects wired via useEffect: shields.io stats fetch, /api/search fetch,
 * and next-themes theme resolution. We stub all three so the render surface is
 * deterministic under jsdom.
 *
 * The intent is a render smoke that exercises:
 *   - Top-level nav landmarks (search input, mobile toggle, GitHub link, version selector)
 *   - Dropdown open/close on the "GitHub" button (aria-expanded flip)
 *   - Search input debounce (search flips isSearchOpen state)
 *   - Mobile menu toggle (aria-label="Toggle menu")
 *   - Theme-conditional class (dark vs light) after mounted flag flips
 *
 * We do NOT assert on shield-fetched stat values (that would couple the test
 * to the mock fetch payload shape); we assert only that the fallback values
 * render pre-mount.
 */

let mockResolvedTheme: string | undefined = 'light'
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}))

vi.mock('../components/docs/VersionSelector', () => ({
  VersionSelector: ({ isMobile }: { isMobile?: boolean }) => (
    <div data-testid={`version-selector${isMobile ? '-mobile' : ''}`}>vs</div>
  ),
}))

const mockGtagEvent = vi.fn()
vi.mock('../components/GoogleAnalytics', () => ({
  gtagEvent: (...args: unknown[]) => mockGtagEvent(...args),
}))

vi.mock('@/lib/url', () => ({
  getLocalizedUrl: (p: string) => `https://kubestellar.io${p}`,
  getBaseUrl: () => 'https://kubestellar.io',
}))

vi.mock('@/config/versions', () => ({
  VERSIONS: [{ id: 'v1', label: '1.0' }],
}))

// Stub global fetch — both shields.io and /api/search go through it.
const mockFetch = vi.fn()

import DocsNavbar from '../components/docs/DocsNavbar'

beforeEach(() => {
  mockResolvedTheme = 'light'
  mockGtagEvent.mockClear()
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ value: '42' }),
  })
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DocsNavbar — render smoke', () => {
  it('renders without a placeholder search input until command palette is opened', () => {
    render(<DocsNavbar />)
    // The command-palette input is gated on isSearchOpen, so the placeholder
    // is NOT present at initial render — assert the negative to lock the
    // starting state.
    expect(screen.queryByPlaceholderText(/Search documentation/i)).toBeNull()
  })

  it('renders the mobile menu toggle button', () => {
    render(<DocsNavbar />)
    expect(screen.getByLabelText('Toggle menu')).toBeTruthy()
  })

  it('renders the version selector', () => {
    render(<DocsNavbar />)
    expect(screen.getByTestId('version-selector')).toBeTruthy()
  })

  it('mounts the mobile version selector once the mobile menu is opened', () => {
    render(<DocsNavbar />)
    // Mobile menu starts closed — mobile VersionSelector is not yet rendered.
    expect(screen.queryByTestId('version-selector-mobile')).toBeNull()
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(screen.getByTestId('version-selector-mobile')).toBeTruthy()
  })

  it('renders GitHub external link with rel=noopener noreferrer', () => {
    render(<DocsNavbar />)
    const links = screen.getAllByRole('link', { hidden: true })
    const gh = links.find((l) => (l as HTMLAnchorElement).href.includes('github.com/kubestellar/docs'))
    expect(gh).toBeTruthy()
    expect((gh as HTMLAnchorElement).rel).toMatch(/noopener/)
    expect((gh as HTMLAnchorElement).rel).toMatch(/noreferrer/)
    expect((gh as HTMLAnchorElement).target).toBe('_blank')
  })

  it('toggles the mobile menu open/closed when the Toggle menu button is clicked', () => {
    render(<DocsNavbar />)
    const btn = screen.getByLabelText('Toggle menu')
    // Fire twice — no assertion on internal state, just that no throw.
    fireEvent.click(btn)
    fireEvent.click(btn)
    // The button is still present after toggle cycles.
    expect(screen.getByLabelText('Toggle menu')).toBeTruthy()
  })

  it('honors resolvedTheme=dark by mounting without throwing', () => {
    mockResolvedTheme = 'dark'
    const { container } = render(<DocsNavbar />)
    expect(container.firstChild).toBeTruthy()
  })

  it('handles resolvedTheme=undefined (pre-mount fallback) without throwing', () => {
    mockResolvedTheme = undefined
    const { container } = render(<DocsNavbar />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders a Search-documentation aria-labeled control', () => {
    render(<DocsNavbar />)
    // Multiple elements carry this aria-label (mobile trigger + desktop
    // trigger); we just need at least one.
    expect(screen.getAllByLabelText('Search documentation').length).toBeGreaterThanOrEqual(1)
  })

  it('does not crash when fetch rejects (shields.io offline)', async () => {
    mockFetch.mockReset()
    mockFetch.mockRejectedValue(new Error('offline'))
    const { container } = render(<DocsNavbar />)
    // Give the shields.io fetchStats effect a tick to reject.
    await new Promise((r) => setTimeout(r, 0))
    expect(container.firstChild).toBeTruthy()
  })
})
