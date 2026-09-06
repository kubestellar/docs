// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/Footer.tsx (baseline 0%).
 *
 * The component has no dedicated test file. This suite exercises:
 *   - handleSubscribe empty-email early return (no alert fired)
 *   - handleSubscribe valid-email path (alert fired, email cleared)
 *   - useEffect back-to-top: scrollY > 300 sets opacity=1 / translateY(-30px)
 *   - useEffect back-to-top: scrollY <= 300 sets opacity=0 / translateY(10px)
 *   - back-to-top button click triggers window.scrollTo(top:0, smooth)
 *   - guard when #back-to-top element is missing (initBackToTop early return)
 */

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'copyright' && values) return `© ${values.year} KubeStellar`
    return key
  },
}))

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...rest }, children),
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    React.createElement('img', { alt, src }),
}))

vi.mock('@/lib/url', () => ({
  getLocalizedUrl: (u: string) => u,
}))

vi.mock('../components/index', () => ({
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
}))

import Footer from '@/components/Footer'

describe('Footer', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders footer chrome (copyright + subscribe button)', () => {
    const { container, getByText } = render(<Footer />)
    expect(container.querySelector('footer')).toBeTruthy()
    expect(getByText('subscribe')).toBeTruthy()
  })

  it('handleSubscribe: empty email → early return (no alert, no clear)', () => {
    const { container } = render(<Footer />)
    const form = container.querySelector('#newsletter-form') as HTMLFormElement
    expect(form).toBeTruthy()
    fireEvent.submit(form)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('handleSubscribe: whitespace-only email → early return', () => {
    const { container } = render(<Footer />)
    const input = container.querySelector('#email-address') as HTMLInputElement
    fireEvent.change(input, { target: { value: '   ' } })
    const form = container.querySelector('#newsletter-form') as HTMLFormElement
    fireEvent.submit(form)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('handleSubscribe: valid email → window.alert + input cleared', () => {
    const { container } = render(<Footer />)
    const input = container.querySelector('#email-address') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'a@b.co' } })
    expect(input.value).toBe('a@b.co')
    const form = container.querySelector('#newsletter-form') as HTMLFormElement
    fireEvent.submit(form)
    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy.mock.calls[0][0]).toMatch(/Subscriptions are not available/)
    expect(input.value).toBe('')
  })

  it('back-to-top: initial scrollY <= 300 → opacity=0, translateY(10px)', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    const { container } = render(<Footer />)
    const btn = container.querySelector('#back-to-top') as HTMLElement
    expect(btn).toBeTruthy()
    expect(btn.style.opacity).toBe('0')
    expect(btn.style.transform).toBe('translateY(10px)')
  })

  it('back-to-top: scroll past 300 → opacity=1, translateY(-30px)', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    const { container } = render(<Footer />)
    const btn = container.querySelector('#back-to-top') as HTMLElement
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    fireEvent.scroll(window)
    expect(btn.style.opacity).toBe('1')
    expect(btn.style.transform).toBe('translateY(-30px)')
  })

  it('back-to-top: scroll back below 300 → opacity=0', () => {
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
    const { container } = render(<Footer />)
    const btn = container.querySelector('#back-to-top') as HTMLElement
    // initial call sets opacity=1
    expect(btn.style.opacity).toBe('1')
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
    fireEvent.scroll(window)
    expect(btn.style.opacity).toBe('0')
  })

  it('back-to-top click triggers window.scrollTo(top:0, smooth)', () => {
    const { container } = render(<Footer />)
    const btn = container.querySelector('#back-to-top') as HTMLElement
    fireEvent.click(btn)
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    expect(scrollToSpy.mock.calls[0][0]).toMatchObject({ top: 0, behavior: 'smooth' })
  })

  it('initBackToTop early return when #back-to-top is absent', () => {
    // Render Footer, then remove #back-to-top before scroll fires again.
    // (getElementById is called inside initBackToTop's effect body, which we
    // trigger indirectly. We only assert this path does not crash.)
    const origGet = document.getElementById.bind(document)
    const spy = vi.spyOn(document, 'getElementById').mockImplementation((id: string) =>
      id === 'back-to-top' ? null : origGet(id)
    )
    expect(() => render(<Footer />)).not.toThrow()
    spy.mockRestore()
  })
})
