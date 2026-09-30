// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/docs/DocsFooter.tsx (baseline 0%).
 *
 * DocsFooter is the themed variant of the marketing Footer used on docs pages.
 * It adds a `mounted` gate (to avoid a `next-themes` hydration mismatch) and
 * uses `resolvedTheme` from next-themes to switch between dark/light chrome.
 * This suite exercises:
 *   - pre-mount render (dark chrome, no theme lookup)
 *   - mounted render (dark theme)
 *   - mounted render (light theme)
 *   - handleSubscribe empty-email early return
 *   - handleSubscribe whitespace-only email early return
 *   - handleSubscribe valid-email path (alert + input cleared)
 *   - back-to-top useEffect: scrollY > 300 sets opacity=1 / translateY(-30px)
 *   - back-to-top useEffect: scrollY <= 300 sets opacity=0 / translateY(10px)
 *   - back-to-top click triggers window.scrollTo({top:0, behavior:'smooth'})
 *   - unmount cleans up both the scroll and click listeners
 */

let mockResolvedTheme: string | undefined = 'dark'
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement('img', { alt, src }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...rest }, children),
}))

vi.mock('@/components/index', () => ({
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
}))

// The tested file imports GridLines/StarField from '../index' (i.e.
// src/components/index). vi.mock() keys by module specifier, so we also
// register the specifier vitest will see for that relative import.
vi.mock('../../components/index', () => ({
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
}))

import DocsFooter from '@/components/docs/DocsFooter'

describe('DocsFooter', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockResolvedTheme = 'dark'
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders the pre-mount dark chrome (footer element present)', () => {
    // On the very first render pass (before useEffect fires) the `mounted` gate
    // returns the pre-mount branch. We still assert the footer element renders.
    const { container } = render(<DocsFooter />)
    expect(container.querySelector('footer')).toBeTruthy()
  })

  it('mounted render with dark theme mounts the full footer chrome', () => {
    mockResolvedTheme = 'dark'
    const { container } = render(<DocsFooter />)
    expect(container.querySelector('footer')).toBeTruthy()
    // Subscribe form is only present in the mounted (post-effect) tree.
    expect(container.querySelector('#newsletter-form')).toBeTruthy()
  })

  it('mounted render with light theme mounts the full footer chrome', () => {
    mockResolvedTheme = 'light'
    const { container } = render(<DocsFooter />)
    expect(container.querySelector('footer')).toBeTruthy()
    expect(container.querySelector('#newsletter-form')).toBeTruthy()
  })

  it('handleSubscribe: empty email → early return (no alert)', () => {
    const { container } = render(<DocsFooter />)
    const form = container.querySelector('#newsletter-form') as HTMLFormElement
    expect(form).toBeTruthy()
    fireEvent.submit(form)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('handleSubscribe: whitespace-only email → early return', () => {
    const { container } = render(<DocsFooter />)
    const input = container.querySelector('#email-address') as HTMLInputElement
    fireEvent.change(input, { target: { value: '   ' } })
    const form = container.querySelector('#newsletter-form') as HTMLFormElement
    fireEvent.submit(form)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('handleSubscribe: valid email → alert fired + input cleared', () => {
    const { container } = render(<DocsFooter />)
    const input = container.querySelector('#email-address') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    expect(input.value).toBe('user@example.com')
    const form = container.querySelector('#newsletter-form') as HTMLFormElement
    fireEvent.submit(form)
    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy.mock.calls[0][0]).toMatch(/Subscriptions are not available/)
    expect(input.value).toBe('')
  })

  // The back-to-top effect depends on `mounted`, so it re-runs once the
  // mounted branch (which renders `#back-to-top`) has committed.

  it('back-to-top: scrollY > 300 sets opacity=1 and translateY(-30px)', () => {
    const { container } = render(<DocsFooter />)
    const button = container.querySelector('#back-to-top') as HTMLElement
    expect(button).toBeTruthy()

    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })
    act(() => {
      fireEvent.scroll(window)
    })

    expect(button.style.opacity).toBe('1')
    expect(button.style.transform).toBe('translateY(-30px)')
  })

  it('back-to-top: scrollY <= 300 sets opacity=0 and translateY(10px)', () => {
    const { container } = render(<DocsFooter />)
    const button = container.querySelector('#back-to-top') as HTMLElement
    expect(button).toBeTruthy()

    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
    act(() => {
      fireEvent.scroll(window)
    })

    expect(button.style.opacity).toBe('0')
    expect(button.style.transform).toBe('translateY(10px)')
  })

  it('back-to-top: click triggers window.scrollTo({top: 0, behavior: "smooth"}) once', () => {
    const { container } = render(<DocsFooter />)
    const button = container.querySelector('#back-to-top') as HTMLElement
    expect(button).toBeTruthy()

    fireEvent.click(button)

    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('unmount cleans up both scroll and click listeners', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount, container } = render(<DocsFooter />)
    const button = container.querySelector('#back-to-top') as HTMLElement
    const buttonRemoveEventListenerSpy = vi.spyOn(button, 'removeEventListener')

    expect(() => act(() => unmount())).not.toThrow()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(buttonRemoveEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
  })
})
