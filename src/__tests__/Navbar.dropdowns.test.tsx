// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

/**
 * Integration coverage for the declarative navbar dropdowns (docs#7095).
 *
 * Before #7095 the hook hid menus by writing `menu.style.display` from a
 * useEffect while a separate boolean drove `aria-expanded`, so the two could
 * disagree. Now both derive from one `openDropdown` value; these tests hover
 * the real Navbar and assert the menu's `hidden` attribute, the trigger's
 * `aria-expanded`, the blur overlay and the language listbox all move
 * together.
 */

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}))

vi.mock('../components/index', async () => {
  const actual = await vi.importActual<
    typeof import('../components/LanguageSwitcher')
  >('../components/LanguageSwitcher')
  return {
    GridLines: () => null,
    StarField: () => null,
    LanguageSwitcher: actual.default,
  }
})

vi.mock('../components/navbar/useGithubStats', () => ({
  useGithubStats: () => ({ stars: '1', forks: '2', watchers: '3' }),
}))

import Navbar from '../components/Navbar'
import { DROPDOWN_CLOSE_DELAY_MS } from '../components/navbar/useNavDropdowns'

const OVERLAY_SELECTOR = '.fixed.inset-0'

function container(name: string) {
  return document.querySelector<HTMLElement>(`[data-dropdown="${name}"]`)!
}
function menu(name: string) {
  return container(name).querySelector<HTMLElement>('[data-dropdown-menu]')!
}
function trigger(name: string) {
  return container(name).querySelector<HTMLElement>('[data-dropdown-button]')!
}
function langContainer() {
  return document.querySelector<HTMLElement>('.language-switcher-container')!
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Navbar dropdowns — single source of truth', () => {
  it('renders every menu hidden with aria-expanded=false and no overlay', () => {
    render(<Navbar />)
    for (const name of ['contribute', 'community', 'github']) {
      expect(menu(name).hidden).toBe(true)
      expect(menu(name).style.display).toBe('')
    }
    expect(trigger('contribute').getAttribute('aria-expanded')).toBe('false')
    expect(trigger('community').getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })

  it('hover opens exactly one menu and keeps aria-expanded in lockstep', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(container('contribute'))

    expect(menu('contribute').hidden).toBe(false)
    expect(trigger('contribute').getAttribute('aria-expanded')).toBe('true')
    expect(menu('community').hidden).toBe(true)
    expect(trigger('community').getAttribute('aria-expanded')).toBe('false')
    expect(menu('github').hidden).toBe(true)
    expect(document.querySelector(OVERLAY_SELECTOR)).not.toBeNull()
  })

  it('entering a second dropdown closes the first immediately', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(container('contribute'))
    fireEvent.mouseLeave(container('contribute'))
    fireEvent.mouseEnter(container('github'))

    expect(menu('contribute').hidden).toBe(true)
    expect(trigger('contribute').getAttribute('aria-expanded')).toBe('false')
    expect(menu('github').hidden).toBe(false)

    // The pending close for contribute must not clobber github.
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS))
    expect(menu('github').hidden).toBe(false)
  })

  it('mouseleave closes after the debounce, and re-entering cancels it', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(container('community'))
    fireEvent.mouseLeave(container('community'))
    expect(menu('community').hidden).toBe(false)

    fireEvent.mouseEnter(container('community'))
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS))
    expect(menu('community').hidden).toBe(false)

    fireEvent.mouseLeave(container('community'))
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS))
    expect(menu('community').hidden).toBe(true)
    expect(trigger('community').getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })

  it('Escape closes any open menu', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(container('github'))
    expect(menu('github').hidden).toBe(false)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menu('github').hidden).toBe(true)
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })
})

describe('Navbar dropdowns — language switcher shares the same state', () => {
  it('hovering the language switcher opens its listbox and shows the overlay', () => {
    render(<Navbar />)
    expect(screen.queryByRole('listbox')).toBeNull()
    fireEvent.mouseEnter(langContainer())
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(document.querySelector(OVERLAY_SELECTOR)).not.toBeNull()
  })

  it('opening the language switcher closes an open nav menu, and vice versa', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(container('contribute'))
    fireEvent.mouseLeave(container('contribute'))
    fireEvent.mouseEnter(langContainer())
    expect(menu('contribute').hidden).toBe(true)
    expect(screen.getByRole('listbox')).toBeTruthy()

    fireEvent.mouseLeave(langContainer())
    fireEvent.mouseEnter(container('community'))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(menu('community').hidden).toBe(false)
  })

  it('leaving the language switcher closes the listbox after the debounce', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(langContainer())
    fireEvent.mouseLeave(langContainer())
    expect(screen.getByRole('listbox')).toBeTruthy()
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })

  it('clicking the language button toggles through the shared state', () => {
    render(<Navbar />)
    const button = langContainer().querySelector('button')!
    fireEvent.click(button)
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(document.querySelector(OVERLAY_SELECTOR)).not.toBeNull()
    fireEvent.click(button)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })

  it('an outside mousedown closes the language listbox but not an unrelated open menu', () => {
    render(<Navbar />)
    fireEvent.mouseEnter(container('github'))
    // LanguageSwitcher's outside-click handler fires; it must not clear github.
    fireEvent.mouseDown(container('github'))
    expect(menu('github').hidden).toBe(false)

    fireEvent.mouseLeave(container('github'))
    fireEvent.mouseEnter(langContainer())
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('does not install a MutationObserver or global CustomEvent listeners', () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe')
    const addSpy = vi.spyOn(document, 'addEventListener')
    render(<Navbar />)
    expect(observeSpy).not.toHaveBeenCalled()
    expect(
      addSpy.mock.calls.some(([type]) => type === 'close-lang-switcher')
    ).toBe(false)
    observeSpy.mockRestore()
    addSpy.mockRestore()
  })
})
