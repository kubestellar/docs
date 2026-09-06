// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Effect-side coverage for src/components/navbar/useNavDropdowns.ts.
//
// The hook is a large useEffect that wires hover, keyboard, and
// MutationObserver listeners onto elements found via document.querySelector.
// Before this suite it was 0% covered — none of the imperative DOM setup,
// timeout-driven hide behavior, keyboard escape, or language-switcher
// integration was exercised.
//
// Each test builds a minimal DOM fixture in beforeEach, mounts the hook
// under jsdom, and drives events on the fixture. Timers are faked so
// the 300ms hide delay is deterministic. Cleanup asserts the hook's
// returned cleanup removes its listeners without throwing.

import { useNavDropdowns } from '../components/navbar/useNavDropdowns'

function buildDropdown(name: string) {
  const container = document.createElement('div')
  container.setAttribute('data-dropdown', name)

  const button = document.createElement('button')
  button.setAttribute('data-dropdown-button', '')
  container.appendChild(button)

  const menu = document.createElement('div')
  menu.setAttribute('data-dropdown-menu', '')
  menu.style.display = 'none'
  container.appendChild(menu)

  document.body.appendChild(container)
  return { container, button, menu }
}

function fire(el: EventTarget, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }))
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('useNavDropdowns — initial state without any dropdowns', () => {
  it('returns all-closed state and cleans up without throwing when the DOM has no [data-dropdown] elements', () => {
    const { result, unmount } = renderHook(() => useNavDropdowns())
    // Initial synchronous snapshot after mount + effect.
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
    // Cleanup path with an empty container set must not throw.
    expect(() => unmount()).not.toThrow()
  })
})

describe('useNavDropdowns — showMenu / hideMenu on a single dropdown', () => {
  it('opens the contribute menu on mouseenter and closes it after the 300ms hide timeout on mouseleave', () => {
    const { container, menu } = buildDropdown('contribute')

    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(menu.style.display).toBe('block')
    expect(menu.style.opacity).toBe('1')
    expect(menu.style.visibility).toBe('visible')
    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(true)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)

    // mouseleave schedules the hide via setTimeout(300); nothing changes yet.
    act(() => {
      fire(container, 'mouseleave')
    })
    expect(menu.style.display).toBe('block')
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(menu.style.display).toBe('none')
    expect(menu.style.opacity).toBe('0')
    expect(menu.style.visibility).toBe('hidden')
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })

    unmount()
  })

  it('routes the dropdown-name switch to isCommunityOpen for data-dropdown="community"', () => {
    const { container } = buildDropdown('community')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(result.current.isCommunityOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)

    unmount()
  })

  it('routes the dropdown-name switch to isGithubOpen for data-dropdown="github"', () => {
    const { container } = buildDropdown('github')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(result.current.isGithubOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isCommunityOpen).toBe(false)

    unmount()
  })

  it('leaves the per-name state flags all false when data-dropdown is an unknown name', () => {
    // Locks the else-fallthrough of the if/else-if chain at
    // useNavDropdowns.ts:71-79. A regression that added a default
    // assignment (e.g. defaulting to contribute) would flip one of
    // these flags true.
    const { container } = buildDropdown('mystery-menu')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)

    unmount()
  })
})

describe('useNavDropdowns — multi-dropdown showMenu closes siblings', () => {
  it('hides every other [data-dropdown-menu] and cancels their pending hide timeout when a new one is opened', () => {
    const a = buildDropdown('contribute')
    const b = buildDropdown('community')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    // Open A, then open B: A's menu should be forced to display:none by
    // the sibling-close pass inside showMenu.
    act(() => {
      fire(a.container, 'mouseenter')
    })
    expect(a.menu.style.display).toBe('block')

    act(() => {
      fire(b.container, 'mouseenter')
    })
    expect(a.menu.style.display).toBe('none')
    expect(b.menu.style.display).toBe('block')
    expect(result.current.isCommunityOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)

    unmount()
  })

  it('dispatches a close-lang-switcher CustomEvent on every showMenu call', () => {
    const { container } = buildDropdown('contribute')
    const listener = vi.fn()
    document.addEventListener('close-lang-switcher', listener)

    const { unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent)

    document.removeEventListener('close-lang-switcher', listener)
    unmount()
  })
})

describe('useNavDropdowns — button / menu hover cancel the hide timer', () => {
  it('cancels a pending hide when the dropdown-button receives mouseenter mid-timeout', () => {
    const { container, button, menu } = buildDropdown('contribute')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    act(() => {
      fire(container, 'mouseleave')
    })
    // Now within the 300ms hide window — hover the button.
    act(() => {
      fire(button, 'mouseenter')
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    // Menu should still be visible because clearHideTimeout ran.
    expect(menu.style.display).toBe('block')
    expect(result.current.isContributeOpen).toBe(true)

    unmount()
  })

  it('cancels a pending hide when the menu itself receives mouseenter, then re-schedules on menu mouseleave', () => {
    const { container, menu } = buildDropdown('contribute')
    const { unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    act(() => {
      fire(container, 'mouseleave')
    })
    act(() => {
      fire(menu, 'mouseenter')
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(menu.style.display).toBe('block')

    // menu mouseleave re-schedules the 300ms hide.
    act(() => {
      fire(menu, 'mouseleave')
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(menu.style.display).toBe('none')

    unmount()
  })
})

describe('useNavDropdowns — Escape key closes everything', () => {
  it('force-hides all dropdown menus and dispatches close-lang-switcher on Escape', () => {
    const a = buildDropdown('contribute')
    const b = buildDropdown('community')
    const langListener = vi.fn()
    document.addEventListener('close-lang-switcher', langListener)

    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(a.container, 'mouseenter')
    })
    expect(a.menu.style.display).toBe('block')
    langListener.mockClear()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(a.menu.style.display).toBe('none')
    expect(a.menu.style.opacity).toBe('0')
    expect(a.menu.style.visibility).toBe('hidden')
    expect(b.menu.style.display).toBe('none')
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
    expect(langListener).toHaveBeenCalledTimes(1)

    document.removeEventListener('close-lang-switcher', langListener)
    unmount()
  })

  it('ignores non-Escape keydown events', () => {
    const { container, menu } = buildDropdown('contribute')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(menu.style.display).toBe('block')
    expect(result.current.isContributeOpen).toBe(true)

    unmount()
  })
})

describe('useNavDropdowns — cleanup removes all listeners', () => {
  it('unmount runs without throwing after a full showMenu/hideMenu cycle', () => {
    // Locks in that the returned cleanup function executes over the
    // collected cleanups array + timer clear without raising, even
    // when a hide timeout is still in flight. A regression that
    // referenced a nulled ref during teardown would throw here.
    const { container } = buildDropdown('contribute')
    const { unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    act(() => {
      fire(container, 'mouseleave')
    })
    // Do NOT advance timers — leave the 300ms hide pending so the
    // cleanup's `if (timeoutRef.current) clearTimeout` arm runs.
    expect(() => unmount()).not.toThrow()

    // After cleanup, a stray timer fire must not blow up either.
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow()
  })
})

describe('useNavDropdowns — data-dropdown containers without a menu are skipped', () => {
  it('does not attach listeners to a [data-dropdown] container missing its [data-dropdown-menu] child', () => {
    // Covers the `if (!menu) return;` early-return at line 30.
    const container = document.createElement('div')
    container.setAttribute('data-dropdown', 'contribute')
    document.body.appendChild(container)

    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    // No listener means no state flip.
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isDropdownOpen).toBe(false)

    unmount()
  })
})
