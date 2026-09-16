// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

/**
 * Handler-branch coverage for src/components/docs/DocsNavbar.tsx (docs#6703
 * Track 2 follow-up). The existing DocsNavbar.render.test.tsx smoke test brings
 * DocsNavbar to ~59% statements; the still-uncovered handlers are the
 * dropdown mouse callbacks the navbar delegates to its dropdown sub-components:
 *
 *   - handleMouseEnter("contribute" | "community" | "github")
 *   - handleMouseLeave           (arms a 150 ms setTimeout that clears openDropdown)
 *   - handleDropdownMouseEnter   (cancels the pending setTimeout, if any)
 *
 * These fire only when a parent dropdown callback is invoked, so we mock the
 * three dropdown sub-components to expose the callbacks as button click
 * handlers we can drive directly. That way the tests exercise the real
 * DocsNavbar handler logic (open/close bookkeeping and the timeoutRef clear
 * path) without depending on the dropdowns' own render surface.
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

vi.mock('@/lib/url', () => ({
  getLocalizedUrl: (p: string) => `https://kubestellar.io${p}`,
  getBaseUrl: () => 'https://kubestellar.io',
}))

vi.mock('@/config/versions', () => ({
  VERSIONS: [{ id: 'v1', label: '1.0' }],
}))

// Expose dropdown callbacks as testable buttons. `openDropdown` is written into
// a data-attribute so tests can observe which dropdown DocsNavbar considers
// currently open. Everything referenced inside the vi.mock factory is defined
// inline because vi.mock is hoisted above any module-scope const declarations.
vi.mock('../components/docs/navbar', async () => {
  const actual = await vi.importActual<typeof import('../components/docs/navbar')>(
    '../components/docs/navbar'
  )
  type DropdownProps = {
    openDropdown: string | null
    onMouseEnter: () => void
    onMouseLeave: () => void
    onDropdownMouseEnter: () => void
  }
  const makeDropdownMock = (name: string) => (props: DropdownProps) => (
    <div data-testid={`dd-${name}`} data-open={String(props.openDropdown)}>
      <button data-testid={`dd-${name}-enter`} onClick={props.onMouseEnter}>
        enter
      </button>
      <button data-testid={`dd-${name}-leave`} onClick={props.onMouseLeave}>
        leave
      </button>
      <button
        data-testid={`dd-${name}-child-enter`}
        onClick={props.onDropdownMouseEnter}
      >
        child-enter
      </button>
    </div>
  )
  return {
    ...actual,
    useGithubStats: () => ({ stars: null, forks: null, contributors: null }),
    useDocsSearch: () => ({
      isSearchOpen: false,
      searchQuery: '',
      isSearching: false,
      searchResults: [],
      selectedIndex: 0,
      searchInputRef: { current: null },
      commandPaletteRef: { current: null },
      performSearch: vi.fn(),
      openSearch: vi.fn(),
      closeSearch: vi.fn(),
      setSelectedIndex: vi.fn(),
      trackSearchResultClick: vi.fn(),
    }),
    ContributeDropdown: makeDropdownMock('contribute'),
    CommunityDropdown: makeDropdownMock('community'),
    GithubDropdown: makeDropdownMock('github'),
    SearchCommandPalette: () => <div data-testid="scp" />,
    MobileMenu: ({ isMenuOpen }: { isMenuOpen: boolean }) => (
      <div data-testid="mobile-menu" data-open={String(isMenuOpen)} />
    ),
  }
})

import DocsNavbar from '../components/docs/DocsNavbar'

beforeEach(() => {
  mockResolvedTheme = 'light'
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DocsNavbar — dropdown mouse handlers', () => {
  it('handleMouseEnter("contribute") sets openDropdown=contribute on all three dropdowns', () => {
    render(<DocsNavbar />)
    // Sanity: all three dropdowns start with openDropdown=null.
    expect(screen.getByTestId('dd-contribute').getAttribute('data-open')).toBe('null')
    expect(screen.getByTestId('dd-community').getAttribute('data-open')).toBe('null')
    expect(screen.getByTestId('dd-github').getAttribute('data-open')).toBe('null')

    act(() => {
      fireEvent.click(screen.getByTestId('dd-contribute-enter'))
    })

    // openDropdown state propagates to every dropdown's `openDropdown` prop.
    expect(screen.getByTestId('dd-contribute').getAttribute('data-open')).toBe('contribute')
    expect(screen.getByTestId('dd-community').getAttribute('data-open')).toBe('contribute')
    expect(screen.getByTestId('dd-github').getAttribute('data-open')).toBe('contribute')
  })

  it('handleMouseEnter("community") swaps the active dropdown', () => {
    render(<DocsNavbar />)
    act(() => {
      fireEvent.click(screen.getByTestId('dd-contribute-enter'))
    })
    act(() => {
      fireEvent.click(screen.getByTestId('dd-community-enter'))
    })
    expect(screen.getByTestId('dd-contribute').getAttribute('data-open')).toBe('community')
  })

  it('handleMouseEnter("github") sets openDropdown=github', () => {
    render(<DocsNavbar />)
    act(() => {
      fireEvent.click(screen.getByTestId('dd-github-enter'))
    })
    expect(screen.getByTestId('dd-github').getAttribute('data-open')).toBe('github')
  })

  it('handleMouseLeave schedules a 150ms clear of openDropdown', () => {
    render(<DocsNavbar />)
    act(() => {
      fireEvent.click(screen.getByTestId('dd-contribute-enter'))
    })
    expect(screen.getByTestId('dd-contribute').getAttribute('data-open')).toBe('contribute')

    act(() => {
      fireEvent.click(screen.getByTestId('dd-contribute-leave'))
    })
    // Timer armed but not yet fired.
    expect(screen.getByTestId('dd-contribute').getAttribute('data-open')).toBe('contribute')

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByTestId('dd-contribute').getAttribute('data-open')).toBe('null')
  })

  it('handleDropdownMouseEnter cancels the pending close timer', () => {
    render(<DocsNavbar />)
    act(() => {
      fireEvent.click(screen.getByTestId('dd-github-enter'))
    })
    act(() => {
      fireEvent.click(screen.getByTestId('dd-github-leave'))
    })

    // Cancel by re-entering the dropdown child.
    act(() => {
      fireEvent.click(screen.getByTestId('dd-github-child-enter'))
    })

    // Advance past the original timeout — because we cancelled it, the
    // openDropdown state must still be 'github'.
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByTestId('dd-github').getAttribute('data-open')).toBe('github')
  })

  it('handleMouseEnter also clears a pending close timer from a prior leave', () => {
    render(<DocsNavbar />)
    act(() => {
      fireEvent.click(screen.getByTestId('dd-contribute-enter'))
    })
    act(() => {
      fireEvent.click(screen.getByTestId('dd-contribute-leave'))
    })
    // Enter a different dropdown before the 150 ms elapses. Per the
    // handleMouseEnter branch that clears timeoutRef when set, the pending
    // close must be cancelled and the new dropdown must remain open.
    act(() => {
      fireEvent.click(screen.getByTestId('dd-community-enter'))
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByTestId('dd-community').getAttribute('data-open')).toBe('community')
  })

  it('handleDropdownMouseEnter is a no-op when no timer is pending', () => {
    render(<DocsNavbar />)
    // Click child-enter without any prior leave — hits the `if (timeoutRef.current)`
    // false branch. Must not throw and must not affect openDropdown.
    act(() => {
      fireEvent.click(screen.getByTestId('dd-github-child-enter'))
    })
    expect(screen.getByTestId('dd-github').getAttribute('data-open')).toBe('null')
  })
})

describe('DocsNavbar — mobile menu passthrough', () => {
  it('propagates the mobile-menu open flag to MobileMenu via props', () => {
    render(<DocsNavbar />)
    const menu = screen.getByTestId('mobile-menu')
    expect(menu.getAttribute('data-open')).toBe('false')
    act(() => {
      fireEvent.click(screen.getByLabelText('Toggle menu'))
    })
    expect(menu.getAttribute('data-open')).toBe('true')
    act(() => {
      fireEvent.click(screen.getByLabelText('Toggle menu'))
    })
    expect(menu.getAttribute('data-open')).toBe('false')
  })
})
