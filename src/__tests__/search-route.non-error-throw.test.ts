import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Coverage for the non-Error branch of the catch handler at
 * src/app/api/search/route.ts:188.
 *
 *   error instanceof Error ? error.message : String(error)
 *                                            ^^^^^^^^^^^^^^
 *
 * Existing search-route tests exercise catch by throwing `new Error(...)`,
 * so `error.message` fires and `String(error)` is dead. A regression that
 * mishandled non-Error throws (strings, plain objects) would surface as
 * "[object Object]" landing in the structured log and never be caught by
 * the current suite. This file forces the else arm by throwing a plain
 * string from `buildPageMap`.
 */

vi.mock('fs', () => ({
  default: {
    existsSync: () => false,
    readFileSync: () => '',
  },
}))

vi.mock('../app/docs/page-map', () => ({
  buildPageMap: () => {
    // Deliberately throw a non-Error value to hit the else arm of
    // `error instanceof Error ? error.message : String(error)`.
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw 'plain-string-blowup'
  },
  docsContentPath: '/fake/docs/content',
  basePath: 'docs',
}))

vi.mock('@/lib/transformMdx', () => ({
  convertHtmlScriptsToJsxComments: (content: string) => content,
}))

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

const errorSpy = { calls: [] as unknown[][] }

vi.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => {
      errorSpy.calls.push(args)
    },
    info: () => {},
    warn: () => {},
    debug: () => {},
  },
}))

vi.mock('@/lib/metrics', () => ({
  recordApiRequest: () => {},
}))

let GET: (request: unknown) => Promise<{ status: number; body: { error: string; results: unknown[]; count: number } }>

beforeEach(async () => {
  vi.resetModules()
  errorSpy.calls.length = 0
  const mod = await import('../app/api/search/route')
  GET = mod.GET as typeof GET
})

describe('GET /api/search — non-Error throws', () => {
  it('coerces a non-Error throw via String(error) in the structured log', async () => {
    const res = await GET(new MockNextRequest('anything'))

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Search failed')
    expect(res.body.results).toEqual([])
    expect(res.body.count).toBe(0)

    // The logger should have received the coerced string form, proving the
    // else arm of `error instanceof Error ? ... : String(error)` fired.
    expect(errorSpy.calls.length).toBe(1)
    const [msg, meta] = errorSpy.calls[0]
    expect(msg).toBe('search request failed')
    expect((meta as { error: string }).error).toBe('plain-string-blowup')
  })
})
