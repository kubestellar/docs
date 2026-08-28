import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Branch coverage for /api/docs-image/[...path]/route.ts line 53 —
 * the catch block that swallows a readFileSync failure. existsSync
 * returns true but readFileSync throws (e.g. EACCES). The handler
 * must surface a generic 500 without leaking the underlying error
 * text, and must not let the exception escape.
 */

describe('/api/docs-image/[...path] — readFileSync throws yields 500', () => {
  beforeEach(() => vi.resetModules())

  it('returns 500 when readFileSync throws for an existing file', async () => {
    vi.doMock('fs', () => ({
      default: {
        existsSync: () => true,
        readFileSync: () => {
          throw new Error('EACCES: permission denied')
        },
      },
    }))
    vi.doMock('next/server', () => {
      class NextResponse {
        body: unknown
        status: number
        headers: Map<string, string>
        constructor(
          body: unknown,
          init?: { status?: number; headers?: Record<string, string> },
        ) {
          this.body = body
          this.status = init?.status ?? 200
          this.headers = new Map(Object.entries(init?.headers ?? {}))
        }
      }
      return { NextRequest: class {}, NextResponse }
    })

    const { GET } = await import('../app/api/docs-image/[...path]/route')
    const params = Promise.resolve({ path: ['ok.png'] })
    const res = (await GET({} as never, { params })) as unknown as {
      body: unknown
      status: number
    }

    expect(res.status).toBe(500)
    expect(String(res.body)).toBe('Internal Server Error')
    // The underlying error text must NOT leak into the response body.
    expect(String(res.body)).not.toContain('EACCES')
    expect(String(res.body)).not.toContain('permission denied')
  })
})
