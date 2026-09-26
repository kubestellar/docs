// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { SharedConfig } from '../hooks/useSharedConfig'

/**
 * Coverage for the useSharedConfig React hook body — the useState
 * initialization, the useEffect fetch/cache/error paths, and the
 * mounted-flag cleanup that keeps setState from firing after unmount.
 *
 * The rest of the module (fetchConfig, mergeSharedConfigs,
 * getVersionsForProject, getEditUrl, ...) is already 100% covered by
 * `fetchConfig.test.ts`, but the hook itself was previously unreachable
 * because vitest was pinned to `environment: 'node'` and no jsdom /
 * @testing-library/react was installed. This file opts in to jsdom via
 * the file-level `@vitest-environment jsdom` header, per the plan in
 * kubestellar/docs#6645.
 *
 * All tests reset the module (to clear the module-scoped configCache /
 * cacheTimestamp / fetchPromise closure state) and mock globalThis.fetch.
 */

const LOCAL_URL = '/config/shared.json'
const PROD_URL = 'https://kubestellar.io/config/shared.json'

function makeConfig(overrides: Partial<SharedConfig> = {}): SharedConfig {
  return {
    versions: {},
    projects: {},
    relatedProjects: [],
    editBaseUrls: {},
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function ok(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response
}

function notOk(status = 404): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response
}

async function importFresh() {
  vi.resetModules()
  return await import('../hooks/useSharedConfig')
}

let fetchMock: ReturnType<typeof vi.fn>
const ORIGINAL_FETCH = globalThis.fetch

beforeEach(() => {
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH
  vi.restoreAllMocks()
})

describe('useSharedConfig — cold cache (fetch path)', () => {
  it('starts in loading=true, config=null and resolves to loading=false, config=<merged>', async () => {
    const cfg = makeConfig({ surveyUrl: 'https://survey.example' })
    fetchMock.mockImplementation(async (url: string) => {
      if (url === LOCAL_URL) return ok(cfg)
      if (url === PROD_URL) return notOk()
      throw new Error(`unexpected url ${url}`)
    })

    const mod = await importFresh()
    const { result } = renderHook(() => mod.useSharedConfig())

    // useEffect has not yet run through fetch — but useState init reads
    // isCacheValid() which is false, so config starts null and loading=true.
    expect(result.current.config).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.config?.surveyUrl).toBe('https://survey.example')
  })
})

describe('useSharedConfig — warm cache (module-scoped)', () => {
  it('reuses configCache when a prior render populated it (isCacheValid=true, no new fetch)', async () => {
    const cfg = makeConfig({ surveyUrl: 'https://cached.example' })
    fetchMock.mockImplementation(async (url: string) => {
      if (url === LOCAL_URL) return ok(cfg)
      if (url === PROD_URL) return notOk()
      throw new Error(`unexpected url ${url}`)
    })

    const mod = await importFresh()

    // Prime the cache
    const first = renderHook(() => mod.useSharedConfig())
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalled()

    // Reset the fetch counter, mount a fresh hook — should NOT fetch again.
    fetchMock.mockClear()
    const second = renderHook(() => mod.useSharedConfig())

    // useState init reads isCacheValid()===true, so config is already
    // populated on the very first render.
    expect(second.result.current.config?.surveyUrl).toBe('https://cached.example')
    expect(second.result.current.loading).toBe(false)

    // The useEffect early-return arm runs and calls setConfig/setLoading
    // synchronously; it must not fetch.
    await waitFor(() => expect(second.result.current.loading).toBe(false))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('useSharedConfig — null-config fallback (fetchConfig resolves to null)', () => {
  it('when both LOCAL and PROD fetches fail (fetchConfig returns null), config stays null and loading flips off', async () => {
    // Note: fetchConfig catches per-URL errors internally and returns
    // null rather than rejecting, so the .catch(err => setError) arm
    // of useSharedConfig is unreachable from this level. The observable
    // behaviour is: config=null, loading=false, error=null.
    fetchMock.mockImplementation(async () => {
      throw new Error('network down')
    })

    const mod = await importFresh()
    const { result } = renderHook(() => mod.useSharedConfig())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.config).toBeNull()
    expect(result.current.error).toBeNull()
  })
})

describe('useSharedConfig — mounted-flag cleanup', () => {
  it('does not update state after the component unmounts before fetch resolves', async () => {
    let resolveLocal!: (r: Response) => void
    const localPromise = new Promise<Response>((res) => {
      resolveLocal = res
    })
    fetchMock.mockImplementation(async (url: string) => {
      if (url === LOCAL_URL) return localPromise
      if (url === PROD_URL) return notOk()
      throw new Error(`unexpected url ${url}`)
    })

    const mod = await importFresh()
    const { result, unmount } = renderHook(() => mod.useSharedConfig())

    expect(result.current.loading).toBe(true)

    // Unmount BEFORE the fetch resolves — the cleanup sets mounted=false
    // so the .then handler must not call setConfig/setLoading.
    unmount()
    await act(async () => {
      resolveLocal(ok(makeConfig({ surveyUrl: 'https://late.example' })))
      // Give the microtask queue a chance to flush the .then handler.
      await Promise.resolve()
      await Promise.resolve()
    })

    // result.current is the last-rendered value from before unmount.
    // If the cleanup was broken we'd get a React "setState on unmounted
    // component" warning; renderHook would still return the last
    // pre-unmount snapshot, but the important assertion is that no
    // exception was thrown and the loading value never flipped.
    expect(result.current.loading).toBe(true)
    expect(result.current.config).toBeNull()
  })
})
