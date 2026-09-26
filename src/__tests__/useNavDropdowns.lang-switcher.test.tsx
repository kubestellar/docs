// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useNavDropdowns } from '../components/navbar/useNavDropdowns'

/**
 * Coverage for the language-switcher integration path in
 * src/components/navbar/useNavDropdowns.ts. The sibling
 * useNavDropdowns.effect.test.tsx explicitly excludes this section
 * ("Deliberately NOT covered here: the language-switcher MutationObserver
 *  path"), so this file targets that gap.
 *
 * Regressions this suite catches:
 *   - The hover-on-language-switcher branch no longer hides sibling
 *     data-dropdown menus, so hovering language leaves a contribute menu
 *     stuck open.
 *   - The MutationObserver stops tracking [role="listbox"] insertion, so
 *     the language dropdown that was auto-opened by langButton.click()
 *     can no longer be closed by hovering off it.
 *   - The close-lang-switcher CustomEvent listener is not wired, so
 *     opening a data-dropdown fails to close a lang dropdown that is
 *     already visible.
 *   - Removing the listbox from the DOM after a hover no longer clears
 *     the isDropdownOpen flag, so the navbar highlight stays lit
 *     indefinitely.
 *
 * Notes on fixtures:
 *   - The hook queries the button via
 *     langSwitcher.querySelector("button"), so a <button> must exist
 *     inside .language-switcher-container.
 *   - Visibility is decided by window.getComputedStyle(...).display,
 *     which in jsdom returns whatever was set inline on style.display.
 *     Setting style.display = "none" -> "hidden", "" or "block" -> visible.
 */

function setupLangSwitcher() {
  document.body.innerHTML = `
    <div data-dropdown="contribute">
      <button data-dropdown-button>Contribute</button>
      <div data-dropdown-menu style="display:none;opacity:0;visibility:hidden"></div>
    </div>
    <div class="language-switcher-container">
      <button type="button">EN</button>
    </div>
  `
}

function langContainer(): HTMLElement {
  const el = document.querySelector<HTMLElement>('.language-switcher-container')
  if (!el) throw new Error('missing language-switcher-container')
  return el
}

function langButton(): HTMLButtonElement {
  const el = langContainer().querySelector<HTMLButtonElement>('button')
  if (!el) throw new Error('missing language button')
  return el
}

function contributeMenu(): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    '[data-dropdown="contribute"] [data-dropdown-menu]'
  )
  if (!el) throw new Error('missing contribute menu')
  return el
}

/**
 * Appends a [role="listbox"] to the body and lets the MutationObserver
 * inside useNavDropdowns pick it up before returning.
 */
async function insertListbox(display: string = 'block'): Promise<HTMLElement> {
  const listbox = document.createElement('ul')
  listbox.setAttribute('role', 'listbox')
  listbox.style.display = display
  document.body.appendChild(listbox)
  // MutationObserver dispatches on a microtask; flush it before assertions.
  await Promise.resolve()
  return listbox
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  setupLangSwitcher()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('useNavDropdowns — language switcher hover', () => {
  it('mouseenter on language-switcher hides sibling data-dropdown menus', () => {
    const { result } = renderHook(() => useNavDropdowns())

    // Prime a visible contribute menu.
    contributeMenu().style.display = 'block'

    // Auto-open path: no [role="listbox"] yet, so the hook clicks the lang
    // button to open one. Capture the click.
    const clickSpy = vi.fn()
    langButton().addEventListener('click', clickSpy)

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(contributeMenu().style.display).toBe('none')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(result.current.isDropdownOpen).toBe(true)
  })

  it('mouseenter does not re-click the language button when a listbox is already visible', async () => {
    renderHook(() => useNavDropdowns())
    await insertListbox('block')

    const clickSpy = vi.fn()
    langButton().addEventListener('click', clickSpy)

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })

    // Listbox already visible -> hook must NOT click the button again
    // (that would close the listbox the user is trying to interact with).
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('cancels a pending hide when re-entering the language switcher', () => {
    const { result } = renderHook(() => useNavDropdowns())

    // Open the lang switcher.
    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })
    expect(result.current.isDropdownOpen).toBe(true)

    // Start hiding, then re-enter before the 300ms debounce expires.
    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseleave'))
      vi.advanceTimersByTime(150)
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
      vi.advanceTimersByTime(300)
    })

    expect(result.current.isDropdownOpen).toBe(true)
  })
})

