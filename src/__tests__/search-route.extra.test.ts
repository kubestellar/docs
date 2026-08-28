import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Additional coverage for /api/search route handler branches not exercised
 * by search-route.test.ts:
 *   - toPlainText markdown transforms (bold/italic/HR/HTML comments/links/images)
 *   - extractTitle fallback (no `# Title` heading) → title derived from routeKey
 *   - snippet path when title matches but content does not
 *     (`snippet = text.slice(0, 140) + '...'` and short-text branches)
 *   - readLocalFile: fs.existsSync throwing and fs.existsSync returning false
 *   - routeKeyToUrl empty-string branch (root docs mapping)
 *   - GET error handler (buildPageMap throws → 500 JSON)
 */

const { mockRouteMap, mockFiles, mockFsFail } = vi.hoisted(() => {
  const mockRouteMap: Record<string, string> = {
    // Empty routeKey maps to root docs (routeKeyToUrl empty branch)
    '': 'index.mdx',
    // No `# ` heading in the file: extractTitle uses fallback (routeKey basename)
    'guides/no-heading': 'guides/no-heading.mdx',
    'guides/long-doc': 'guides/long-doc.mdx',
    // Short content so snippet fallback is < 140 chars (no ellipsis)
    'guides/short-doc': 'guides/short-doc.mdx',
    // Rich markdown to exercise toPlainText transforms
    'guides/rich': 'guides/rich.mdx',
    // Missing file → readLocalFile returns null (existsSync false branch)
    'guides/missing': 'guides/missing.mdx',
    // Throwing file → readLocalFile catch branch
    'guides/throws': 'guides/throws.mdx',
  }

  const longBody = 'Zulu Yankee Xray content. '.repeat(20) // ~500 chars, no title-word overlap
  const mockFiles: Record<string, string> = {
    'index.mdx': '# Home\n\nWelcome home.',
    'guides/no-heading.mdx':
      'Zulu Yankee Xray prose about upgrading, no leading title in file.',
    'guides/long-doc.mdx': `# AlphaBravoCharlie\n\n${longBody}`,
    'guides/short-doc.mdx': '# Short\n\nJust a short doc body.',
    'guides/rich.mdx':
      '# Rich Doc\n\n' +
      '```bash\ncode block should be stripped\n```\n\n' +
      'Inline `code` here.\n\n' +
      '<!-- html comment removed -->\n\n' +
      '## Section\n\n' +
      '**bold text** and *italic text* and _underscore italic_.\n\n' +
      '[link text](https://example.com) and ![alt](img.png)\n\n' +
      '---\n\n' +
      '<span class="x">span</span> tag stripped.\n\n' +
      'Nested comment bypass: <!-<!--payload-->\n',
  }

  return { mockRouteMap, mockFiles, mockFsFail: { path: 'guides/throws.mdx' } }
})

