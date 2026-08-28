import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SharedConfig } from '../hooks/useSharedConfig'

// Closes previously-uncovered branches in src/hooks/useSharedConfig.ts:
//
//   * fetchConfig (lines 109-158) -- the merge / fallback / cache path
//     that combines a local /config/shared.json with the production
//     shared.json. Existing tests only exercise the exported pure
//     getters (getVersionsForProject / getProjectInfo / etc), leaving
//     the entire fetch/merge branch uncovered.
//   * mergeSharedConfigs / mergeVersionMaps (lines 56-93) -- the
//     freshness comparator and per-project version-map union used by
//     fetchConfig when both sources return data.
//   * getConfigTimestamp (lines 47-54) -- the missing/invalid
//     updatedAt fallback (returns 0).
//
// Each test uses vi.resetModules() so it gets its own copy of the
// module-level configCache / cacheTimestamp / fetchPromise singletons,
// preventing test cross-talk without needing an internal reset export.

const localConfig: SharedConfig = {
  versions: {
    kubestellar: {
      latest: { label: 'v0.30.0 (Latest)', branch: 'docs/0.30.0', isDefault: true },
    },
  },
  projects: {
    kubestellar: { name: 'KubeStellar', basePath: '', currentVersion: '0.30.0' },
  },
  relatedProjects: [{ title: 'Local', href: '/docs/local' }],
  editBaseUrls: { kubestellar: 'https://local.example/edit' },
  surveyUrl: 'https://local.example/survey',
  updatedAt: '2026-06-25T12:00:00Z',
}

const prodConfig: SharedConfig = {
  versions: {
    kubestellar: {
      latest: { label: 'v0.30.0 (Latest)', branch: 'docs/0.30.0', isDefault: true },
      main: { label: 'main (dev)', branch: 'main', isDefault: false, isDev: true },
    },
    a2a: {
      latest: { label: 'v0.1.0 (Latest)', branch: 'docs/a2a/0.1.0', isDefault: true },
    },
  },
  projects: {
    kubestellar: { name: 'KubeStellar', basePath: '', currentVersion: '0.30.0' },
    a2a: { name: 'A2A', basePath: 'a2a', currentVersion: '0.1.0' },
  },
  relatedProjects: [{ title: 'Prod', href: '/docs/prod' }],
  editBaseUrls: { a2a: 'https://prod.example/a2a' },
  surveyUrl: 'https://prod.example/survey',
  updatedAt: '2026-05-01T00:00:00Z',
}

function stubFetch(handler: (url: string) => Promise<Response> | Response) {
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(handler(url))))
}

function jsonRes(body: unknown, ok: boolean = true): Response {
  return {
    ok,
    json: async () => body,
  } as unknown as Response
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('console', { ...console, warn: vi.fn() })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchConfig — merge when both sources succeed', () => {
  it('prefers local values but unions per-project version keys from production', async () => {
    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localConfig)
      return jsonRes(prodConfig)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg).not.toBeNull()

    // Local's kubestellar/latest wins (identical here), and production's
    // kubestellar/main survives the union — the mergeVersionMaps arm.
    expect(cfg!.versions.kubestellar.latest.branch).toBe('docs/0.30.0')
    expect(cfg!.versions.kubestellar.main.branch).toBe('main')
    // Production-only project a2a is preserved by the same union.
    expect(cfg!.versions.a2a.latest.branch).toBe('docs/a2a/0.1.0')

    // Local relatedProjects is non-empty -> local wins.
    expect(cfg!.relatedProjects).toEqual([{ title: 'Local', href: '/docs/local' }])

    // Local surveyUrl truthy -> local wins.
    expect(cfg!.surveyUrl).toBe('https://local.example/survey')

    // Newer local timestamp -> merged updatedAt should be local's.
    expect(cfg!.updatedAt).toBe('2026-06-25T12:00:00Z')
  })

  it('falls back to production relatedProjects when local list is empty', async () => {
    const localEmpty = { ...localConfig, relatedProjects: [] }
    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localEmpty)
      return jsonRes(prodConfig)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg!.relatedProjects).toEqual([{ title: 'Prod', href: '/docs/prod' }])
  })

  it('picks the newer-timestamped side as the primary in merge', async () => {
    // Flip freshness: production is newer than local. The merge
    // reverses argument order, so production wins on relatedProjects
    // and surveyUrl.
    const staleLocal = { ...localConfig, updatedAt: '2020-01-01T00:00:00Z' }
    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(staleLocal)
      return jsonRes({ ...prodConfig, updatedAt: '2026-08-01T00:00:00Z' })
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg!.relatedProjects[0].title).toBe('Prod')
    expect(cfg!.updatedAt).toBe('2026-08-01T00:00:00Z')
  })

  it('treats missing/invalid updatedAt as timestamp 0', async () => {
    // Local has no updatedAt -> getConfigTimestamp returns 0, so
    // production (any real date) is newer and becomes primary.
    const noStamp: any = { ...localConfig }
    delete noStamp.updatedAt
    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(noStamp)
      return jsonRes({ ...prodConfig, updatedAt: '2026-08-01T00:00:00Z' })
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg!.updatedAt).toBe('2026-08-01T00:00:00Z')

    // Also exercise the Number.isNaN arm: an unparseable updatedAt
    // string should be treated as timestamp 0 too.
    vi.resetModules()
    vi.unstubAllGlobals()
    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes({ ...localConfig, updatedAt: 'not-a-date' })
      return jsonRes({ ...prodConfig, updatedAt: '2026-08-01T00:00:00Z' })
    })
    const { fetchConfig: fc2 } = await import('../hooks/useSharedConfig')
    const cfg2 = await fc2(true)
    expect(cfg2!.updatedAt).toBe('2026-08-01T00:00:00Z')
  })
})

describe('fetchConfig — single-source fallback', () => {
  it('returns local config when production fetch is not ok', async () => {
    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localConfig)
      return jsonRes(null, false) // production non-2xx -> fetchConfigJson returns null
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg).toEqual(localConfig)
  })

  it('returns production config when local fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === '/config/shared.json') {
          return Promise.reject(new Error('local network dead'))
        }
        return Promise.resolve(jsonRes(prodConfig))
      })
    )
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg).toEqual(prodConfig)
  })

  it('returns null when both sources fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('all dead')))
    )
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg).toBeNull()
  })
})

describe('fetchConfig — cache & in-flight de-dup', () => {
  it('reuses cached config on subsequent calls without refetching', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(url === '/config/shared.json' ? jsonRes(localConfig) : jsonRes(prodConfig))
    )
    vi.stubGlobal('fetch', fetchMock)
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const first = await fetchConfig(true)
    expect(first).not.toBeNull()
    const callsAfterFirst = fetchMock.mock.calls.length

    const second = await fetchConfig() // no forceRefresh -> cache hit
    expect(second).toBe(first)
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it('returns the same promise for concurrent in-flight calls', async () => {
    // Delay the fetch so both calls land while the promise is pending.
    let resolveLocal!: (r: Response) => void
    let resolveProd!: (r: Response) => void
    const localPromise = new Promise<Response>((r) => (resolveLocal = r))
    const prodPromise = new Promise<Response>((r) => (resolveProd = r))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => (url === '/config/shared.json' ? localPromise : prodPromise))
    )
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const a = fetchConfig(true)
    const b = fetchConfig(true)
    // Fire off resolves after both promises are registered.
    resolveLocal(jsonRes(localConfig))
    resolveProd(jsonRes(prodConfig))
    const [ra, rb] = await Promise.all([a, b])
    expect(ra).toBe(rb)
  })
})
