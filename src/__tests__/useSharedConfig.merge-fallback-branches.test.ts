import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SharedConfig } from '../hooks/useSharedConfig'

// Extension of useSharedConfig.fetch.test.ts targeting the last
// uncovered nullish-coalescing arms inside mergeSharedConfigs
// (lines 79-91 in useSharedConfig.ts):
//
//   * `secondary.projects ?? {}`      (line 80)
//   * `primary.projects ?? {}`        (line 81)
//   * `secondary.editBaseUrls ?? {}`  (line 86)
//   * `primary.editBaseUrls ?? {}`    (line 87)
//   * `primary.surveyUrl ?? secondary.surveyUrl`  (line 89, both arms)
//
// The existing tests use fully-populated fixtures for both `localConfig`
// and `prodConfig`, so the ??-fallback arms never fire. Here we drop
// projects / editBaseUrls / surveyUrl on one side at a time (typed
// through Partial<SharedConfig> to model the "server returned an
// incomplete payload" real-world case).

const baseVersions: SharedConfig['versions'] = {
  kubestellar: {
    latest: { label: 'v0.30.0', branch: 'docs/0.30.0', isDefault: true },
  },
}

const baseLocal: SharedConfig = {
  versions: baseVersions,
  projects: {
    kubestellar: { name: 'KubeStellar', basePath: '', currentVersion: '0.30.0' },
  },
  relatedProjects: [{ title: 'Local', href: '/docs/local' }],
  editBaseUrls: { kubestellar: 'https://local.example/edit' },
  surveyUrl: 'https://local.example/survey',
  // Newer -> local is `primary` in mergeSharedConfigs.
  updatedAt: '2026-06-25T12:00:00Z',
}

const baseProd: SharedConfig = {
  versions: baseVersions,
  projects: {
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
  return { ok, json: async () => body } as unknown as Response
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('console', { ...console, warn: vi.fn() })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('mergeSharedConfigs — nullish-coalescing fallback arms', () => {
  it('falls back to {} when primary.projects is missing (line 81 ?? arm)', async () => {
    const localNoProjects: Partial<SharedConfig> = { ...baseLocal }
    delete (localNoProjects as any).projects

    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localNoProjects)
      return jsonRes(baseProd)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    // Only secondary (prod) projects should survive; the primary
    // spread degrades to `{}` and adds nothing.
    expect(Object.keys(cfg!.projects).sort()).toEqual(['a2a'])
    expect(cfg!.projects.a2a.name).toBe('A2A')
  })

  it('falls back to {} when secondary.projects is missing (line 80 ?? arm)', async () => {
    const prodNoProjects: Partial<SharedConfig> = { ...baseProd }
    delete (prodNoProjects as any).projects

    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(baseLocal)
      return jsonRes(prodNoProjects)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    // Only primary (local) projects survive.
    expect(Object.keys(cfg!.projects).sort()).toEqual(['kubestellar'])
    expect(cfg!.projects.kubestellar.name).toBe('KubeStellar')
  })

  it('falls back to {} when primary.editBaseUrls is missing (line 87 ?? arm)', async () => {
    const localNoEdit: Partial<SharedConfig> = { ...baseLocal }
    delete (localNoEdit as any).editBaseUrls

    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localNoEdit)
      return jsonRes(baseProd)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(Object.keys(cfg!.editBaseUrls).sort()).toEqual(['a2a'])
    expect(cfg!.editBaseUrls.a2a).toBe('https://prod.example/a2a')
  })

  it('falls back to {} when secondary.editBaseUrls is missing (line 86 ?? arm)', async () => {
    const prodNoEdit: Partial<SharedConfig> = { ...baseProd }
    delete (prodNoEdit as any).editBaseUrls

    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(baseLocal)
      return jsonRes(prodNoEdit)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(Object.keys(cfg!.editBaseUrls).sort()).toEqual(['kubestellar'])
    expect(cfg!.editBaseUrls.kubestellar).toBe('https://local.example/edit')
  })

  it('falls back to secondary.surveyUrl when primary.surveyUrl is undefined (line 89 ?? arm)', async () => {
    const localNoSurvey: Partial<SharedConfig> = { ...baseLocal }
    delete (localNoSurvey as any).surveyUrl

    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localNoSurvey)
      return jsonRes(baseProd)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg!.surveyUrl).toBe('https://prod.example/survey')
  })

  it('leaves surveyUrl undefined when neither side has one', async () => {
    const localNoSurvey: Partial<SharedConfig> = { ...baseLocal }
    const prodNoSurvey: Partial<SharedConfig> = { ...baseProd }
    delete (localNoSurvey as any).surveyUrl
    delete (prodNoSurvey as any).surveyUrl

    stubFetch((url) => {
      if (url === '/config/shared.json') return jsonRes(localNoSurvey)
      return jsonRes(prodNoSurvey)
    })
    const { fetchConfig } = await import('../hooks/useSharedConfig')
    const cfg = await fetchConfig(true)
    expect(cfg!.surveyUrl).toBeUndefined()
  })
})
