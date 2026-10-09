/**
 * Shared helpers for tests that stub `window` to exercise client-side code
 * paths and then restore it for SSR-style assertions. Previously defined
 * identically (give or take a comment word) in url.test.ts, url-extra.test.ts,
 * url.extra.test.ts, and gtagEvent.test.ts.
 */

/** Replace globalThis.window with a stub exposing only location.host/protocol. */
export function mockWindow(host: string, protocol = 'https:') {
  Object.defineProperty(globalThis, 'window', {
    value: { location: { host, protocol } },
    writable: true,
    configurable: true,
  })
}

/**
 * Restore globalThis.window to `originalWindow` (the value captured before
 * mocking), deleting it entirely when the test environment originally had
 * no window (SSR-style).
 */
export function restoreWindow(originalWindow: unknown) {
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
