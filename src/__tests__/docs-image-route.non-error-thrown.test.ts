import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Branch coverage for /api/docs-image/[...path]/route.ts line 65 —
 * the ternary `error instanceof Error ? error.message : String(error)`
 * inside the catch block. Existing tests only throw Error instances
 * (the truthy arm at BRDA:65,4,0). If readFileSync throws a
 * non-Error value (e.g. a string, a plain object, undefined —
 * things a poorly-typed callback or a native binding can produce),
 * the falsy arm at BRDA:65,4,1 must safely coerce via String(error)
 * and still return a generic 500 without leaking anything.
 */

describe('/api/docs-image/[...path] — non-Error thrown value still yields 500', () => {
  beforeEach(() => vi.resetModules())

  const runWithThrown = async (thrown: unknown) => {
    vi.doMock('fs', () => ({
      default: {
        existsSync: () => true,
        readFileSync: () => {
          throw thrown
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
    return (await GET({} as never, { params })) as unknown as {
      body: unknown
      status: number
    }
  }

  it('returns 500 when readFileSync throws a string (not Error)', async () => {
    const res = await runWithThrown('bare string failure')
    expect(res.status).toBe(500)
    expect(String(res.body)).toBe('Internal Server Error')
    expect(String(res.body)).not.toContain('bare string failure')
  })

  it('returns 500 when readFileSync throws a plain object (not Error)', async () => {
    const res = await runWithThrown({ code: 'EWEIRD' })
    expect(res.status).toBe(500)
    expect(String(res.body)).toBe('Internal Server Error')
    expect(String(res.body)).not.toContain('EWEIRD')
  })

  it('returns 500 when readFileSync throws undefined', async () => {
    const res = await runWithThrown(undefined)
    expect(res.status).toBe(500)
    expect(String(res.body)).toBe('Internal Server Error')
  })
})