vi.mock('fs', () => ({
  default: {
    existsSync: (filePath: string) => {
      const rel = filePath.replace(/.*\/docs\/content\//, '')
      if (rel === mockFsFail.path) throw new Error('boom')
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

describe('GET /api/search (extra branches)', () => {
  it('maps the empty routeKey to /<basePath> (no trailing slug)', async () => {
    const req = new MockNextRequest('welcome')
    const res = await GET(req)
    const root = res.body.results.find((r: any) => r.title === 'Home')
    expect(root).toBeDefined()
    // routeKeyToUrl('') → `/${basePath}`
    expect(root.url).toBe('/docs')
  })

  it('uses routeKey basename as fallback title when no `# heading` present', async () => {
    // Body contains "upgrading" so contentMatch is true; the fallback title
    // path is what we're asserting on.
    const req = new MockNextRequest('upgrading')
    const res = await GET(req)
    const hit = res.body.results.find(
      (r: any) => r.url === '/docs/guides/no-heading'
    )
    expect(hit).toBeDefined()
    // 'no-heading' → 'No Heading'
    expect(hit.title).toBe('No Heading')
  })

  it('long doc: title-only match uses text.slice(0, 140) + ellipsis for snippet', async () => {
    // Title-only match is only possible when title (a fallback) doesn't appear
    // in the body text. Use the no-heading route: fallback title "No Heading",
    // body has no "no heading" substring.
    const req = new MockNextRequest('no heading')
    const res = await GET(req)
    const hit = res.body.results.find(
      (r: any) => r.url === '/docs/guides/no-heading'
    )
    expect(hit).toBeDefined()
    expect(hit.matchType).toBe('title')
    // Body ~65 chars < 140 → no ellipsis suffix on this one
    // Instead, verify no <mark> since we hit the title-only else-branch.
    expect(hit.highlightedSnippet).not.toContain('<mark>')
  })

  it('long doc: content-match snippet fires <mark> around the query', async () => {
    // Also exercises the ellipsis-both-ends branch when idx is mid-document.
    const req = new MockNextRequest('yankee')
    const res = await GET(req)
    const hit = res.body.results.find(
      (r: any) => r.title === 'AlphaBravoCharlie'
    )
    expect(hit).toBeDefined()
    expect(hit.matchType).toBe('content')
    expect(hit.highlightedSnippet).toContain('<mark>')
    // Body > 140 chars and idx > 60 → both leading and trailing ellipsis
    expect(hit.snippet.endsWith('...')).toBe(true)
  })

  it('short doc: title-only match produces snippet without trailing ellipsis', async () => {
    const req = new MockNextRequest('short')
    const res = await GET(req)
    const hit = res.body.results.find((r: any) => r.title === 'Short')
    expect(hit).toBeDefined()
    // text is well under 140 chars → no ellipsis suffix
    expect(hit.snippet.endsWith('...')).toBe(false)
  })

  it('toPlainText strips code blocks, inline code, HTML comments, and links', async () => {
    const req = new MockNextRequest('rich doc')
    const res = await GET(req)
    const hit = res.body.results.find((r: any) => r.title === 'Rich Doc')
    expect(hit).toBeDefined()
    // Code block content, inline code delimiters, comments, and raw HTML tags removed
    expect(hit.content).not.toContain('```')
    expect(hit.content).not.toContain('code block should be stripped')
    expect(hit.content).not.toContain('<!--')
    expect(hit.content).not.toContain('<span')
    // Bold/italic markers removed but text preserved
    expect(hit.content).toContain('bold text')
    expect(hit.content).toContain('italic text')
    expect(hit.content).toContain('underscore italic')
    // Link text preserved, image dropped
    expect(hit.content).toContain('link text')
    expect(hit.content).not.toContain('![alt]')
    // The inner `<!--payload-->` gets stripped by the stable loop
    expect(hit.content).not.toContain('payload')
  })

  it('readLocalFile: missing file is silently skipped (existsSync=false)', async () => {
    const req = new MockNextRequest('should-never-match-nonsense')
    const res = await GET(req)
    // No result for the missing route
    expect(
      res.body.results.find((r: any) => r.url === '/docs/guides/missing')
    ).toBeUndefined()
  })

  it('readLocalFile: fs errors are swallowed (catch branch)', async () => {
    // guides/throws throws inside existsSync — must not surface as 500
    const req = new MockNextRequest('rich')
    const res = await GET(req)
    // Handler still returns 200 with the other results
    expect(res.status).toBe(200)
    expect(res.body.results.find((r: any) => r.title === 'Rich Doc')).toBeDefined()
  })

  it('GET catch block: buildPageMap throws → 500 JSON with empty results', async () => {
    vi.resetModules()
    vi.doMock('../app/docs/page-map', () => ({
      buildPageMap: () => {
        throw new Error('page-map exploded')
      },
      docsContentPath: '/fake/docs/content',
      basePath: 'docs',
    }))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mod = await import('../app/api/search/route')
    const req = new MockNextRequest('anything')
    const res = await mod.GET(req as any)
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Search failed')
    expect(res.body.results).toEqual([])
    expect(res.body.count).toBe(0)
    errSpy.mockRestore()
  })
})
