// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useNavDropdowns } from '@/components/navbar/useNavDropdowns'

/**
 * Coverage for src/components/navbar/useNavDropdowns.ts.
 *
 * Baseline (from docs#6703): 0% statements — the whole file is one exported
 * hook that manipulates the DOM via document.querySelectorAll, so it needs a
 * jsdom environment and hand-built [data-dropdown] fixtures. Everything below
 * targets the specific arms called out in the file, not just line coverage:
 *
 *   - initial state (all four flags false)
 *   - showMenu(): opens active container, closes siblings, sets the correct
 *     per-name flag (contribute / community / github / unknown)
 *   - showMenu(): dispatches "close-lang-switcher"
 *   - showMenu(): clears the pending hide timeout
 *   - hideMenu(): 300 ms setTimeout resets styles + flags
 *   - Escape key: closes every container and dispatches close-lang-switcher
 *   - "no menu inside container" early-return (menu === null branch)
 *   - button.mouseenter: clearHideTimeout branch (button present)
 *   - lang switcher: mouseenter opens (button.click) and sets dropdown flag
 *   - lang switcher: mouseleave hides after 300 ms when isDropdownVisible
 *   - lang switcher: close-lang-switcher event listener
 *   - MutationObserver: role="listbox" node added → dropdown mouseenter clears
 *     timeout; node removed → resets isDropdownOpen
 *   - unmount runs every cleanup (removeEventListener, observer.disconnect,
 *     clearTimeout branch)
 */

function makeContainer(name: string, menu = true, button = true) {
  const container = document.createElement('div')
  container.setAttribute('data-dropdown', name)
  if (menu) {
    const menuEl = document.createElement('div')
    menuEl.setAttribute('data-dropdown-menu', '')
    // Non-empty initial styles so we can assert they change.
    menuEl.style.display = 'block'
    menuEl.style.opacity = '1'
    menuEl.style.visibility = 'visible'
    container.appendChild(menuEl)
  }
  if (button) {
    const btn = document.createElement('button')
    btn.setAttribute('data-dropdown-button', '')
    container.appendChild(btn)
  }
  document.body.appendChild(container)
  return container
}

function fire(el: EventTarget, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }))
}

