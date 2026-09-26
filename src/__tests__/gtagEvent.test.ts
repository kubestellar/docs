/**
 * Unit tests for the exported gtagEvent() helper in
 * src/components/GoogleAnalytics.tsx.
 *
 * gtagEvent is the only public API of GoogleAnalytics: components across
 * the marketing site call it to fire GA4 events (survey clicks, doc
 * feedback, etc.). It has two guards worth pinning:
 *
 *   1. Server-side safety — during Next.js server rendering `window` is
 *      undefined; calling window.gtag would crash the render. gtagEvent
 *      must silently no-op.
 *   2. Pre-hydration safety — after client mount but before gtag.js
 *      finishes loading, window.gtag is not yet assigned. gtagEvent must
 *      silently no-op there too (the analytics init block itself queues
 *      pre-load events via window.dataLayer, but gtagEvent does not, so
 *      the guard must not throw).
 *
 * The happy path — window.gtag exists — should forward the call verbatim
 * as gtag("event", eventName, params).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { gtagEvent } from '../components/GoogleAnalytics'

const originalWindow = globalThis.window

function installWindow(gtag: unknown) {
  Object.defineProperty(globalThis, 'window', {
    value: gtag === undefined ? {} : { gtag },
    writable: true,
    configurable: true,
  })
}

function restoreWindow() {
  if (originalWindow === undefined) {
    // @ts-expect-error - removing window for SSR tests
    delete globalThis.window
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    })
  }
}

describe('gtagEvent', () => {
  beforeEach(() => {
    restoreWindow()
  })

  afterEach(() => {
    restoreWindow()
    vi.restoreAllMocks()
  })

  it('is a no-op on the server (window undefined) and does not throw', () => {
    // @ts-expect-error - removing window for SSR path
    delete globalThis.window
    expect(() => gtagEvent('survey_click')).not.toThrow()
    expect(() => gtagEvent('survey_click', { source: 'navbar' })).not.toThrow()
  })

  it('is a no-op when window exists but window.gtag has not loaded yet', () => {
    installWindow(undefined)
    expect(() => gtagEvent('doc_feedback', { rating: 5 })).not.toThrow()
  })

  it('forwards eventName and params to window.gtag when available', () => {
    const spy = vi.fn()
    installWindow(spy)

    gtagEvent('survey_click', { source: 'navbar', variant: 'A' })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('event', 'survey_click', {
      source: 'navbar',
      variant: 'A',
    })
  })

  it('forwards undefined params without adding a synthetic third argument', () => {
    const spy = vi.fn()
    installWindow(spy)

    gtagEvent('page_view_manual')

    expect(spy).toHaveBeenCalledTimes(1)
    // Third arg is passed through as-is (undefined), matching gtag.js's
    // own signature: gtag('event', name, params?)
    expect(spy).toHaveBeenCalledWith('event', 'page_view_manual', undefined)
  })

  it('supports the full param value type union (string | number | boolean)', () => {
    const spy = vi.fn()
    installWindow(spy)

    gtagEvent('mixed_params', {
      label: 'signup',
      value: 42,
      logged_in: true,
    })

    expect(spy).toHaveBeenCalledWith('event', 'mixed_params', {
      label: 'signup',
      value: 42,
      logged_in: true,
    })
  })
})
