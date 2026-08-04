import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { SharedConfig } from '../hooks/useSharedConfig'

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

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('fetchConfig', () => {
  it('returns null when both local and production fetches fail (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))
    const { fetchConfig } = await importFresh()
    const result = await fetchConfig()
    expect(result).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns null when both endpoints respond non-ok', async () => {
    fetchMock.mockResolvedValue(notOk(500))
    const { fetchConfig } = await importFresh()
    const result = await fetchConfig()
    expect(result).toBeNull()
  })

  it('requests the local and production URLs in parallel', async () => {
    fetchMock.mockResolvedValue(notOk())
    const { fetchConfig } = await importFresh()
    await fetchConfig()
    const urls = fetchMock.mock.calls.map(c => c[0])
    expect(urls).toContain(LOCAL_URL)
    expect(urls).toContain(PROD_URL)
  })

  it('passes cache:no-store and Accept header on the production request', async () => {
    fetchMock.mockResolvedValue(notOk())
    const { fetchConfig } = await importFresh()
    await fetchConfig()
    const prodCall = fetchMock.mock.calls.find(c => c[0] === PROD_URL)
    expect(prodCall).toBeDefined()
    const init = prodCall![1] as RequestInit
    expect(init.cache).toBe('no-store')
    expect((init.headers as Record<string, string>).Accept).toBe('application/json')
  })

  it('returns the local config when only local succeeds', async () => {
    const local = makeConfig({ surveyUrl: 'https://local/survey' })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : notOk()
    )
    const { fetchConfig } = await importFresh()
    const result = await fetchConfig()
    expect(result).toEqual(local)
  })

  it('returns the production config when only production succeeds', async () => {
    const prod = makeConfig({ surveyUrl: 'https://prod/survey' })
    fetchMock.mockImplementation(async (url: string) =>
      url === PROD_URL ? ok(prod) : notOk()
    )
    const { fetchConfig } = await importFresh()
    const result = await fetchConfig()
    expect(result).toEqual(prod)
  })

  it('merges configs preferring the newer updatedAt as primary', async () => {
    // Local newer than production: local wins on conflicts.
    const local = makeConfig({
      updatedAt: '2026-07-02T00:00:00.000Z',
      surveyUrl: 'https://local/survey',
      versions: { p1: { latest: { label: 'local', branch: 'l', isDefault: true } } },
      editBaseUrls: { p1: 'https://local/edit' },
      relatedProjects: [{ title: 'Local', href: '/l' }],
    })
    const prod = makeConfig({
      updatedAt: '2026-07-01T00:00:00.000Z',
      surveyUrl: 'https://prod/survey',
      versions: { p1: { latest: { label: 'prod', branch: 'p', isDefault: false } } },
      editBaseUrls: { p1: 'https://prod/edit', p2: 'https://prod/edit2' },
      relatedProjects: [{ title: 'Prod', href: '/p' }],
    })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : ok(prod)
    )
    const { fetchConfig } = await importFresh()
    const merged = await fetchConfig()
    expect(merged).not.toBeNull()
    // Local (primary) wins the surveyUrl, version conflict, and updatedAt.
    expect(merged!.surveyUrl).toBe('https://local/survey')
    expect(merged!.updatedAt).toBe('2026-07-02T00:00:00.000Z')
    expect(merged!.versions.p1.latest.label).toBe('local')
    // Non-conflicting keys from production are preserved.
    expect(merged!.editBaseUrls.p2).toBe('https://prod/edit2')
    // Primary's non-empty relatedProjects wins over secondary's.
    expect(merged!.relatedProjects).toEqual([{ title: 'Local', href: '/l' }])
  })

  it('promotes production to primary when it has the newer updatedAt', async () => {
    const local = makeConfig({
      updatedAt: '2026-06-01T00:00:00.000Z',
      surveyUrl: 'https://local/survey',
    })
    const prod = makeConfig({
      updatedAt: '2026-07-01T00:00:00.000Z',
      surveyUrl: 'https://prod/survey',
    })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : ok(prod)
    )
    const { fetchConfig } = await importFresh()
    const merged = await fetchConfig()
    expect(merged!.surveyUrl).toBe('https://prod/survey')
    expect(merged!.updatedAt).toBe('2026-07-01T00:00:00.000Z')
  })

  it('falls back to secondary relatedProjects when primary has none', async () => {
    const local = makeConfig({
      updatedAt: '2026-07-02T00:00:00.000Z',
      relatedProjects: [],
    })
    const prod = makeConfig({
      updatedAt: '2026-07-01T00:00:00.000Z',
      relatedProjects: [{ title: 'From prod', href: '/x' }],
    })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : ok(prod)
    )
    const { fetchConfig } = await importFresh()
    const merged = await fetchConfig()
    expect(merged!.relatedProjects).toEqual([{ title: 'From prod', href: '/x' }])
  })

  it('returns the cached config on a second call within TTL without refetching', async () => {
    const local = makeConfig({ surveyUrl: 'https://local/survey' })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : notOk()
    )
    const { fetchConfig } = await importFresh()
    const first = await fetchConfig()
    const callsAfterFirst = fetchMock.mock.calls.length
    const second = await fetchConfig()
    expect(second).toBe(first)
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it('refetches when forceRefresh is true even if cache is valid', async () => {
    const local = makeConfig({ surveyUrl: 'https://local/survey' })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : notOk()
    )
    const { fetchConfig } = await importFresh()
    await fetchConfig()
    const beforeForce = fetchMock.mock.calls.length
    await fetchConfig(true)
    expect(fetchMock.mock.calls.length).toBeGreaterThan(beforeForce)
  })

  it('refetches after the cache TTL expires', async () => {
    const local = makeConfig({ surveyUrl: 'https://local/survey' })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : notOk()
    )
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T00:00:00.000Z'))
    const { fetchConfig } = await importFresh()
    await fetchConfig()
    const beforeExpiry = fetchMock.mock.calls.length
    // Advance beyond the 5-minute TTL.
    vi.setSystemTime(new Date('2026-07-01T00:06:00.000Z'))
    await fetchConfig()
    expect(fetchMock.mock.calls.length).toBeGreaterThan(beforeExpiry)
  })

  it('deduplicates concurrent in-flight fetches', async () => {
    let resolveLocal!: (r: Response) => void
    const localPromise = new Promise<Response>(r => {
      resolveLocal = r
    })
    fetchMock.mockImplementation((url: string) =>
      url === LOCAL_URL ? localPromise : Promise.resolve(notOk())
    )
    const { fetchConfig } = await importFresh()
    const p1 = fetchConfig()
    const p2 = fetchConfig()
    // Both callers should see the same in-flight promise resolution
    resolveLocal(ok(makeConfig({ surveyUrl: 'https://l' })))
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toBe(r2)
    // Only one local-fetch call should have been issued despite two callers.
    const localCalls = fetchMock.mock.calls.filter(c => c[0] === LOCAL_URL).length
    expect(localCalls).toBe(1)
  })

  it('treats missing/invalid updatedAt as timestamp 0 when merging', async () => {
    const local = makeConfig({
      updatedAt: 'not-a-date',
      surveyUrl: 'https://local/survey',
    })
    const prod = makeConfig({
      updatedAt: '2026-07-01T00:00:00.000Z',
      surveyUrl: 'https://prod/survey',
    })
    fetchMock.mockImplementation(async (url: string) =>
      url === LOCAL_URL ? ok(local) : ok(prod)
    )
    const { fetchConfig } = await importFresh()
    const merged = await fetchConfig()
    // Production has the larger real timestamp, so it becomes primary and wins.
    expect(merged!.surveyUrl).toBe('https://prod/survey')
  })
})