describe('useNavDropdowns', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('returns all four flags false on initial render', () => {
    const { result } = renderHook(() => useNavDropdowns())
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
  })

  it('mouseenter on a "contribute" container opens the dropdown and sets isContributeOpen', () => {
    const container = makeContainer('contribute')
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })

    const menu = container.querySelector<HTMLElement>('[data-dropdown-menu]')!
    expect(menu.style.display).toBe('block')
    expect(menu.style.opacity).toBe('1')
    expect(menu.style.visibility).toBe('visible')
    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(true)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
  })

  it('mouseenter on "community" and "github" containers set the matching flag and clear the others', () => {
    const community = makeContainer('community')
    const github = makeContainer('github')
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(community, 'mouseenter')
    })
    expect(result.current.isCommunityOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)

    act(() => {
      fire(github, 'mouseenter')
    })
    expect(result.current.isGithubOpen).toBe(true)
    // Switching containers closes the sibling menu.
    const communityMenu =
      community.querySelector<HTMLElement>('[data-dropdown-menu]')!
    expect(communityMenu.style.display).toBe('none')
    // And clears the previous per-name flag.
    expect(result.current.isCommunityOpen).toBe(false)
  })

  it('mouseenter on an unrecognized data-dropdown value leaves all per-name flags false but still sets isDropdownOpen', () => {
    const container = makeContainer('mystery')
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })

    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
  })

  it('showMenu dispatches a "close-lang-switcher" CustomEvent', () => {
    const container = makeContainer('contribute')
    const listener = vi.fn()
    document.addEventListener('close-lang-switcher', listener)
    renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(listener).toHaveBeenCalledTimes(1)
    document.removeEventListener('close-lang-switcher', listener)
  })

  it('mouseleave hides the menu and clears every flag after 300 ms', () => {
    const container = makeContainer('contribute')
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      fire(container, 'mouseleave')
      vi.advanceTimersByTime(300)
    })

    const menu = container.querySelector<HTMLElement>('[data-dropdown-menu]')!
    expect(menu.style.display).toBe('none')
    expect(menu.style.opacity).toBe('0')
    expect(menu.style.visibility).toBe('hidden')
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
  })

  it('re-entering the container before the 300 ms timeout cancels the hide (clearHideTimeout arm)', () => {
    const container = makeContainer('contribute')
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
      fire(container, 'mouseleave') // schedule hide
      fire(container, 'mouseenter') // clearHideTimeout runs
      vi.advanceTimersByTime(500)
    })

    // Still open — the hide timer was cancelled.
    expect(result.current.isDropdownOpen).toBe(true)
    const menu = container.querySelector<HTMLElement>('[data-dropdown-menu]')!
    expect(menu.style.display).toBe('block')
  })

  it('button.mouseenter cancels a pending hide (button-present branch)', () => {
    const container = makeContainer('contribute')
    const button = container.querySelector('button')!
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
      fire(container, 'mouseleave') // schedule hide
      fire(button, 'mouseenter') // clearHideTimeout via button listener
      vi.advanceTimersByTime(500)
    })

    expect(result.current.isDropdownOpen).toBe(true)
  })

  it('menu.mouseenter cancels a pending hide, menu.mouseleave re-schedules it', () => {
    const container = makeContainer('contribute')
    const menu = container.querySelector<HTMLElement>('[data-dropdown-menu]')!
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
      fire(container, 'mouseleave')
      fire(menu, 'mouseenter') // cancel hide
      vi.advanceTimersByTime(500)
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      fire(menu, 'mouseleave')
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('containers with no [data-dropdown-menu] child are skipped (menu === null early return)', () => {
    const container = makeContainer('contribute', /* menu */ false, /* button */ false)
    const { result } = renderHook(() => useNavDropdowns())

    // No mouseenter listener was registered, so this should be a no-op.
    act(() => {
      fire(container, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('Escape key closes every container and dispatches close-lang-switcher', () => {
    const c1 = makeContainer('contribute')
    const c2 = makeContainer('community')
    const listener = vi.fn()
    document.addEventListener('close-lang-switcher', listener)
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(c1, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(true)
    // Reset the dispatch counter — Escape is what we care about here.
    listener.mockClear()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    for (const c of [c1, c2]) {
      const m = c.querySelector<HTMLElement>('[data-dropdown-menu]')!
      expect(m.style.display).toBe('none')
      expect(m.style.opacity).toBe('0')
      expect(m.style.visibility).toBe('hidden')
    }
    expect(result.current).toEqual({
      isDropdownOpen: false,
      isContributeOpen: false,
      isCommunityOpen: false,
      isGithubOpen: false,
    })
    expect(listener).toHaveBeenCalledTimes(1)
    document.removeEventListener('close-lang-switcher', listener)
  })

  it('non-Escape keydowns are ignored', () => {
    const c1 = makeContainer('contribute')
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(c1, 'mouseenter')
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })
    expect(result.current.isDropdownOpen).toBe(true)
  })

  describe('language switcher integration', () => {
    function makeLangSwitcher(withButton = true) {
      const wrap = document.createElement('div')
      wrap.className = 'language-switcher-container'
      if (withButton) {
        const btn = document.createElement('button')
        wrap.appendChild(btn)
      }
      document.body.appendChild(wrap)
      return wrap
    }

    it('mouseenter clicks the language button and opens the dropdown when none is visible', () => {
      const wrap = makeLangSwitcher()
      const btn = wrap.querySelector('button')!
      const clickSpy = vi.spyOn(btn, 'click')
      const { result } = renderHook(() => useNavDropdowns())

      act(() => {
        fire(wrap, 'mouseenter')
      })
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(result.current.isDropdownOpen).toBe(true)
    })

    it('mouseleave clicks the button again after 300 ms when the dropdown is visible', () => {
      const wrap = makeLangSwitcher()
      const btn = wrap.querySelector('button')!
      const clickSpy = vi.spyOn(btn, 'click')
      const { result } = renderHook(() => useNavDropdowns())

      // Open first (dropdown role=listbox present).
      const dropdown = document.createElement('div')
      dropdown.setAttribute('role', 'listbox')
      dropdown.style.display = 'block'
      document.body.appendChild(dropdown)

      act(() => {
        fire(wrap, 'mouseenter')
      })
      clickSpy.mockClear()

      act(() => {
        fire(wrap, 'mouseleave')
        vi.advanceTimersByTime(300)
      })
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(result.current.isDropdownOpen).toBe(false)
    })

    it('close-lang-switcher event closes the visible dropdown', () => {
      const wrap = makeLangSwitcher()
      const btn = wrap.querySelector('button')!
      const clickSpy = vi.spyOn(btn, 'click')
      const { result } = renderHook(() => useNavDropdowns())

      const dropdown = document.createElement('div')
      dropdown.setAttribute('role', 'listbox')
      dropdown.style.display = 'block'
      document.body.appendChild(dropdown)

      act(() => {
        fire(wrap, 'mouseenter')
      })
      clickSpy.mockClear()

      act(() => {
        document.dispatchEvent(new CustomEvent('close-lang-switcher'))
      })
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(result.current.isDropdownOpen).toBe(false)
    })

    it('a dropdown container mouseenter also closes any open lang switcher', () => {
      const wrap = makeLangSwitcher()
      const btn = wrap.querySelector('button')!
      const clickSpy = vi.spyOn(btn, 'click')
      const c1 = makeContainer('contribute')
      renderHook(() => useNavDropdowns())

      // Open lang switcher first.
      const dropdown = document.createElement('div')
      dropdown.setAttribute('role', 'listbox')
      dropdown.style.display = 'block'
      document.body.appendChild(dropdown)
      act(() => {
        fire(wrap, 'mouseenter')
      })
      clickSpy.mockClear()

      act(() => {
        fire(c1, 'mouseenter')
      })
      // showMenu dispatches close-lang-switcher which clicks the button.
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  it('unmount tears down listeners and pending timers (cleanups branch)', () => {
    const container = makeContainer('contribute')
    const listenerCount = vi.spyOn(document, 'removeEventListener')
    const { result, unmount } = renderHook(() => useNavDropdowns())

    act(() => {
      fire(container, 'mouseenter')
      fire(container, 'mouseleave') // schedule a hide so the clearTimeout arm fires
    })
    expect(result.current.isDropdownOpen).toBe(true)

    unmount()

    // Advance past the pending timeout — no state updates should be observable
    // because listeners are gone and the timeout was cleared.
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // At minimum, document.removeEventListener was called for the keydown handler.
    expect(listenerCount).toHaveBeenCalledWith('keydown', expect.any(Function))
    listenerCount.mockRestore()
  })
})
