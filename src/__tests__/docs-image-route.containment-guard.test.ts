import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Regression guard for the second traversal-defense branch in
 * src/app/api/docs-image/[...path]/route.ts (line 33):
 *
 *   if (!fullPath.startsWith(DOCS_CONTENT_PATH + path.sep)) {
 *     return new NextResponse('Forbidden', { status: 403 })
 *   }
 *
 * This branch was intended to catch prefix-confusion escapes that survive
 * the earlier `imagePath.includes('..')` guard — e.g. an empty path where
 * `path.join(base, '')` returns exactly `base` (no trailing separator), or
 * a Next.js catch-all invocation that yields an empty segment. The existing
 * "escapes prefix" test in docs-image-route.test.ts uses input '..hidden',
 * which is actually caught by the first `..` check on line 26, leaving the
 * second guard on line 33 unexercised.
 */

vi.mock('fs', () => ({
  default: {
    existsSync: () => false,
    readFileSync: () => Buffer.alloc(0),
  },
}))

vi.mock('next/server', () => {
  class NextResponse {
    body: unknown
    status: number
    headers: Map<string, string>
    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body
      this.status = init?.status ?? 200
      this.headers = new Map(Object.entries(init?.headers ?? {}))
    }
  }
  return { NextRequest: class {}, NextResponse }
})

async function call(pathSegments: string[]) {
  const { GET } = await import('../app/api/docs-image/[...path]/route')
  const params = Promise.resolve({ path: pathSegments })
  return (await GET({} as never, { params })) as unknown as {
    body: unknown
    status: number
  }
}

describe('/api/docs-image/[...path] — containment guard (empty path)', () => {
  beforeEach(() => vi.resetModules())

  it('rejects an empty path (single empty segment) with 403 via containment guard', async () => {
    // pathSegments.join('/') === '' → path.join(base, '') === base (no trailing sep)
    // → !fullPath.startsWith(base + path.sep) is true → the line-33 branch fires.
    // No '..' is present, so this cannot be caught by the earlier guard.
    const res = await call([''])
    expect(res.status).toBe(403)
    expect(res.body).toBe('Forbidden')
  })

  it('rejects an empty catch-all (no segments) with 403 via containment guard', async () => {
    // Same reasoning; guards must also handle the [] shape that Next.js
    // can occasionally deliver for a bare /api/docs-image/ hit.
    const res = await call([])
    expect(res.status).toBe(403)
    expect(res.body).toBe('Forbidden')
  })
})