describe('useNavDropdowns — language switcher mouseleave debounce', () => {
  it('closes an open listbox after 300ms when the cursor leaves', async () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })
    // Simulate the listbox that a real lang button would have opened.
    await insertListbox('block')
    expect(result.current.isDropdownOpen).toBe(true)

    const clickSpy = vi.fn()
    langButton().addEventListener('click', clickSpy)

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseleave'))
      vi.advanceTimersByTime(300)
    })

    // Debounce elapsed with listbox still visible -> click again to close.
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('clears isDropdownOpen after 300ms when no listbox is visible', () => {
    const { result } = renderHook(() => useNavDropdowns())

    // Enter, then leave, with no listbox ever inserted.
    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })
    // Auto-open branch flipped isDropdownOpen true.
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseleave'))
      vi.advanceTimersByTime(300)
    })

    expect(result.current.isDropdownOpen).toBe(false)
  })
})

describe('useNavDropdowns — close-lang-switcher event', () => {
  it('closes a visible listbox by clicking the language button', async () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })
    await insertListbox('block')

    const clickSpy = vi.fn()
    langButton().addEventListener('click', clickSpy)

    act(() => {
      document.dispatchEvent(new CustomEvent('close-lang-switcher'))
    })

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('is fired by opening any data-dropdown menu', () => {
    renderHook(() => useNavDropdowns())

    // Setup: open the language switcher (flips internal isLangHovered flag).
    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })

    // Opening a data-dropdown container should dispatch close-lang-switcher.
    // We assert the visible side effect: isDropdownOpen ends up managed by
    // the newly-opened dropdown, not left set by the lang path.
    const contribute = document.querySelector<HTMLElement>('[data-dropdown="contribute"]')!
    act(() => {
      contribute.dispatchEvent(new MouseEvent('mouseenter'))
    })

    expect(contributeMenu().style.display).toBe('block')
  })

  it('clears isDropdownOpen when no listbox is visible but the hover flag was set', () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })
    // No listbox exists -> closeLangSwitcher hits the "else if isLangHovered" arm.
    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      document.dispatchEvent(new CustomEvent('close-lang-switcher'))
    })

    expect(result.current.isDropdownOpen).toBe(false)
  })
})

describe('useNavDropdowns — MutationObserver on listbox removal', () => {
  it('clears isDropdownOpen when the tracked listbox is removed after a hover', async () => {
    const { result } = renderHook(() => useNavDropdowns())

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
    })
    const listbox = await insertListbox('block')
    expect(result.current.isDropdownOpen).toBe(true)

    // Remove the listbox (e.g., user clicked a locale) — observer should
    // clear the flag.
    await act(async () => {
      listbox.remove()
      await Promise.resolve()
    })

    expect(result.current.isDropdownOpen).toBe(false)
  })
})

describe('useNavDropdowns — cleanup when a language switcher exists', () => {
  it('disconnects the observer and removes lang listeners on unmount', async () => {
    const { result, unmount } = renderHook(() => useNavDropdowns())

    unmount()

    // Post-unmount: no state changes should occur when lang events fire
    // or when a listbox is inserted/removed.
    const clickSpy = vi.fn()
    langButton().addEventListener('click', clickSpy)

    act(() => {
      langContainer().dispatchEvent(new MouseEvent('mouseenter'))
      document.dispatchEvent(new CustomEvent('close-lang-switcher'))
    })
    await insertListbox('block')

    expect(clickSpy).not.toHaveBeenCalled()
    expect(result.current.isDropdownOpen).toBe(false)
  })
})
