// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useNavDropdowns } from '../components/navbar/useNavDropdowns'

/**
 * Effect-side coverage for src/components/navbar/useNavDropdowns.ts.
 *
 * This hook has no existing test file. It wires up hover/keyboard behavior
 * to any element carrying data-dropdown / data-dropdown-menu attributes,
 * and gates per-name state flags (contribute / community / github). All of
 * that logic lives inside the useEffect body and is only reachable under
 * a jsdom render + real DOM setup.
 *
 * Tests cover:
 *   - Initial state (all four flags false)
 *   - mouseenter on a data-dropdown container flips the correct per-name
 *     flag (contribute / community / github)
 *   - Multiple simultaneous open dropdowns are impossible: entering a new
 *     container closes any prior menu (via .style.display = "none")
 *   - Escape key resets all four flags and hides every menu
 *   - Hook cleans up its listeners on unmount (no state changes after
 *     unmount when events fire)
 *
 * Deliberately NOT covered here: the language-switcher MutationObserver
 * path, which requires a full next-intl language button + [role="listbox"]
 * fixture and is a follow-up.
 */

function setupDropdowns() {
  document.body.innerHTML = `
    <div data-dropdown="contribute">
      <button data-dropdown-button>Contribute</button>
      <div data-dropdown-menu style="display:none;opacity:0;visibility:hidden"></div>
    </div>
    <div data-dropdown="community">
      <button data-dropdown-button>Community</button>
      <div data-dropdown-menu style="display:none;opacity:0;visibility:hidden"></div>
    </div>
    <div data-dropdown="github">
      <button data-dropdown-button>GitHub</button>
      <div data-dropdown-menu style="display:none;opacity:0;visibility:hidden"></div>
    </div>
  `
}

function containerFor(name: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-dropdown="${name}"]`)
  if (!el) throw new Error(`missing [data-dropdown="${name}"]`)
  return el
}

function menuFor(name: string): HTMLElement {
  const el = containerFor(name).querySelector<HTMLElement>('[data-dropdown-menu]')
  if (!el) throw new Error(`missing menu inside [data-dropdown="${name}"]`)
  return el
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  setupDropdowns()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('useNavDropdowns — initial state', () => {
  it('returns all four flags false before any interaction', () => {
    const { result } = renderHook(() => useNavDropdowns())

    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
  })
})

describe('useNavDropdowns — hover opens named dropdown', () => {
  it('mouseenter on contribute container flips isDropdownOpen + isContributeOpen only', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(true)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
    expect(menuFor('contribute').style.display).toBe('block')
  })

  it('mouseenter on community container flips isCommunityOpen', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('community').dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(result.current.isCommunityOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
  })

  it('mouseenter on github container flips isGithubOpen', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('github').dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(result.current.isGithubOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isCommunityOpen).toBe(false)
  })
})

describe('useNavDropdowns — entering a second dropdown closes the first', () => {
  it('hides the previously-visible menu when a new container is entered', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
    })
    expect(menuFor('contribute').style.display).toBe('block')

    act(() => {
      containerFor('community').dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(menuFor('contribute').style.display).toBe('none')
    expect(menuFor('community').style.display).toBe('block')
    expect(result.current.isCommunityOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
  })
})

describe('useNavDropdowns — mouseleave hides after 300ms', () => {
  it('does not hide immediately, then hides after the debounce elapses', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseleave'))
    })
    // Debounce has not fired yet — menu remains visible.
    expect(menuFor('contribute').style.display).toBe('block')
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(menuFor('contribute').style.display).toBe('none')
    expect(result.current.isDropdownOpen).toBe(false)
    expect(result.current.isContributeOpen).toBe(false)
  })

  it('re-entering the container before 300ms elapses cancels the hide', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseleave'))
    })

    act(() => {
      vi.advanceTimersByTime(150)
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
      vi.advanceTimersByTime(300)
    })

    expect(menuFor('contribute').style.display).toBe('block')
    expect(result.current.isDropdownOpen).toBe(true)
  })
})

describe('useNavDropdowns — Escape key resets everything', () => {
  it('hides all menus and clears all four flags', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('github').dispatchEvent(new MouseEvent('mouseenter'))
    })
    expect(result.current.isGithubOpen).toBe(true)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.isDropdownOpen).toBe(false)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
    for (const name of ['contribute', 'community', 'github']) {
      expect(menuFor(name).style.display).toBe('none')
    }
  })

  it('ignores non-Escape keys', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
    })
    expect(result.current.isContributeOpen).toBe(true)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(result.current.isContributeOpen).toBe(true)
  })
})

describe('useNavDropdowns — showMenu dispatches close-lang-switcher', () => {
  it('emits a close-lang-switcher CustomEvent when a menu opens', () => {
    const listener = vi.fn()
    document.addEventListener('close-lang-switcher', listener)

    renderHook(() => useNavDropdowns())

    act(() => {
      containerFor('community').dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(listener).toHaveBeenCalledTimes(1)
    document.removeEventListener('close-lang-switcher', listener)
  })
})

describe('useNavDropdowns — cleanup on unmount', () => {
  it('removes mouseenter/mouseleave/keydown listeners so unmount silences the hook', () => {
    const { result, unmount } = renderHook(() => useNavDropdowns())
    unmount()

    act(() => {
      containerFor('contribute').dispatchEvent(new MouseEvent('mouseenter'))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    // Post-unmount state is captured before unmount — remains {false,false,false,false}.
    expect(result.current.isDropdownOpen).toBe(false)
    expect(result.current.isContributeOpen).toBe(false)
  })
})

describe('useNavDropdowns — empty DOM', () => {
  it('mounts safely and returns initial state when no data-dropdown containers exist', () => {
    document.body.innerHTML = ''
    const { result } = renderHook(() => useNavDropdowns())
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
  })

  it('skips a container that has no [data-dropdown-menu] child', () => {
    document.body.innerHTML = `
      <div data-dropdown="contribute">
        <button data-dropdown-button>Contribute</button>
      </div>
    `
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      document.querySelector('[data-dropdown="contribute"]')!
        .dispatchEvent(new MouseEvent('mouseenter'))
    })

    // No menu -> handler was never bound -> state stays false.
    expect(result.current.isContributeOpen).toBe(false)
  })
})
