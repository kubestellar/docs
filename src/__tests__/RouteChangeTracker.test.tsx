// @vitest-environment jsdom
/**
 * Unit tests for RouteChangeTracker in src/components/GoogleAnalytics.tsx.
 *
 * The inline ga4-init script in GoogleAnalytics only ever runs once, on the
 * first full page load, so Next.js App Router client-side navigations
 * (next/link, router.push) never sent a page_view without this tracker.
 * These tests pin down:
 *
 *   1. No page_view fires on initial mount — the ga4-init script already
 *      covers the landing page, so firing here too would double-count it.
 *   2. A page_view event fires with the new page_path when the route
 *      (pathname or query string) changes after mount.
 *   3. Guards against window.gtag being unavailable (SSR / pre-hydration).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

let mockPathname = '/docs/introduction'
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return {
    ...actual,
    usePathname: () => mockPathname,
    useSearchParams: () => mockSearchParams,
  }
})

const originalWindow = globalThis.window

function installWindow(gtag: unknown) {
  Object.defineProperty(globalThis, 'window', {
    value: { gtag, location: { href: 'https://docs.kubestellar.io/docs/introduction' } },
    writable: true,
    configurable: true,
  })
}

function restoreWindow() {
  Object.defineProperty(globalThis, 'window', {
    value: originalWindow,
    writable: true,
    configurable: true,
  })
}

describe('RouteChangeTracker', () => {
  beforeEach(() => {
    vi.resetModules()
    mockPathname = '/docs/introduction'
    mockSearchParams = new URLSearchParams()
  })

  afterEach(() => {
    restoreWindow()
    vi.restoreAllMocks()
  })

  it('does not fire a page_view on initial mount', async () => {
    const spy = vi.fn()
    installWindow(spy)
    const { RouteChangeTracker } = await import('../components/GoogleAnalytics')

    render(<RouteChangeTracker />)

    expect(spy).not.toHaveBeenCalled()
  })

  it('fires a page_view event when the pathname changes after mount', async () => {
    const spy = vi.fn()
    installWindow(spy)
    const { RouteChangeTracker } = await import('../components/GoogleAnalytics')

    const { rerender } = render(<RouteChangeTracker />)
    expect(spy).not.toHaveBeenCalled()

    mockPathname = '/docs/architecture'
    rerender(<RouteChangeTracker />)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/docs/architecture',
      page_location: 'https://docs.kubestellar.io/docs/introduction',
      page_title: document.title,
    })
  })

  it('includes the query string in page_path when search params change', async () => {
    const spy = vi.fn()
    installWindow(spy)
    const { RouteChangeTracker } = await import('../components/GoogleAnalytics')

    const { rerender } = render(<RouteChangeTracker />)

    mockSearchParams = new URLSearchParams('tab=examples')
    rerender(<RouteChangeTracker />)

    expect(spy).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({ page_path: '/docs/introduction?tab=examples' }),
    )
  })

  it('does not throw when window.gtag is unavailable on route change', async () => {
    installWindow(undefined)
    const { RouteChangeTracker } = await import('../components/GoogleAnalytics')

    const { rerender } = render(<RouteChangeTracker />)
    mockPathname = '/docs/architecture'

    expect(() => rerender(<RouteChangeTracker />)).not.toThrow()
  })
})
