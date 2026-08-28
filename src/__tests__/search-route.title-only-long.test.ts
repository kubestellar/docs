import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Additional branch coverage for /api/search/route.ts line 146:
 * title-only match on a body longer than 140 characters must emit
 * the trailing-ellipsis form of the snippet fallback.
 * search-route.extra.test.ts covers the < 140 arm; this test covers
 * the > 140 arm of the ternary on the title-only path.
 */

const { mockRouteMap, mockFiles } = vi.hoisted(() => {
  // Body is ~600 chars of 'z ' and contains NO substring "zebras", so
  // a query on "zebras" produces a title-only match (fallback title
  // derived from the routeKey basename "zebras" → "Zebras") on a body
  // > 140 characters.
  const longBody = 'z '.repeat(300)
  return {
    mockRouteMap: { 'guides/zebras': 'guides/zebras.mdx' } as Record<
      string,
      string
    >,
    mockFiles: { 'guides/zebras.mdx': longBody } as Record<string, string>,
  }
})

vi.mock('fs', () => ({
  default: {
    existsSync: (p: string) => {
      const rel = p.replace(/.*\/docs\/content\//, '')
      return rel in mockFiles
    },
    readFileSync: (p: string) => {
      const rel = p.replace(/.*\/docs\/content\//, '')
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
    this.nextUrl = {
      searchParams: new URLSearchParams(query ? `q=${query}` : ''),
    }
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

describe('GET /api/search — title-only match on long body appends "..."', () => {
  beforeEach(() => vi.resetModules())

  it('emits snippet = first 140 chars + "..." when body length > 140', async () => {
    const { GET } = await import('../app/api/search/route')
    const req = new MockNextRequest('zebras')
    const res = (await GET(req as any)) as unknown as {
      body: {
        results: Array<{
          title: string
          matchType: string
          snippet: string
        }>
      }
    }

    const hit = res.body.results.find((r) => r.title === 'Zebras')
    expect(hit).toBeDefined()
    expect(hit!.matchType).toBe('title')
    // Body > 140 chars → ternary short-circuits to '...' suffix.
    expect(hit!.snippet.endsWith('...')).toBe(true)
    expect(hit!.snippet.slice(0, 140).length).toBe(140)
  })
})
