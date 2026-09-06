// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'

/**
 * Branch coverage for src/components/docs/MobileSidebarToggle.tsx (MobileHeader).
 *
 * The component currently has no dedicated test file. Coverage report shows
 * ~52% lines / 33% branches, with these uncovered branches:
 *
 *   - getBreadcrumb (line ~28): special-case '/docs/introduction' -> 'Docs > Guide'
 *   - getBreadcrumb (line ~32): fallback when pathname does not match /docs/
 *   - getBreadcrumb (line ~35-42): kebab/underscore splitting + title case
 *   - handleToggle (line ~47): dismissBanner + onToggleSidebar called together
 *   - isHovered ternary (line ~65-66): hover-state color both light & dark arms
 *   - mounted flag (line ~55): pre-mount fallback to isDark=false
 *
 * These are all render-visible pure branches — no async I/O — so
 * mocking next-themes + next/navigation + DocsProvider makes them trivial.
 */

const mockDismissBanner = vi.fn()
const mockOnToggle = vi.fn()

let mockPathname = '/docs/console/features/dashboards'
let mockResolvedTheme: string | undefined = 'light'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}))

vi.mock('../components/docs/DocsProvider', () => ({
  useDocsMenu: () => ({ dismissBanner: mockDismissBanner }),
}))

import { MobileHeader } from '../components/docs/MobileSidebarToggle'

describe('MobileHeader — breadcrumb + toggle + theme branch coverage', () => {
  beforeEach(() => {
    mockDismissBanner.mockReset()
    mockOnToggle.mockReset()
    mockPathname = '/docs/console/features/dashboards'
    mockResolvedTheme = 'light'
  })

  afterEach(() => {
    // vitest jsdom is reset per-test via globals; nothing to do.
  })

  it('renders a fully title-cased breadcrumb from a nested pathname (kebab-case arm)', () => {
    mockPathname = '/docs/console/getting-started/first-cluster'
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    expect(
      screen.getByText('Docs > Console > Getting Started > First Cluster')
    ).toBeTruthy()
  })

  it('title-cases underscore-separated segments too', () => {
    mockPathname = '/docs/console/quick_start_guide'
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    expect(screen.getByText('Docs > Console > Quick Start Guide')).toBeTruthy()
  })

  it('special-cases /docs/introduction as "Docs > Guide"', () => {
    mockPathname = '/docs/introduction'
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    expect(screen.getByText('Docs > Guide')).toBeTruthy()
  })

  it('falls back to plain "Docs" when the pathname does not match /docs/', () => {
    mockPathname = '/blog/whatever'
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    expect(screen.getByText('Docs')).toBeTruthy()
  })

  it('handleToggle dismisses the banner AND invokes onToggleSidebar', () => {
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    const button = screen.getByRole('button', { name: 'Open sidebar' })
    fireEvent.click(button)
    expect(mockDismissBanner).toHaveBeenCalledTimes(1)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('applies the light-theme hovered color when mounted and hovered', () => {
    mockResolvedTheme = 'light'
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    const button = screen.getByRole('button', { name: 'Open sidebar' })
    // Pre-hover: unhovered light color
    expect(button.style.color).toBe('rgb(107, 114, 128)') // #6b7280
    act(() => {
      fireEvent.mouseEnter(button)
    })
    expect(button.style.color).toBe('rgb(17, 24, 39)') // #111827
    act(() => {
      fireEvent.mouseLeave(button)
    })
    expect(button.style.color).toBe('rgb(107, 114, 128)')
  })

  it('applies the dark-theme hovered color when mounted with dark theme', () => {
    mockResolvedTheme = 'dark'
    render(<MobileHeader onToggleSidebar={mockOnToggle} />)
    const button = screen.getByRole('button', { name: 'Open sidebar' })
    // Pre-hover: unhovered dark color
    expect(button.style.color).toBe('rgb(156, 163, 175)') // #9ca3af
    act(() => {
      fireEvent.mouseEnter(button)
    })
    expect(button.style.color).toBe('rgb(243, 244, 246)') // #f3f4f6
  })
})
