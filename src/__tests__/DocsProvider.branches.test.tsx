// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act, renderHook } from '@testing-library/react'
import React from 'react'

import {
  DocsProvider,
  useDocsMenu,
} from '@/components/docs/DocsProvider'

/**
 * Coverage for src/components/docs/DocsProvider.tsx.
 *
 * Baseline is 53.12% stmt / 25% branch — the existing suite only
 * exercises the initial-render path via docs-page-render.test.ts. The
 * uncovered arms are:
 *   - localStorage-seeded initial `bannerDismissed`
 *   - `dismissBanner()` (writes localStorage)
 *   - `toggleMenu()` / `toggleSidebar()` (functional-setState arms)
 *   - `toggleNavCollapsed()` (add branch AND delete branch)
 *   - `useDocsMenu` throw-on-missing-provider guard
 *
 * These tests drive every branch through the public hook API so
 * DocsProvider reaches 100%.
 */

function wrapper({ children }: { children: React.ReactNode }) {
  return <DocsProvider>{children}</DocsProvider>
}

function installLocalStorageStub() {
  const store = new Map<string, string>()
  const stub = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: stub,
  })
  return stub
}

beforeEach(() => {
  installLocalStorageStub()
})

describe('useDocsMenu — provider guard', () => {
  it('throws a descriptive error when used outside DocsProvider', () => {
    // Suppress React's error-boundary console noise for the render.
    const spy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    try {
      expect(() => renderHook(() => useDocsMenu())).toThrow(
        /useDocsMenu must be used within a DocsProvider/,
      )
    } finally {
      spy.mockRestore()
    }
  })
})

describe('DocsProvider — initial state', () => {
  it('defaults bannerDismissed=false when localStorage is empty', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    expect(result.current.bannerDismissed).toBe(false)
    expect(result.current.menuOpen).toBe(false)
    expect(result.current.sidebarCollapsed).toBe(false)
    expect(result.current.navCollapsed.size).toBe(0)
    expect(result.current.navInitialized.current).toBe(false)
  })

  it('seeds bannerDismissed=true from localStorage on mount', () => {
    window.localStorage.setItem('docs-banner-dismissed', 'true')
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    expect(result.current.bannerDismissed).toBe(true)
  })

  it('keeps bannerDismissed=false when localStorage value is not exactly "true"', () => {
    window.localStorage.setItem('docs-banner-dismissed', 'yes')
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    expect(result.current.bannerDismissed).toBe(false)
  })
})

describe('DocsProvider — toggles', () => {
  it('toggleMenu flips menuOpen and toggles twice returns to initial', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.toggleMenu())
    expect(result.current.menuOpen).toBe(true)
    act(() => result.current.toggleMenu())
    expect(result.current.menuOpen).toBe(false)
  })

  it('toggleSidebar flips sidebarCollapsed', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.toggleSidebar())
    expect(result.current.sidebarCollapsed).toBe(true)
    act(() => result.current.toggleSidebar())
    expect(result.current.sidebarCollapsed).toBe(false)
  })

  it('setMenuOpen and setSidebarCollapsed set values directly', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.setMenuOpen(true))
    expect(result.current.menuOpen).toBe(true)
    act(() => result.current.setSidebarCollapsed(true))
    expect(result.current.sidebarCollapsed).toBe(true)
  })
})

describe('DocsProvider — dismissBanner', () => {
  it('dismissBanner sets state true and persists to localStorage', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.dismissBanner())
    expect(result.current.bannerDismissed).toBe(true)
    expect(window.localStorage.getItem('docs-banner-dismissed')).toBe('true')
  })

  it('setBannerDismissed(true) does not write to localStorage', () => {
    const stub = installLocalStorageStub()
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.setBannerDismissed(true))
    expect(result.current.bannerDismissed).toBe(true)
    // setBannerDismissed is a raw setter — no side-effect on storage.
    expect(stub.getItem('docs-banner-dismissed')).toBeNull()
  })
})

describe('DocsProvider — toggleNavCollapsed', () => {
  it('adds a key that is not present (add branch)', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.toggleNavCollapsed('folder-a'))
    expect(result.current.navCollapsed.has('folder-a')).toBe(true)
    expect(result.current.navCollapsed.size).toBe(1)
  })

  it('removes a key that is already present (delete branch)', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() => result.current.toggleNavCollapsed('folder-a'))
    act(() => result.current.toggleNavCollapsed('folder-a'))
    expect(result.current.navCollapsed.has('folder-a')).toBe(false)
    expect(result.current.navCollapsed.size).toBe(0)
  })

  it('produces a new Set instance each call (no mutation of previous state)', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    const initial = result.current.navCollapsed
    act(() => result.current.toggleNavCollapsed('folder-a'))
    expect(result.current.navCollapsed).not.toBe(initial)
    expect(initial.size).toBe(0)
  })

  it('setNavCollapsed accepts a functional updater and replaces the Set', () => {
    const { result } = renderHook(() => useDocsMenu(), { wrapper })
    act(() =>
      result.current.setNavCollapsed(prev => {
        const next = new Set(prev)
        next.add('x')
        next.add('y')
        return next
      }),
    )
    expect(result.current.navCollapsed.has('x')).toBe(true)
    expect(result.current.navCollapsed.has('y')).toBe(true)
  })
})

describe('DocsProvider — navInitialized ref', () => {
  it('exposes a mutable ref that persists across renders', () => {
    const { result, rerender } = renderHook(() => useDocsMenu(), { wrapper })
    expect(result.current.navInitialized.current).toBe(false)
    act(() => {
      result.current.navInitialized.current = true
    })
    rerender()
    expect(result.current.navInitialized.current).toBe(true)
  })
})

describe('DocsProvider — children render', () => {
  it('renders children inside the context provider', () => {
    const { container } = render(
      <DocsProvider>
        <span data-testid="child">hello</span>
      </DocsProvider>,
    )
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(
      'hello',
    )
  })
})
