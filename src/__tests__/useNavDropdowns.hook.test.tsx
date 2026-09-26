// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNavDropdowns } from '../components/navbar/useNavDropdowns'

/**
 * Coverage for the useNavDropdowns hook — previously 0% because vitest
 * ran in `environment: 'node'`, which has no `document`. This file opts
 * in to jsdom (like Mermaid.effect.test.tsx and useSharedConfig.hook.test.tsx)
 * to reach the DOM-driven event wiring.
 *
 * The hook attaches listeners to every element matching `[data-dropdown]`,
 * plus optional wiring for `.language-switcher-container`. The tests below
 * seed the document body BEFORE `renderHook` so the hook's useEffect sees
 * the containers on first mount.
 */

const CONTAINER_HTML = `
  <div data-dropdown="contribute">
    <button data-dropdown-button>Contribute</button>
    <div data-dropdown-menu style="display: none"></div>
  </div>
  <div data-dropdown="community">
    <button data-dropdown-button>Community</button>
    <div data-dropdown-menu style="display: none"></div>
  </div>
  <div data-dropdown="github">
    <button data-dropdown-button>GitHub</button>
    <div data-dropdown-menu style="display: none"></div>
  </div>
`

function seed(html: string) {
  document.body.innerHTML = html
}

function dispatch(el: EventTarget, type: string, init?: EventInit) {
  el.dispatchEvent(new Event(type, { bubbles: true, ...init }))
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

  it('initial state is all-closed', () => {
    const { result } = renderHook(() => useNavDropdowns())
    expect(result.current.isDropdownOpen).toBe(false)
    expect(result.current.isContributeOpen).toBe(false)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
  })

  it('mouseenter on contribute container opens contribute + isDropdownOpen', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    const menu = contribute.querySelector<HTMLElement>('[data-dropdown-menu]')!

    act(() => {
      dispatch(contribute, 'mouseenter')
    })

    expect(result.current.isContributeOpen).toBe(true)
    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isCommunityOpen).toBe(false)
    expect(result.current.isGithubOpen).toBe(false)
    expect(menu.style.display).toBe('block')
    expect(menu.style.opacity).toBe('1')
    expect(menu.style.visibility).toBe('visible')
  })

  it('mouseenter on community opens community and closes any other menu', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    const contributeMenu = contribute.querySelector<HTMLElement>(
      '[data-dropdown-menu]',
    )!
    const community = document.querySelector<HTMLElement>(
      '[data-dropdown="community"]',
    )!

    act(() => {
      dispatch(contribute, 'mouseenter')
    })
    expect(contributeMenu.style.display).toBe('block')

    act(() => {
      dispatch(community, 'mouseenter')
    })

    expect(result.current.isCommunityOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(false)
    // The "close all other dropdowns" arm should have hidden contribute.
    expect(contributeMenu.style.display).toBe('none')
  })

  it('mouseenter on github toggles isGithubOpen', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())
    const github = document.querySelector<HTMLElement>(
      '[data-dropdown="github"]',
    )!

    act(() => {
      dispatch(github, 'mouseenter')
    })

    expect(result.current.isGithubOpen).toBe(true)
    expect(result.current.isDropdownOpen).toBe(true)
  })

  it('mouseleave schedules a 300ms hide; timer fire closes the menu', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    const menu = contribute.querySelector<HTMLElement>('[data-dropdown-menu]')!

    act(() => {
      dispatch(contribute, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      dispatch(contribute, 'mouseleave')
    })
    // Timer scheduled but not fired yet.
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.isDropdownOpen).toBe(false)
    expect(result.current.isContributeOpen).toBe(false)
    expect(menu.style.display).toBe('none')
    expect(menu.style.opacity).toBe('0')
    expect(menu.style.visibility).toBe('hidden')
  })

  it('button mouseenter cancels a pending hide (clearHideTimeout)', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    const button = contribute.querySelector<HTMLElement>(
      '[data-dropdown-button]',
    )!

    act(() => {
      dispatch(contribute, 'mouseenter')
      dispatch(contribute, 'mouseleave')
      // Cancel the pending hide by hovering back onto the button.
      dispatch(button, 'mouseenter')
      vi.advanceTimersByTime(300)
    })

    // Because the hide was cancelled, the menu should still be open.
    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(true)
  })

  it('menu mouseenter cancels a pending hide and mouseleave re-schedules', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    const menu = contribute.querySelector<HTMLElement>('[data-dropdown-menu]')!

    act(() => {
      dispatch(contribute, 'mouseenter')
      dispatch(contribute, 'mouseleave')
      dispatch(menu, 'mouseenter')
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      dispatch(menu, 'mouseleave')
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('Escape keydown closes all menus immediately', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    const menu = contribute.querySelector<HTMLElement>('[data-dropdown-menu]')!

    act(() => {
      dispatch(contribute, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.isDropdownOpen).toBe(false)
    expect(result.current.isContributeOpen).toBe(false)
    expect(menu.style.display).toBe('none')
    expect(menu.style.opacity).toBe('0')
    expect(menu.style.visibility).toBe('hidden')
  })

  it('non-Escape keys do not close the menu', () => {
    seed(CONTAINER_HTML)
    const { result } = renderHook(() => useNavDropdowns())

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!

    act(() => {
      dispatch(contribute, 'mouseenter')
    })

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })

    expect(result.current.isDropdownOpen).toBe(true)
    expect(result.current.isContributeOpen).toBe(true)
  })

  it('showMenu dispatches close-lang-switcher on document', () => {
    seed(CONTAINER_HTML)
    renderHook(() => useNavDropdowns())

    const spy = vi.fn()
    document.addEventListener('close-lang-switcher', spy)

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    act(() => {
      dispatch(contribute, 'mouseenter')
    })

    expect(spy).toHaveBeenCalledTimes(1)
    document.removeEventListener('close-lang-switcher', spy)
  })

  it('container without a [data-dropdown-menu] child is skipped without error', () => {
    seed(`
      <div data-dropdown="contribute">
        <button data-dropdown-button>Contribute</button>
      </div>
    `)
    // No throw during effect; state stays initial.
    const { result } = renderHook(() => useNavDropdowns())
    expect(result.current.isDropdownOpen).toBe(false)

    // Hovering still works without a menu — just no state change.
    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    act(() => {
      dispatch(contribute, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('container without a [data-dropdown-button] child still wires container + menu', () => {
    seed(`
      <div data-dropdown="contribute">
        <div data-dropdown-menu style="display: none"></div>
      </div>
    `)
    const { result } = renderHook(() => useNavDropdowns())
    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!

    act(() => {
      dispatch(contribute, 'mouseenter')
    })
    expect(result.current.isContributeOpen).toBe(true)
  })

  it('cleanup on unmount removes handlers (mouseenter has no effect after unmount)', () => {
    seed(CONTAINER_HTML)
    const { result, unmount } = renderHook(() => useNavDropdowns())

    unmount()

    const contribute = document.querySelector<HTMLElement>(
      '[data-dropdown="contribute"]',
    )!
    act(() => {
      dispatch(contribute, 'mouseenter')
    })
    // After unmount the state closure is dead; the DOM listener was removed,
    // so the state result stays initial.
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('language switcher: mouseenter with no listbox clicks the button and opens', () => {
    seed(`
      <div class="language-switcher-container">
        <button>EN</button>
      </div>
    `)
    const langSwitcher = document.querySelector<HTMLElement>(
      '.language-switcher-container',
    )!
    const button = langSwitcher.querySelector<HTMLButtonElement>('button')!
    const clickSpy = vi.spyOn(button, 'click')

    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      dispatch(langSwitcher, 'mouseenter')
    })

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(result.current.isDropdownOpen).toBe(true)
  })

  it('language switcher: close-lang-switcher event closes when hovered', () => {
    seed(`
      <div class="language-switcher-container">
        <button>EN</button>
      </div>
    `)
    const langSwitcher = document.querySelector<HTMLElement>(
      '.language-switcher-container',
    )!

    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      dispatch(langSwitcher, 'mouseenter')
    })
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      document.dispatchEvent(new CustomEvent('close-lang-switcher'))
    })
    expect(result.current.isDropdownOpen).toBe(false)
  })
})
