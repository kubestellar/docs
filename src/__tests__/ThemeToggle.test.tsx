// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

/**
 * Coverage for src/components/docs/ThemeToggle.tsx.
 *
 * ThemeToggle has four render arms driven by two independent props/state:
 *   variant ∈ {'fixed' (default), 'icon'} × mounted ∈ {false, true}.
 *
 * Before the mount effect fires we render a placeholder button that MUST
 * NOT be wired to setTheme; after mount the real toggle is exposed with
 * an aria-label that also switches on the currently-resolved theme.
 *
 * We stub next-themes so we can drive resolvedTheme deterministically and
 * assert that clicking the button invokes setTheme('light') from the dark
 * side and setTheme('dark') from the light side — exercising both arms of
 * the `isDark ? "light" : "dark"` toggle in both variants.
 */

const setThemeMock = vi.fn()
let mockResolvedTheme: string = 'light'

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: setThemeMock,
  }),
}))

import { ThemeToggle } from '../components/docs/ThemeToggle'

describe('ThemeToggle — mounted variants and click toggle', () => {
  beforeEach(() => {
    setThemeMock.mockClear()
    mockResolvedTheme = 'light'
    cleanup()
  })

  it('fixed variant: after mount, clicking in light mode switches to dark', () => {
    mockResolvedTheme = 'light'
    render(<ThemeToggle />)
    // Post-mount label reflects the target theme ("Switch to dark mode").
    const button = screen.getByLabelText('Switch to dark mode')
    fireEvent.click(button)
    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('fixed variant: after mount, clicking in dark mode switches to light', () => {
    mockResolvedTheme = 'dark'
    render(<ThemeToggle />)
    const button = screen.getByLabelText('Switch to light mode')
    fireEvent.click(button)
    expect(setThemeMock).toHaveBeenCalledWith('light')
  })

  it('icon variant: after mount, clicking in light mode switches to dark', () => {
    mockResolvedTheme = 'light'
    render(<ThemeToggle variant="icon" />)
    const button = screen.getByLabelText('Switch to dark mode')
    fireEvent.click(button)
    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('icon variant: after mount, clicking in dark mode switches to light', () => {
    mockResolvedTheme = 'dark'
    render(<ThemeToggle variant="icon" />)
    const button = screen.getByLabelText('Switch to light mode')
    fireEvent.click(button)
    expect(setThemeMock).toHaveBeenCalledWith('light')
  })

  it('icon variant: post-mount button carries the "Change theme" title', () => {
    mockResolvedTheme = 'light'
    render(<ThemeToggle variant="icon" />)
    // The icon variant uses title="Change theme" instead of the dynamic
    // "Switch to X mode" title used by the fixed variant.
    expect(screen.getByTitle('Change theme')).toBeTruthy()
  })

  it('fixed variant: post-mount button carries a dynamic title matching aria-label', () => {
    mockResolvedTheme = 'dark'
    render(<ThemeToggle />)
    expect(screen.getByTitle('Switch to light mode')).toBeTruthy()
  })
})

// ─── Pre-mount placeholder branches (mounted=false path) ─────────────

describe('ThemeToggle — pre-mount placeholder rendering', () => {
  // React 19's automatic-batching + jsdom fires the useEffect synchronously
  // during render, so to observe the `!mounted` branch we replace the
  // module's useState/useEffect via a targeted mock that pins mounted=false.
  beforeEach(() => {
    setThemeMock.mockClear()
    cleanup()
    vi.resetModules()
  })

  it('fixed variant renders a placeholder button with generic aria-label before mount', async () => {
    vi.doMock('react', async () => {
      const actual = await vi.importActual<typeof import('react')>('react')
      return {
        ...actual,
        useState: <T,>(initial: T) => [initial, () => {}] as [T, (v: T) => void],
        useEffect: (_fn: () => void) => {},
      }
    })
    const { ThemeToggle: Preview } = await import('../components/docs/ThemeToggle')
    render(<Preview />)
    // The unmounted placeholder uses the generic "Toggle theme" label, not
    // the dynamic "Switch to X mode" that the mounted button uses.
    const button = screen.getByLabelText('Toggle theme')
    // It must NOT be wired to setTheme — clicking is a no-op before mount.
    fireEvent.click(button)
    expect(setThemeMock).not.toHaveBeenCalled()
    // Placeholder has no onClick handler; it should not have title text.
    expect(button.getAttribute('title')).toBeNull()
    vi.doUnmock('react')
  })

  it('icon variant renders a placeholder button with generic aria-label before mount', async () => {
    vi.doMock('react', async () => {
      const actual = await vi.importActual<typeof import('react')>('react')
      return {
        ...actual,
        useState: <T,>(initial: T) => [initial, () => {}] as [T, (v: T) => void],
        useEffect: (_fn: () => void) => {},
      }
    })
    const { ThemeToggle: Preview } = await import('../components/docs/ThemeToggle')
    render(<Preview variant="icon" />)
    const button = screen.getByLabelText('Toggle theme')
    fireEvent.click(button)
    expect(setThemeMock).not.toHaveBeenCalled()
    // Icon-variant placeholder should be smaller (no fixed positioning classes).
    expect(button.className).not.toContain('fixed')
    vi.doUnmock('react')
  })
})
