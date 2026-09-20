// @vitest-environment jsdom
/**
 * Behavioural coverage for src/components/docs/navbar/useDocsSearch.ts.
 *
 * The hook drives the docs command palette:
 *   - Cmd/Ctrl+K toggles the palette open/closed
 *   - Escape closes the palette (or delegates to onEscapeWhenClosed
 *     when it is already closed, so a caller can dismiss another UI)
 *   - typing debounces (300ms) then calls /api/search and stores
 *     `data.results`
 *   - ArrowDown / ArrowUp move selectedIndex, clamped to
 *     [0, results.length - 1]
 *   - Enter navigates to the selected result and emits a bounded
 *     `docs_search_result_click` gtag event whose labels are only the
 *     category / matchType / numeric position (never the raw query).
 *   - closeSearch() resets query, results, and selectedIndex.
 *
 * The docs-page coverage summary reports this file at 26.8% statements /
 * 26.9% lines — before this test file, only the initial render path was
 * exercised. Everything below drives the hook under jsdom via
 * @testing-library/react's renderHook (the same pattern already used by
 * useGithubStats.effect.test.tsx).
 *
 * We mock `gtagEvent` at the module boundary so we can assert that the
 * hook only emits bounded label values (per the inline comment in the
 * hook), and we drive `fetch` directly to cover the ok / non-ok / thrown
 * branches.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const gtagEventMock = vi.fn()
vi.mock('@/components/GoogleAnalytics', () => ({
  gtagEvent: (...args: unknown[]) => gtagEventMock(...args),
}))

import { useDocsSearch } from '../components/docs/navbar/useDocsSearch'
import type { SearchResult } from '../components/docs/navbar/types'

const ORIGINAL_FETCH = globalThis.fetch

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    title: 'Getting Started',
    url: '/docs/getting-started',
    category: 'guides',
    snippet: 'Install KubeStellar…',
    highlightedSnippet: 'Install <mark>KubeStellar</mark>…',
    matchType: 'title',
    ...overrides,
  }
}

function jsonRes(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response
}

// Deliver the KeyboardEvent through document.dispatchEvent (the hook
// listens on `document`, not window), wrapped in act() so React flushes
// state updates before we assert.
function press(
  key: string,
  init: Partial<{ ctrlKey: boolean; metaKey: boolean }> = {},
): boolean {
  let defaultPrevented = false
  act(() => {
    const evt = new KeyboardEvent('keydown', {
      key,
      ctrlKey: init.ctrlKey ?? false,
      metaKey: init.metaKey ?? false,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(evt)
    defaultPrevented = evt.defaultPrevented
  })
  return defaultPrevented
}

describe('useDocsSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    gtagEventMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.fetch = ORIGINAL_FETCH
    vi.restoreAllMocks()
  })

  describe('open / close via keyboard shortcuts', () => {
    it('starts closed with empty query and empty results', () => {
      const { result } = renderHook(() => useDocsSearch())
      expect(result.current.isSearchOpen).toBe(false)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.searchResults).toEqual([])
      expect(result.current.selectedIndex).toBe(0)
      expect(result.current.isSearching).toBe(false)
    })

    it('Cmd+K opens the palette and preventDefault is called on the browser shortcut', () => {
      const { result } = renderHook(() => useDocsSearch())
      const prevented = press('k', { metaKey: true })
      expect(prevented).toBe(true)
      expect(result.current.isSearchOpen).toBe(true)
    })

    it('Ctrl+K also opens the palette (non-mac shortcut)', () => {
      const { result } = renderHook(() => useDocsSearch())
      press('k', { ctrlKey: true })
      expect(result.current.isSearchOpen).toBe(true)
    })

    it('Cmd+K a second time closes the palette and resets query / results', () => {
      const { result } = renderHook(() => useDocsSearch())
      act(() => result.current.openSearch())
      act(() => result.current.performSearch('foo'))
      expect(result.current.searchQuery).toBe('foo')
      press('k', { metaKey: true })
      expect(result.current.isSearchOpen).toBe(false)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.searchResults).toEqual([])
      expect(result.current.selectedIndex).toBe(0)
    })

    it('Escape while open closes the palette; onEscapeWhenClosed is NOT invoked', () => {
      const onEscapeWhenClosed = vi.fn()
      const { result } = renderHook(() => useDocsSearch(onEscapeWhenClosed))
      act(() => result.current.openSearch())
      expect(result.current.isSearchOpen).toBe(true)
      press('Escape')
      expect(result.current.isSearchOpen).toBe(false)
      expect(onEscapeWhenClosed).not.toHaveBeenCalled()
    })

    it('Escape while closed delegates to onEscapeWhenClosed exactly once', () => {
      const onEscapeWhenClosed = vi.fn()
      const { result } = renderHook(() => useDocsSearch(onEscapeWhenClosed))
      expect(result.current.isSearchOpen).toBe(false)
      press('Escape')
      expect(onEscapeWhenClosed).toHaveBeenCalledTimes(1)
    })

    it('Escape while closed with no callback is a safe no-op (optional chaining)', () => {
      const { result } = renderHook(() => useDocsSearch())
      expect(() => press('Escape')).not.toThrow()
      expect(result.current.isSearchOpen).toBe(false)
    })

    it('removes its keydown listener on unmount (no cross-test leakage)', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      const { unmount } = renderHook(() => useDocsSearch())
      unmount()
      const kinds = removeSpy.mock.calls.map((c) => c[0])
      expect(kinds).toContain('keydown')
    })
  })

  describe('performSearch debouncing and /api/search integration', () => {
    it('an empty / whitespace query clears results synchronously and does not call fetch', () => {
      const fetchMock = vi.fn(async () => jsonRes({ results: [] }))
      globalThis.fetch = fetchMock as unknown as typeof fetch
      const { result } = renderHook(() => useDocsSearch())

      act(() => result.current.performSearch('   '))
      expect(result.current.searchQuery).toBe('   ')
      expect(result.current.isSearching).toBe(false)
      expect(result.current.searchResults).toEqual([])

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('flips isSearching=true synchronously, then calls /api/search after the 300ms debounce', async () => {
      const results = [makeResult({ title: 'Alpha' }), makeResult({ title: 'Beta' })]
      const fetchMock = vi.fn(async () => jsonRes({ results }))
      globalThis.fetch = fetchMock as unknown as typeof fetch

      const { result } = renderHook(() => useDocsSearch())
      act(() => result.current.performSearch('alpha'))
      expect(result.current.isSearching).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()

      // Just below the debounce window: still no fetch.
      act(() => {
        vi.advanceTimersByTime(299)
      })
      expect(fetchMock).not.toHaveBeenCalled()

      await act(async () => {
        vi.advanceTimersByTime(1)
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe('/api/search?q=alpha')
      expect(result.current.searchResults).toEqual(results)
      expect(result.current.isSearching).toBe(false)
    })

    it('URL-encodes the query (spaces, ampersands, unicode)', async () => {
      const fetchMock = vi.fn(async () => jsonRes({ results: [] }))
      globalThis.fetch = fetchMock as unknown as typeof fetch
      const { result } = renderHook(() => useDocsSearch())

      act(() => result.current.performSearch('hello world & 你好'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const url = fetchMock.mock.calls[0][0] as string
      expect(url.startsWith('/api/search?q=')).toBe(true)
      expect(url).toBe(`/api/search?q=${encodeURIComponent('hello world & 你好')}`)
      expect(url).not.toContain(' ')
      expect(url).not.toContain('&', '/api/search?q='.length)
    })

    it('rapid successive keystrokes coalesce into a single /api/search call (debounce cancels earlier timers)', async () => {
      const fetchMock = vi.fn(async () => jsonRes({ results: [] }))
      globalThis.fetch = fetchMock as unknown as typeof fetch
      const { result } = renderHook(() => useDocsSearch())

      act(() => result.current.performSearch('a'))
      act(() => {
        vi.advanceTimersByTime(100)
      })
      act(() => result.current.performSearch('ab'))
      act(() => {
        vi.advanceTimersByTime(100)
      })
      act(() => result.current.performSearch('abc'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe('/api/search?q=abc')
    })

    it('emits a bounded `docs_search` gtag event containing only query_length + result_count (never the raw query)', async () => {
      const results = [makeResult(), makeResult()]
      globalThis.fetch = vi.fn(async () => jsonRes({ results })) as unknown as typeof fetch
      const { result } = renderHook(() => useDocsSearch())

      act(() => result.current.performSearch('helm'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })

      const searchCalls = gtagEventMock.mock.calls.filter((c) => c[0] === 'docs_search')
      expect(searchCalls).toHaveLength(1)
      const [, payload] = searchCalls[0]
      expect(payload).toEqual({ query_length: 4, result_count: 2 })
      // Bounded contract: no raw query text ever appears in the payload.
      expect(JSON.stringify(payload)).not.toContain('helm')
    })

    it('defaults result_count to 0 when the response is missing a `results` array', async () => {
      globalThis.fetch = vi.fn(async () => jsonRes({})) as unknown as typeof fetch
      const { result } = renderHook(() => useDocsSearch())
      act(() => result.current.performSearch('anything'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(result.current.searchResults).toEqual([])
      const [, payload] = gtagEventMock.mock.calls.find((c) => c[0] === 'docs_search')!
      expect(payload).toEqual({ query_length: 8, result_count: 0 })
    })

    it('a non-ok response clears results, does NOT emit a search event, and logs one error', async () => {
      globalThis.fetch = vi.fn(async () => jsonRes({}, { ok: false, status: 500 })) as unknown as typeof fetch
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useDocsSearch())

      // Seed non-empty results so we can assert they get cleared on error.
      act(() => {
        result.current.setSelectedIndex(0)
      })
      act(() => result.current.performSearch('boom'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(result.current.searchResults).toEqual([])
      expect(result.current.isSearching).toBe(false)
      expect(errSpy).toHaveBeenCalledTimes(1)
      expect(gtagEventMock.mock.calls.some((c) => c[0] === 'docs_search')).toBe(false)
    })

    it('a rejected fetch clears results, does NOT emit a search event, and logs one error', async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error('network down')
      }) as unknown as typeof fetch
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useDocsSearch())

      act(() => result.current.performSearch('any'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(result.current.searchResults).toEqual([])
      expect(result.current.isSearching).toBe(false)
      expect(errSpy).toHaveBeenCalledTimes(1)
      expect(gtagEventMock.mock.calls.some((c) => c[0] === 'docs_search')).toBe(false)
    })
  })

  describe('keyboard navigation over results', () => {
    async function withResults(count: number) {
      const results = Array.from({ length: count }, (_, i) =>
        makeResult({ title: `r${i}`, url: `/docs/r${i}`, matchType: i === 0 ? 'title' : 'body' }),
      )
      globalThis.fetch = vi.fn(async () => jsonRes({ results })) as unknown as typeof fetch
      const rendered = renderHook(() => useDocsSearch())
      act(() => rendered.result.current.openSearch())
      act(() => rendered.result.current.performSearch('q'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })
      return rendered
    }

    it('ArrowDown / ArrowUp are ignored when the palette is closed even if there are results', async () => {
      const { result } = await withResults(3)
      act(() => result.current.closeSearch())
      expect(result.current.searchResults).toEqual([])
      // Re-seed results manually — closeSearch cleared them — via a fresh open+search.
      globalThis.fetch = vi.fn(async () =>
        jsonRes({ results: [makeResult(), makeResult()] }),
      ) as unknown as typeof fetch
      act(() => result.current.performSearch('q'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })
      // Now results exist but isSearchOpen is false: arrows must not move selectedIndex.
      expect(result.current.isSearchOpen).toBe(false)
      expect(result.current.searchResults).toHaveLength(2)
      const before = result.current.selectedIndex
      press('ArrowDown')
      press('ArrowDown')
      expect(result.current.selectedIndex).toBe(before)
    })

    it('ArrowDown advances selectedIndex and clamps at results.length - 1', async () => {
      const { result } = await withResults(3)
      expect(result.current.selectedIndex).toBe(0)
      press('ArrowDown')
      expect(result.current.selectedIndex).toBe(1)
      press('ArrowDown')
      expect(result.current.selectedIndex).toBe(2)
      press('ArrowDown')
      expect(result.current.selectedIndex).toBe(2)
    })

    it('ArrowUp moves selectedIndex up and clamps at 0', async () => {
      const { result } = await withResults(3)
      act(() => result.current.setSelectedIndex(2))
      press('ArrowUp')
      expect(result.current.selectedIndex).toBe(1)
      press('ArrowUp')
      expect(result.current.selectedIndex).toBe(0)
      press('ArrowUp')
      expect(result.current.selectedIndex).toBe(0)
    })

    it('arrow keys and Enter are ignored when results are empty (no navigation, no gtag event)', async () => {
      const { result } = renderHook(() => useDocsSearch())
      act(() => result.current.openSearch())
      expect(result.current.searchResults).toEqual([])
      press('ArrowDown')
      press('ArrowUp')
      press('Enter')
      expect(result.current.selectedIndex).toBe(0)
      expect(gtagEventMock.mock.calls.some((c) => c[0] === 'docs_search_result_click')).toBe(false)
    })

    it('Enter on a result navigates window.location and emits a bounded click event (no raw title/query)', async () => {
      const { result } = await withResults(3)
      act(() => result.current.setSelectedIndex(1))

      // Stub window.location.href so we can assert without triggering a real navigation.
      const originalLocation = window.location
      const hrefSpy = vi.fn()
      const stubLocation = {
        ...originalLocation,
        get href() {
          return originalLocation.href
        },
        set href(value: string) {
          hrefSpy(value)
        },
      } as unknown as Location
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: stubLocation,
      })

      try {
        press('Enter')
      } finally {
        Object.defineProperty(window, 'location', {
          configurable: true,
          value: originalLocation,
        })
      }

      expect(hrefSpy).toHaveBeenCalledTimes(1)
      expect(hrefSpy).toHaveBeenCalledWith('/docs/r1')

      const clickCalls = gtagEventMock.mock.calls.filter((c) => c[0] === 'docs_search_result_click')
      expect(clickCalls).toHaveLength(1)
      const [, payload] = clickCalls[0]
      expect(payload).toEqual({ category: 'guides', match_type: 'body', position: 1 })
      // Bounded contract: never the raw title / snippet / url in the label payload.
      const serialised = JSON.stringify(payload)
      expect(serialised).not.toContain('r1')
      expect(serialised).not.toContain('/docs/')
    })
  })

  describe('trackSearchResultClick (public helper)', () => {
    it('emits `docs_search_result_click` with category / match_type / numeric position and nothing else', () => {
      const { result } = renderHook(() => useDocsSearch())
      const r = makeResult({ category: 'reference', matchType: 'heading', title: 'Secret Data' })
      act(() => result.current.trackSearchResultClick(r, 7))
      const calls = gtagEventMock.mock.calls.filter((c) => c[0] === 'docs_search_result_click')
      expect(calls).toHaveLength(1)
      const [, payload] = calls[0]
      expect(payload).toEqual({ category: 'reference', match_type: 'heading', position: 7 })
      // Bounded label contract: no raw title / url leaks into the analytics payload.
      const serialised = JSON.stringify(payload)
      expect(serialised).not.toContain('Secret')
      expect(serialised).not.toContain(r.url)
    })
  })

  describe('closeSearch()', () => {
    it('resets isSearchOpen, query, results, and selectedIndex to their initial values', async () => {
      const results = [makeResult(), makeResult(), makeResult()]
      globalThis.fetch = vi.fn(async () => jsonRes({ results })) as unknown as typeof fetch
      const { result } = renderHook(() => useDocsSearch())
      act(() => result.current.openSearch())
      act(() => result.current.performSearch('helm'))
      await act(async () => {
        vi.advanceTimersByTime(300)
        await Promise.resolve()
        await Promise.resolve()
      })
      act(() => result.current.setSelectedIndex(2))
      expect(result.current.isSearchOpen).toBe(true)
      expect(result.current.searchResults).toHaveLength(3)
      expect(result.current.selectedIndex).toBe(2)

      act(() => result.current.closeSearch())
      expect(result.current.isSearchOpen).toBe(false)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.searchResults).toEqual([])
      expect(result.current.selectedIndex).toBe(0)
    })
  })
})
