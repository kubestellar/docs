// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/docs/TableOfContents.tsx (baseline: 41.7%
 * lines, 23.1% functions, 34.1% branches — see quality-agent finding on
 * the docs repo).
 *
 * TableOfContents renders a desktop-only sticky "On this page" nav for
 * docs pages, plus a "Back to top" link. It has these paths that were
 * previously unexercised:
 *   1. `toc` undefined / empty → early-returns null before any DOM output.
 *   2. TOCLink hover swap (inline border/color) + smooth-scroll click that
 *      calls scrollIntoView + history.pushState.
 *   3. Depth-based `paddingLeft` indent for each link.
 *   4. IntersectionObserver wiring: observer.observe is called for every
 *      TOC id that resolves to a real DOM heading; when an entry becomes
 *      intersecting, the corresponding link picks up the "active" styling.
 *   5. Dark vs. light chrome (both branches of the isDark ternaries).
 *   6. Back-to-top link click → window.scrollTo({top:0, behavior:'smooth'}).
 *   7. Cleanup path → observer.disconnect on unmount.
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

// Capture the last observer instance so tests can drive intersection events
// and assert on observe/disconnect calls.
let lastObserver: FakeIntersectionObserver | null = null

class FakeIntersectionObserver {
  cb: IntersectionObserverCallback
  observed: Element[] = []
  disconnected = false
  root = null
  rootMargin = ''
  thresholds: number[] = []
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
    lastObserver = this
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
  // Test helper — not part of the DOM interface.
  fire(target: Element) {
    this.cb(
      [
        {
          isIntersecting: true,
          target,
        } as unknown as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

describe('TableOfContents', () => {
  beforeEach(() => {
    mockResolvedTheme = 'dark'
    lastObserver = null
    vi.stubGlobal(
      'IntersectionObserver',
      FakeIntersectionObserver as unknown as typeof IntersectionObserver,
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    // Clean up any headings tests appended to document.body.
    document.body
      .querySelectorAll('[data-test-heading]')
      .forEach((n) => n.parentNode?.removeChild(n))
  })

  it('returns null when toc prop is undefined', () => {
    const { container } = render(<TableOfContents />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when toc prop is an empty array', () => {
    const { container } = render(<TableOfContents toc={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the "On This Page" heading, one link per entry, and a back-to-top link', () => {
    const { container, getByText } = render(<TableOfContents toc={SAMPLE_TOC} />)
    expect(getByText('On This Page')).toBeTruthy()
    const links = container.querySelectorAll('a')
    // 3 TOC links + 1 back-to-top link.
    expect(links.length).toBe(SAMPLE_TOC.length + 1)
    expect(links[0].getAttribute('href')).toBe('#intro')
    expect(links[2].getAttribute('href')).toBe('#setup-a')
    expect(links[3].getAttribute('href')).toBe('#')
    expect(links[3].textContent).toContain('Back to top')
  })

  it('indents TOC links proportional to their depth', () => {
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    // depth 2 → (2-2)*12 + 12 = 12; depth 3 → (3-2)*12 + 12 = 24.
    expect((links[0] as HTMLElement).style.paddingLeft).toBe('12px')
    expect((links[2] as HTMLElement).style.paddingLeft).toBe('24px')
  })

  it('renders the aside chrome differently in dark vs. light theme', () => {
    mockResolvedTheme = 'dark'
    const dark = render(<TableOfContents toc={SAMPLE_TOC} />)
    const darkAside = dark.container.querySelector('aside') as HTMLElement
    // Dark border uses #1f2937; light uses #e5e7eb. JSDOM normalizes to rgb().
    const darkBorder = darkAside.style.borderLeft
    dark.unmount()

    mockResolvedTheme = 'light'
    const light = render(<TableOfContents toc={SAMPLE_TOC} />)
    const lightAside = light.container.querySelector('aside') as HTMLElement
    const lightBorder = lightAside.style.borderLeft
    expect(darkBorder).not.toBe('')
    expect(lightBorder).not.toBe('')
    expect(darkBorder).not.toBe(lightBorder)
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

  it('link click scrolls to the target heading and pushes the hash', () => {
    const target = document.createElement('h2')
    target.id = 'setup'
    target.setAttribute('data-test-heading', '1')
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

  it('link click without a matching #id in the DOM is a no-op (guarded by if(element))', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const link = container.querySelector('a') as HTMLAnchorElement
    fireEvent.click(link) // #intro not present in the DOM
    expect(pushState).not.toHaveBeenCalled()
  })

  it('back-to-top link click calls window.scrollTo({top:0, behavior:"smooth"})', () => {
    const scrollTo = vi.fn()
    // window.scrollTo isn't implemented in jsdom by default; stub it.
    vi.stubGlobal('scrollTo', scrollTo as unknown as typeof window.scrollTo)

    const { container } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    const backToTop = links[links.length - 1]
    fireEvent.click(backToTop)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('registers an IntersectionObserver for each TOC id that resolves to a DOM heading', () => {
    // Only 'setup' exists in the DOM; 'intro' and 'setup-a' don't.
    const setup = document.createElement('h2')
    setup.id = 'setup'
    setup.setAttribute('data-test-heading', '1')
    document.body.appendChild(setup)

    render(<TableOfContents toc={SAMPLE_TOC} />)
    expect(lastObserver).not.toBeNull()
    expect(lastObserver!.observed.length).toBe(1)
    expect(lastObserver!.observed[0]).toBe(setup)
  })

  it('marks a link as active (bold, colored border) when its heading becomes intersecting', () => {
    const setup = document.createElement('h2')
    setup.id = 'setup'
    setup.setAttribute('data-test-heading', '1')
    document.body.appendChild(setup)

    const { container, rerender } = render(<TableOfContents toc={SAMPLE_TOC} />)
    const links = () => container.querySelectorAll('a')

    // Baseline: nothing active — fontWeight is 400 for all TOC links.
    expect((links()[1] as HTMLElement).style.fontWeight).toBe('400')

    // Fire an intersection for #setup; wrap in act so the setState settles.
    act(() => {
      lastObserver!.fire(setup)
    })
    rerender(<TableOfContents toc={SAMPLE_TOC} />)

    expect((links()[1] as HTMLElement).style.fontWeight).toBe('500')
  })

  it('disconnects the observer on unmount', () => {
    const setup = document.createElement('h2')
    setup.id = 'setup'
    setup.setAttribute('data-test-heading', '1')
    document.body.appendChild(setup)

    const { unmount } = render(<TableOfContents toc={SAMPLE_TOC} />)
    expect(lastObserver).not.toBeNull()
    expect(lastObserver!.disconnected).toBe(false)
    unmount()
    expect(lastObserver!.disconnected).toBe(true)
  })
})
