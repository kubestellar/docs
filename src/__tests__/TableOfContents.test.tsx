// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/docs/TableOfContents.tsx.
 *
 * Baseline on main (commit 8ab4e66, `npx vitest run --coverage`):
 *   40.54% lines / 34.09% branches / 23.07% functions.
 * Uncovered ranges reported by the v8 reporter were 30–51, 65–90, 147–148,
 * i.e. the whole TOCLink sub-component, the IntersectionObserver effect,
 * and the back-to-top click handler. This file exercises:
 *   1. `toc` undefined / empty — early-returns null before any DOM output.
 *   2. Rendering the TOC list with one TOCLink per entry (depth indent math).
 *   3. Dark and light theme branches on both the wrapper and TOCLink.
 *   4. TOCLink hover state (mouse enter/leave) and active/inactive styling.
 *   5. TOCLink click: scrollIntoView + pushState when the #id exists.
 *   6. TOCLink click: guarded no-op when the #id does not exist.
 *   7. IntersectionObserver effect: constructor called, observe() invoked
 *      for each heading present in the DOM, disconnect() on unmount.
 *      An `isIntersecting` entry updates the active link styling.
 *   8. Back-to-top link click: window.scrollTo({top:0, behavior:'smooth'}).
 */

let mockResolvedTheme: string | undefined = 'dark'
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    onMouseEnter,
    onMouseLeave,
    style,
    className,
  }: {
    children: React.ReactNode
    href: string
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void
    style?: React.CSSProperties
    className?: string
  }) =>
    React.createElement(
      'a',
      { href, onClick, onMouseEnter, onMouseLeave, style, className },
      children,
    ),
}))

import { TableOfContents } from '@/components/docs/TableOfContents'

const SAMPLE_TOC = [
  { id: 'intro', value: 'Introduction', depth: 2 },
  { id: 'setup', value: 'Setup', depth: 2 },
  { id: 'setup-a', value: 'Setup: A', depth: 3 },
]

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

interface StubbedObserver {
  callback: ObserverCallback
  observed: Element[]
  disconnected: boolean
}

let observers: StubbedObserver[] = []

function installIntersectionObserverStub() {
  observers = []
  class StubIntersectionObserver {
    callback: ObserverCallback
    observed: Element[] = []
    disconnected = false
    constructor(cb: ObserverCallback) {
      this.callback = cb
      observers.push(this as unknown as StubbedObserver)
    }
    observe(el: Element) {
      this.observed.push(el)
    }
    unobserve() {}
    disconnect() {
      this.disconnected = true
    }
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
    root = null
    rootMargin = ''
    thresholds: number[] = []
  }
  ;(globalThis as unknown as { IntersectionObserver: typeof StubIntersectionObserver }).IntersectionObserver =
    StubIntersectionObserver
}

describe('TableOfContents', () => {
  beforeEach(() => {
    mockResolvedTheme = 'dark'
    installIntersectionObserverStub()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    // Wipe any stray headings left in document.body between tests so
    // observer-observe counts stay predictable.
    for (const id of ['intro', 'setup', 'setup-a']) {
      const el = document.getElementById(id)
      if (el?.parentNode) el.parentNode.removeChild(el)
    }
  })

  it('returns null when toc prop is undefined', () => {
    const { container } = render(<TableOfContents />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when toc prop is an empty array', () => {
    const { container } = render(<TableOfContents toc={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the "On This Page" header and one TOCLink per entry', () => {
    const { container, getByText } = render(<TableOfContents toc={SAMPLE_TOC} />)
    expect(getByText('On This Page')).toBeTruthy()
    // TOCLink + back-to-top link => SAMPLE_TOC.length + 1.
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(SAMPLE_TOC.length + 1)
    expect(links[0].getAttribute('href')).toBe('#intro')
    expect(links[2].getAttribute('href')).toBe('#setup-a')
    expect(links[SAMPLE_TOC.length].getAttribute('href')).toBe('#')
  })

  it('indents TOC links proportional to their depth', () => {
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    // TOCLink indent formula: (depth - 2) * 12 + 12.
    // depth 2 → 12px; depth 3 → 24px.
    expect((links[0] as HTMLElement).style.paddingLeft).toBe('12px')
    expect((links[2] as HTMLElement).style.paddingLeft).toBe('24px')
  })

  it('renders dark-theme border on the wrapper when resolvedTheme is dark', () => {
    mockResolvedTheme = 'dark'
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const aside = container.querySelector('aside') as HTMLElement
    // Component sets inline borderLeft via the `border-left` shorthand.
    expect(aside.style.borderLeft).toContain('rgb(31, 41, 55)')
  })

  it('renders light-theme border on the wrapper when resolvedTheme is light', () => {
    mockResolvedTheme = 'light'
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const aside = container.querySelector('aside') as HTMLElement
    expect(aside.style.borderLeft).toContain('rgb(229, 231, 235)')
  })

  it('applies hover styling to a TOC link on mouse enter/leave', () => {
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const link = container.querySelector('a') as HTMLAnchorElement
    const beforeColor = link.style.color
    fireEvent.mouseEnter(link)
    expect(link.style.color).not.toBe(beforeColor)
    fireEvent.mouseLeave(link)
    expect(link.style.color).toBe(beforeColor)
  })

  it('link click scrolls to the target and pushes the hash to history', () => {
    const target = document.createElement('h2')
    target.id = 'setup'
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})

    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    fireEvent.click(links[1]) // href="#setup"

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(pushState).toHaveBeenCalledWith(null, '', '#setup')
  })

  it('link click without a matching #id no-ops (guarded by `if (element)`)', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const link = container.querySelector('a') as HTMLAnchorElement
    fireEvent.click(link) // no #intro element in the DOM
    expect(pushState).not.toHaveBeenCalled()
  })

  it('IntersectionObserver observes each heading present in the DOM', () => {
    // Only two of the three IDs are present — the third must be skipped
    // by the `if (element)` guard inside the effect.
    const setup = document.createElement('h2')
    setup.id = 'setup'
    document.body.appendChild(setup)
    const setupA = document.createElement('h3')
    setupA.id = 'setup-a'
    document.body.appendChild(setupA)

    render(<TableOfContents toc={SAMPLE_TOC} />)

    expect(observers.length).toBe(1)
    const ids = observers[0].observed.map((el) => el.id).sort()
    expect(ids).toEqual(['setup', 'setup-a'])
  })

  it('an isIntersecting entry marks the matching link active', () => {
    const setup = document.createElement('h2')
    setup.id = 'setup'
    document.body.appendChild(setup)

    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    const before = (links[1] as HTMLElement).style.color

    // Drive the observer callback synchronously (wrapped in act so the
    // React setState triggers a re-render before we assert).
    act(() => {
      observers[0].callback([
        {
          isIntersecting: true,
          target: setup,
        } as unknown as IntersectionObserverEntry,
      ])
    })

    // React re-renders on state change; re-query.
    const linksAfter = container.querySelectorAll('a')
    expect((linksAfter[1] as HTMLElement).style.color).not.toBe(before)
  })

  it('unmount disconnects the IntersectionObserver', () => {
    const { unmount } = render(<TableOfContents toc={SAMPLE_TOC} />)
    expect(observers[0].disconnected).toBe(false)
    unmount()
    expect(observers[0].disconnected).toBe(true)
  })

  it('back-to-top link click scrolls the window to the top smoothly', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    const backToTop = links[SAMPLE_TOC.length]
    expect(backToTop.getAttribute('href')).toBe('#')
    fireEvent.click(backToTop)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
