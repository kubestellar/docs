import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Focused branch coverage for the `results.sort()` comparator at
 * src/app/api/search/route.ts:168-172.
 *
 * The comparator has three arms:
 *   169: a is title, b is not     → -1  (a wins)
 *   170: a is not title, b is     →  1  (b wins)
 *   171: same matchType           → localeCompare
 *
 * Existing search-route tests focus on one branch at a time (title-only OR
 * content-only), so line/branch coverage for route.ts reports 169-170 as
 * uncovered branches. This file constructs a corpus with BOTH match kinds
 * for the same query and asserts the observed order — proving both -1 and
 * +1 arms fire during the sort. Without both arms firing, a regression
 * that flipped one sign (e.g. inverted -1 / +1) would silently rank
 * content matches above title matches.
 */

const { mockRouteMap, mockFiles } = vi.hoisted(() => {
  // Query = "kubestellar".
  // - /docs/zulu-doc: title "Zulu About Kubestellar" → matches title; body mentions "kubestellar".
  // - /docs/alpha-doc: title "Alpha Ordering" → title does NOT contain the query,
  //   but body does → content match.
  // - /docs/beta-doc: title "Beta Kubestellar Guide" → title matches.
  // - /docs/gamma-doc: title "Gamma Notes" → body-only content match.
  //
  // Expected sort order:
  //   1. Beta Kubestellar Guide  (title, alphabetical among titles)
  //   2. Zulu About Kubestellar  (title)
  //   3. Alpha Ordering          (content, alphabetical among content)
  //   4. Gamma Notes             (content)
  //
  // With four rows and two of each matchType arranged alphabetically the
  // wrong way (title=Beta,Zulu vs content=Alpha,Gamma), the comparator must
  // fire BOTH the -1 arm (title vs content) AND the +1 arm (content vs title)
  // during at least one pairwise comparison in V8's TimSort.
  const mockRouteMap: Record<string, string> = {
    'alpha-doc': 'alpha-doc.mdx',
    'beta-doc': 'beta-doc.mdx',
    'gamma-doc': 'gamma-doc.mdx',
    'zulu-doc': 'zulu-doc.mdx',
  }
  const mockFiles: Record<string, string> = {
    'alpha-doc.mdx': '# Alpha Ordering\n\nDiscusses kubestellar tooling in depth.',
    'beta-doc.mdx': '# Beta Kubestellar Guide\n\nOverview of the beta guide.',
    'gamma-doc.mdx': '# Gamma Notes\n\nMore kubestellar internals and edge cases.',
    'zulu-doc.mdx': '# Zulu About Kubestellar\n\nBackground and kubestellar history.',
  }
  return { mockRouteMap, mockFiles }
})

vi.mock('fs', () => ({
  default: {
    existsSync: (filePath: string) => {
      const rel = filePath.replace(/.*\/docs\/content\//, '')
      return rel in mockFiles
    },
    readFileSync: (filePath: string) => {
      const rel = filePath.replace(/.*\/docs\/content\//, '')
      return mockFiles[rel] || ''
    },
  },
}))

vi.mock('../app/docs/page-map', () => ({
  buildPageMap: () => ({ routeMap: mockRouteMap }),
  docsContentPath: '/fake/docs/content',
  basePath: 'docs',
}))

vi.mock('@/lib/transformMdx', () => ({
  convertHtmlScriptsToJsxComments: (content: string) => content,
}))

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path')
  return {
    ...actual,
    default: {
      ...actual,
      join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
    },
  }
})

class MockNextRequest {
  nextUrl: { searchParams: URLSearchParams }
  constructor(query: string) {
    this.nextUrl = { searchParams: new URLSearchParams(query ? `q=${query}` : '') }
  }
}

vi.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    }),
  },
}))

let GET: (request: any) => Promise<any>

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../app/api/search/route')
  GET = mod.GET
})

describe('GET /api/search — sort comparator title-vs-content branches', () => {
  it('places title matches ahead of content matches and orders each group alphabetically', async () => {
    const req = new MockNextRequest('kubestellar')
    const res = await GET(req)

    // All four fixtures match somehow — sanity check.
    expect(res.body.results).toHaveLength(4)

    // Extract just what we care about: title + matchType, in reported order.
    const observed = res.body.results.map((r: { title: string; matchType: string }) => ({
      title: r.title,
      matchType: r.matchType,
    }))

    // Title matches (Beta, Zulu) — alphabetical within group — must precede
    // content matches (Alpha, Gamma), also alphabetical within group.
    expect(observed).toEqual([
      { title: 'Beta Kubestellar Guide', matchType: 'title' },
      { title: 'Zulu About Kubestellar', matchType: 'title' },
      { title: 'Alpha Ordering', matchType: 'content' },
      { title: 'Gamma Notes', matchType: 'content' },
    ])
  })

  it('regression guard: a content match with an alphabetically-earlier title still ranks below a title match', async () => {
    // "Alpha Ordering" (content match) sorts alphabetically BEFORE
    // "Beta Kubestellar Guide" (title match). If the comparator's +1 arm
    // regressed to 0 (or -1), Alpha would leak to the top.
    const req = new MockNextRequest('kubestellar')
    const res = await GET(req)

    const firstTitle = res.body.results[0].title
    const alphaIdx = res.body.results.findIndex(
      (r: { title: string }) => r.title === 'Alpha Ordering'
    )

    expect(firstTitle).not.toBe('Alpha Ordering')
    // Alpha (content) must come after both title matches.
    expect(alphaIdx).toBeGreaterThanOrEqual(2)
  })
})
