// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Effect-side coverage for src/components/navbar/useGithubStats.ts.
//
// The existing useGithubStats.test.tsx renders the hook via
// renderToStaticMarkup, which is SSR-only: React never runs useEffect,
// so the fetch-and-setState body (lines 32-52) is permanently
// uncovered. Under jsdom (per-file opt-in enabled by #6645) we can drive
// the effect body directly:
//
//   - all 3 shields.io endpoints return 200 with JSON `{ value: '<n>' }`
//     -> stars/forks/watchers are all updated from the fallback defaults.
//   - a non-2xx response is skipped (nulled) so the fallback survives
//     for that individual metric.
//   - a rejected fetch is skipped via Promise.allSettled without
//     touching state at all.
//   - a response where `data.value` is falsy is skipped (mirrors the
//     `if (r.value.value)` filter).

const ORIGINAL_FETCH = globalThis.fetch

const shieldsUrl = (metric: string) =>
  `https://img.shields.io/github/${metric}/kubestellar/console.json`

function jsonRes(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH
  vi.restoreAllMocks()
})

describe('useGithubStats — effect body under jsdom', () => {
  it('replaces the fallback with shields.io values when all 3 fetches succeed', async () => {
    const byUrl: Record<string, string> = {
      [shieldsUrl('stars')]: '1.2k',
      [shieldsUrl('forks')]: '340',
      [shieldsUrl('watchers')]: '42',
    }
    const fetchMock = vi.fn(async (url: string) => jsonRes({ value: byUrl[url] }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { useGithubStats } = await import('../components/navbar/useGithubStats')
    const { result } = renderHook(() => useGithubStats())

    // Initial synchronous render returns the fallback.
    expect(result.current).toEqual({ stars: '30', forks: '25', watchers: '1' })

    await waitFor(() => {
      expect(result.current.stars).toBe('1.2k')
    })
    expect(result.current).toEqual({ stars: '1.2k', forks: '340', watchers: '42' })

    // Exactly one fetch per metric.
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const urls = fetchMock.mock.calls.map((c) => c[0])
    expect(urls.sort()).toEqual(
      [shieldsUrl('stars'), shieldsUrl('forks'), shieldsUrl('watchers')].sort(),
    )
  })

  it('keeps the fallback for a metric whose response is not ok', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === shieldsUrl('stars')) return jsonRes({}, { ok: false, status: 503 })
      if (url === shieldsUrl('forks')) return jsonRes({ value: '99' })
      return jsonRes({ value: '7' })
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { useGithubStats } = await import('../components/navbar/useGithubStats')
    const { result } = renderHook(() => useGithubStats())

    await waitFor(() => {
      // forks + watchers updated, stars stayed at fallback.
      expect(result.current.forks).toBe('99')
    })
    expect(result.current).toEqual({ stars: '30', forks: '99', watchers: '7' })
  })

  it('leaves state untouched for a rejected fetch (Promise.allSettled skips it)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === shieldsUrl('stars')) throw new Error('shields down')
      if (url === shieldsUrl('forks')) return jsonRes({ value: '10' })
      return jsonRes({ value: '2' })
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { useGithubStats } = await import('../components/navbar/useGithubStats')
    const { result } = renderHook(() => useGithubStats())

    await waitFor(() => {
      expect(result.current.forks).toBe('10')
    })
    // stars still on fallback because the fulfilled-but-null branch never fires
    // (the throw makes it a rejected result, filtered out by the `fulfilled` guard).
    expect(result.current).toEqual({ stars: '30', forks: '10', watchers: '2' })
  })

  it('keeps the fallback when data.value is falsy (empty string filtered by `if (r.value.value)`)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === shieldsUrl('stars')) return jsonRes({ value: '' })
      if (url === shieldsUrl('forks')) return jsonRes({ value: '55' })
      return jsonRes({ value: '3' })
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { useGithubStats } = await import('../components/navbar/useGithubStats')
    const { result } = renderHook(() => useGithubStats())

    await waitFor(() => {
      expect(result.current.forks).toBe('55')
    })
    expect(result.current).toEqual({ stars: '30', forks: '55', watchers: '3' })
  })
})
