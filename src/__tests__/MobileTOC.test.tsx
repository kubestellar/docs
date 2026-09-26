// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/docs/MobileTOC.tsx (baseline: 53% lines,
 * 27% functions, 42% branches — see quality-agent finding on the docs
 * repo).
 *
 * MobileTOC renders a mobile-only, sticky accordion "On this page" table
 * of contents for docs pages. It has three notable state paths that were
 * previously unexercised:
 *   1. `toc` is undefined / empty — early-returns null before any DOM output.
 *   2. Accordion open/close toggle via the header button.
 *   3. TOCLink hover state (inline-style border/color swap) + smooth-scroll
 *      click that calls scrollIntoView + pushState and closes the accordion.
 * A theme swap (dark → light) is also exercised so both branches of the
 * `isDark` inline-style ternary chain run.
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

import { MobileTOC } from '@/components/docs/MobileTOC'

const SAMPLE_TOC = [
  { id: 'intro', value: 'Introduction', depth: 2 },
  { id: 'setup', value: 'Setup', depth: 2 },
  { id: 'setup-a', value: 'Setup: A', depth: 3 },
]

describe('MobileTOC', () => {
  beforeEach(() => {
    mockResolvedTheme = 'dark'
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('returns null when toc prop is undefined', () => {
    const { container } = render(<MobileTOC />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when toc prop is an empty array', () => {
    const { container } = render(<MobileTOC toc={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the accordion header and one link per TOC entry', () => {
    const { container, getByText } = render(<MobileTOC toc={SAMPLE_TOC} />)
    expect(getByText('On This Page')).toBeTruthy()
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(SAMPLE_TOC.length)
    expect(links[0].getAttribute('href')).toBe('#intro')
    expect(links[2].getAttribute('href')).toBe('#setup-a')
  })

  it('indents TOC links proportional to their depth', () => {
    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const links = container.querySelectorAll('a')
    // depth 2 → (2-2)*16 + 12 = 12; depth 3 → (3-2)*16 + 12 = 28.
    expect((links[0] as HTMLElement).style.paddingLeft).toBe('12px')
    expect((links[2] as HTMLElement).style.paddingLeft).toBe('28px')
  })

  it('renders in dark chrome when resolvedTheme is dark', () => {
    mockResolvedTheme = 'dark'
    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const wrapper = container.querySelector('div')!
    // The wrapper's inline background switches on isDark.
    expect((wrapper as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)')
  })

  it('renders in light chrome when resolvedTheme is light', () => {
    mockResolvedTheme = 'light'
    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const wrapper = container.querySelector('div')!
    expect((wrapper as HTMLElement).style.backgroundColor).toBe('rgb(255, 255, 255)')
  })

  it('toggles the accordion max-height when the header is clicked', () => {
    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const header = container.querySelector('button') as HTMLButtonElement
    // Accordion content is the sibling div after the header button.
    const content = header.nextElementSibling as HTMLElement
    expect(content.style.maxHeight).toBe('0px')
    fireEvent.click(header)
    expect(content.style.maxHeight).toBe('400px')
    fireEvent.click(header)
    expect(content.style.maxHeight).toBe('0px')
  })

  it('applies hover styling to the header on mouse enter/leave', () => {
    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const header = container.querySelector('button') as HTMLButtonElement
    const before = header.style.backgroundColor
    fireEvent.mouseEnter(header)
    expect(header.style.backgroundColor).not.toBe(before)
    fireEvent.mouseLeave(header)
    expect(header.style.backgroundColor).toBe(before)
  })

  it('applies hover styling to a TOC link on mouse enter/leave', () => {
    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const link = container.querySelector('a') as HTMLAnchorElement
    const beforeColor = link.style.color
    fireEvent.mouseEnter(link)
    expect(link.style.color).not.toBe(beforeColor)
    fireEvent.mouseLeave(link)
    expect(link.style.color).toBe(beforeColor)
  })

  it('link click scrolls to the target, pushes the hash, and closes the accordion', () => {
    // Provide a target with a spy-able scrollIntoView.
    const target = document.createElement('h2')
    target.id = 'setup'
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})

    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const header = container.querySelector('button') as HTMLButtonElement
    const content = header.nextElementSibling as HTMLElement
    fireEvent.click(header)
    expect(content.style.maxHeight).toBe('400px')

    const links = container.querySelectorAll('a')
    fireEvent.click(links[1]) // href="#setup"

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(pushState).toHaveBeenCalledWith(null, '', '#setup')
    expect(content.style.maxHeight).toBe('0px')

    document.body.removeChild(target)
  })

  it('link click without a matching #id still closes the accordion and pushes no hash', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})

    const { container } = render(<MobileTOC toc={SAMPLE_TOC} />)
    const header = container.querySelector('button') as HTMLButtonElement
    fireEvent.click(header)
    const content = header.nextElementSibling as HTMLElement
    expect(content.style.maxHeight).toBe('400px')

    const link = container.querySelector('a') as HTMLAnchorElement
    fireEvent.click(link) // no #intro element exists in the DOM

    // Guarded by `if (element)`, so pushState must NOT have been called.
    expect(pushState).not.toHaveBeenCalled()
    // Accordion still closes.
    expect(content.style.maxHeight).toBe('0px')
  })
})
