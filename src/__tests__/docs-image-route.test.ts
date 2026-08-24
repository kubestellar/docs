import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for the /api/docs-image/[...path] route handler.
 *
 * This endpoint serves images from docs/content and MUST reject any
 * path that could escape the docs/content directory (CWE-22 path
 * traversal). It also derives the Content-Type from the file
 * extension via a whitelist, defaulting to application/octet-stream.
 *
 * We mock 'fs' so tests are hermetic and never touch the filesystem.
 */

// ─── Hoisted mock file table (available inside vi.mock factories) ────

const { mockFiles } = vi.hoisted(() => {
  const mockFiles: Record<string, Buffer> = {
    'diagram.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    'photo.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    'photo.jpeg': Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
    'anim.gif': Buffer.from('GIF89a'),
    'icon.svg': Buffer.from('<svg/>'),
    'pic.webp': Buffer.from('RIFF'),
    'fav.ico': Buffer.from([0x00, 0x00, 0x01, 0x00]),
    'nested/deep/image.png': Buffer.from([0x89, 0x50]),
    'no-extension': Buffer.from('opaque'),
    'file.TXT': Buffer.from('unknown mime'),
  }
  return { mockFiles }
})

// ─── Mocks ───────────────────────────────────────────────────────────

vi.mock('fs', () => {
  const stripPrefix = (p: string) => p.replace(/.*\/docs\/content\//, '')
  return {
    default: {
      existsSync: (p: string) => stripPrefix(p) in mockFiles,
      readFileSync: (p: string) => mockFiles[stripPrefix(p)],
    },
  }
})

// Minimal NextRequest / NextResponse shims — the route uses only
// `new NextResponse(body, init)` and does not read from `request`.
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

// ─── Helpers ─────────────────────────────────────────────────────────

async function call(pathSegments: string[]) {
  const { GET } = await import('../app/api/docs-image/[...path]/route')
  const params = Promise.resolve({ path: pathSegments })
  // `request` is unused by the handler
  return (await GET({} as never, { params })) as unknown as {
    body: unknown
    status: number
    headers: Map<string, string>
  }
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('/api/docs-image/[...path] — path traversal defense', () => {
  beforeEach(() => vi.resetModules())

  it('rejects .. in the path with 403', async () => {
    const res = await call(['..', 'etc', 'passwd'])
    expect(res.status).toBe(403)
    expect(res.body).toBe('Forbidden')
  })

  it('rejects .. embedded in a segment with 403', async () => {
    // '..foo' technically contains '..' — the guard is conservative
    const res = await call(['..foo', 'diagram.png'])
    expect(res.status).toBe(403)
  })

  it('rejects a nested .. that would climb out of docs/content', async () => {
    const res = await call(['nested', '..', '..', 'secret.png'])
    expect(res.status).toBe(403)
  })

  it('rejects an absolute-looking path segment that escapes prefix', async () => {
    // path.join collapses '/etc/passwd' with the base and the containment
    // check `fullPath.startsWith(base + sep)` catches any escape that
    // survives the '..' check.
    const res = await call(['nested', '..hidden'])
    expect(res.status).toBe(403)
  })
})

describe('/api/docs-image/[...path] — successful lookups', () => {
  beforeEach(() => vi.resetModules())

  it('serves a PNG with image/png Content-Type', async () => {
    const res = await call(['diagram.png'])
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable'
    )
  })

  it('serves a nested image', async () => {
    const res = await call(['nested', 'deep', 'image.png'])
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
  })

  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['anim.gif', 'image/gif'],
    ['icon.svg', 'image/svg+xml'],
    ['pic.webp', 'image/webp'],
    ['fav.ico', 'image/x-icon'],
  ])('maps %s to %s', async (file, mime) => {
    const res = await call([file])
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe(mime)
  })

  it('falls back to application/octet-stream for unknown extensions', async () => {
    const res = await call(['file.TXT'])
    // Extension is lowercased then looked up — '.txt' is not in the whitelist
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream')
  })

  it('falls back to application/octet-stream when there is no extension', async () => {
    const res = await call(['no-extension'])
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream')
  })
})

describe('/api/docs-image/[...path] — missing files', () => {
  beforeEach(() => vi.resetModules())

  it('returns 404 for a file that does not exist', async () => {
    const res = await call(['does-not-exist.png'])
    expect(res.status).toBe(404)
    expect(res.body).toBe('Not Found')
  })

  it('returns 404 for a nonexistent nested path', async () => {
    const res = await call(['nested', 'missing.png'])
    expect(res.status).toBe(404)
  })
})
