import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for the /api/search route handler.
 *
 * We test the helper functions extracted from the route (toPlainText,
 * extractTitle, htmlEncode, routeKeyToUrl) and the GET handler behavior
 * by mocking fs access and the pageMap module.
 */

// ─── Hoisted mock data (available inside vi.mock factories) ──────────

const { mockRouteMap, mockFiles } = vi.hoisted(() => {
  const mockRouteMap: Record<string, string> = {
    'getting-started/install': 'getting-started/install.mdx',
    'guides/upgrade': 'guides/upgrade.mdx',
    'reference/api': 'reference/api.mdx',
    'guides/entities': 'guides/entities.mdx',
  }

  const mockFiles: Record<string, string> = {
    'getting-started/install.mdx':
      '# Installation Guide\n\nInstall KubeStellar using helm:\n\n```bash\nhelm install ks kubestellar/kubestellar\n```\n\nAfter installation, verify the deployment.',
    'guides/upgrade.mdx':
      '# Upgrade Guide\n\nTo upgrade your cluster, run the upgrade command.\n\n## Prerequisites\n\nEnsure you have backed up your data.',
    'reference/api.mdx':
      '# API Reference\n\nThe KubeStellar API provides endpoints for cluster management.\n\n## Authentication\n\nAll requests require a valid bearer token.',
    // Plain-text content containing a literal "&" and "<" (no HTML tags, so
    // toPlainText's tag-stripping regex leaves them untouched). Used to
    // verify highlighting of queries containing special HTML characters and
    // to verify that a query of "amp" does not split the "&amp;" entity that
    // htmlEncode produces from the literal "&".
    'guides/entities.mdx':
      '# Entities Doc\n\nThis section covers stamp validation. Config values a & b combine correctly across many test scenarios for validation purposes here, and x < y holds true here too.',
  }

  return { mockRouteMap, mockFiles }
})

// ─── Mocks ───────────────────────────────────────────────────────────

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

// Path from src/__tests__/ to src/app/docs/page-map is ../app/docs/page-map
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

// Mock NextRequest/NextResponse
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

// ─── Import after mocks ──────────────────────────────────────────────

// We need to import the module after mocks are set up
let GET: (request: any) => Promise<any>

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../app/api/search/route')
  GET = mod.GET
})

// ─── Tests ───────────────────────────────────────────────────────────

describe('GET /api/search', () => {
  it('returns empty results for empty query', async () => {
    const req = new MockNextRequest('')
    const res = await GET(req)
    expect(res.body.results).toEqual([])
    expect(res.body.count).toBe(0)
  })

  it('returns matching results for a valid query', async () => {
    const req = new MockNextRequest('install')
    const res = await GET(req)
    expect(res.body.count).toBeGreaterThan(0)
    const titles = res.body.results.map((r: any) => r.title)
    expect(titles).toContain('Installation Guide')
  })

  it('prioritizes title matches over content matches', async () => {
    const req = new MockNextRequest('upgrade')
    const res = await GET(req)
    expect(res.body.results.length).toBeGreaterThan(0)
    // "Upgrade Guide" has "upgrade" in title, should come first
    expect(res.body.results[0].matchType).toBe('title')
  })

  it('limits results to 20', async () => {
    const req = new MockNextRequest('the')
    const res = await GET(req)
    expect(res.body.results.length).toBeLessThanOrEqual(20)
  })

  it('generates correct URLs from route keys', async () => {
    const req = new MockNextRequest('api')
    const res = await GET(req)
    const apiResult = res.body.results.find((r: any) => r.title === 'API Reference')
    expect(apiResult).toBeDefined()
    expect(apiResult.url).toBe('/docs/reference/api')
  })

  it('generates highlighted snippets with <mark> tags', async () => {
    const req = new MockNextRequest('cluster')
    const res = await GET(req)
    const match = res.body.results.find((r: any) => r.matchType === 'content')
    if (match) {
      expect(match.highlightedSnippet).toContain('<mark>')
    }
  })

  it('HTML-encodes snippet content to prevent XSS', async () => {
    const req = new MockNextRequest('helm')
    const res = await GET(req)
    // Code blocks are stripped, but if any < remains it should be encoded
    for (const r of res.body.results) {
      // highlightedSnippet should only contain <mark> tags, no raw HTML
      const withoutMark = r.highlightedSnippet.replace(/<\/?mark>/g, '')
      expect(withoutMark).not.toMatch(/<[a-z]/)
    }
  })

  it('extracts category from first path segment', async () => {
    const req = new MockNextRequest('install')
    const res = await GET(req)
    const installResult = res.body.results.find((r: any) => r.title === 'Installation Guide')
    expect(installResult?.category).toBe('Getting Started')
  })

  it('is case-insensitive', async () => {
    const req = new MockNextRequest('KUBESTELLAR')
    const res = await GET(req)
    expect(res.body.count).toBeGreaterThan(0)
  })

  it('highlights queries containing "&" that appear in the doc content', async () => {
    // "&" is a query-string separator, so it must be percent-encoded here —
    // MockNextRequest builds `q=${query}` directly into URLSearchParams.
    const req = new MockNextRequest(encodeURIComponent('a & b'))
    const res = await GET(req)
    const hit = res.body.results.find((r: any) => r.title === 'Entities Doc')
    expect(hit).toBeDefined()
    // The literal "&" query must be highlighted, not encoded away before matching
    expect(hit.highlightedSnippet).toContain('<mark>a &amp; b</mark>')
  })

  it('highlights queries containing "<" that appear in the doc content', async () => {
    const req = new MockNextRequest('x < y')
    const res = await GET(req)
    const hit = res.body.results.find((r: any) => r.title === 'Entities Doc')
    expect(hit).toBeDefined()
    expect(hit.highlightedSnippet).toContain('<mark>x &lt; y</mark>')
  })

  it('query "amp" does not split the &amp; entity produced by htmlEncode', async () => {
    const req = new MockNextRequest('amp')
    const res = await GET(req)
    const hit = res.body.results.find((r: any) => r.title === 'Entities Doc')
    expect(hit).toBeDefined()
    // The literal "&" must remain encoded as a whole "&amp;" entity — the
    // "amp" match must not land inside it and split it apart.
    expect(hit.highlightedSnippet).not.toContain('&<mark>amp</mark>;')
    // Stripping <mark> tags should yield a properly encoded snippet with an
    // intact "&amp;" entity.
    const withoutMark = hit.highlightedSnippet.replace(/<\/?mark>/g, '')
    expect(withoutMark).toContain('&amp;')
  })
})
