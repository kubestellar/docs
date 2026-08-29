import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sitemap from '@/app/sitemap'

const SITE_URL = 'https://kubestellar.io'

function mkTmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-test-'))
}

function write(root: string, rel: string, body = 'x') {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, body)
  return abs
}

describe('sitemap()', () => {
  let root: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    root = mkTmpRoot()
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(root)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('includes the homepage with priority 1.0 and monthly frequency', () => {
    const entries = sitemap()
    const home = entries.find((e) => e.url === SITE_URL)
    expect(home).toBeDefined()
    expect(home?.priority).toBe(1.0)
    expect(home?.changeFrequency).toBe('monthly')
  })

  it('includes all fixed marketing pages with priority 0.8', () => {
    const entries = sitemap()
    const expected = [
      '/en',
      '/en/products',
      '/en/partners',
      '/en/programs',
      '/en/leaderboard',
      '/en/marketplace',
      '/en/quick-installation',
      '/en/contribute-handbook',
      '/en/ladder',
      '/en/playground',
    ]
    for (const p of expected) {
      const e = entries.find((x) => x.url === `${SITE_URL}${p}`)
      expect(e, `missing ${p}`).toBeDefined()
      expect(e?.priority).toBe(0.8)
      expect(e?.changeFrequency).toBe('monthly')
    }
  })

  it('includes the /docs landing page at priority 0.9 (weekly)', () => {
    const entries = sitemap()
    const docs = entries.find((e) => e.url === `${SITE_URL}/docs`)
    expect(docs).toBeDefined()
    expect(docs?.priority).toBe(0.9)
    expect(docs?.changeFrequency).toBe('weekly')
  })

  it('adds a root entry for every project (a2a, kubeflex, multi-plugin, kubestellar-mcp, console) at priority 0.9', () => {
    const entries = sitemap()
    for (const p of ['a2a', 'kubeflex', 'multi-plugin', 'kubestellar-mcp', 'console']) {
      const e = entries.find((x) => x.url === `${SITE_URL}/docs/${p}`)
      expect(e, `missing project root ${p}`).toBeDefined()
      expect(e?.priority).toBe(0.9)
      expect(e?.changeFrequency).toBe('weekly')
    }
  })

  it('walks docs/content and emits an entry for every .md/.mdx page (KubeStellar root)', () => {
    write(root, 'docs/content/getting-started.md')
    write(root, 'docs/content/kubestellar/architecture.mdx')
    write(root, 'docs/content/community/index.md')

    const entries = sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain(`${SITE_URL}/docs/getting-started`)
    expect(urls).toContain(`${SITE_URL}/docs/kubestellar/architecture`)
    // /index files collapse to the parent folder route
    expect(urls).toContain(`${SITE_URL}/docs/community`)
  })

  it('scopes project sub-directory files under /docs/<basePath>/…', () => {
    write(root, 'docs/content/a2a/overview.md')
    write(root, 'docs/content/kubeflex/install/quickstart.mdx')

    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain(`${SITE_URL}/docs/a2a/overview`)
    expect(urls).toContain(`${SITE_URL}/docs/kubeflex/install/quickstart`)
  })

  it('skips underscore-prefixed files, hidden dirs, node_modules, common-subs, and images', () => {
    write(root, 'docs/content/_partial.md')
    write(root, 'docs/content/.hidden/skip.md')
    write(root, 'docs/content/node_modules/pkg/skip.md')
    write(root, 'docs/content/common-subs/frag.md')
    write(root, 'docs/content/images/README.md')
    // one valid file so we still have entries
    write(root, 'docs/content/keep.md')

    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain(`${SITE_URL}/docs/keep`)
    expect(urls.some((u) => u.includes('_partial'))).toBe(false)
    expect(urls.some((u) => u.includes('/hidden'))).toBe(false)
    expect(urls.some((u) => u.includes('/pkg/skip'))).toBe(false)
    expect(urls.some((u) => u.includes('/common-subs'))).toBe(false)
    expect(urls.some((u) => u.includes('/images'))).toBe(false)
  })

  it('ignores non-markdown files entirely', () => {
    write(root, 'docs/content/readme.txt')
    write(root, 'docs/content/image.png')
    const urls = sitemap().map((e) => e.url)
    expect(urls.some((u) => u.endsWith('readme'))).toBe(false)
    expect(urls.some((u) => u.endsWith('image'))).toBe(false)
  })

  it('does NOT double-count project files under the root KubeStellar walk', () => {
    write(root, 'docs/content/a2a/only-a2a.md')
    const urls = sitemap().map((e) => e.url)
    // Present under the a2a project scope
    expect(urls).toContain(`${SITE_URL}/docs/a2a/only-a2a`)
    // Never emitted as a root KubeStellar page
    expect(urls).not.toContain(`${SITE_URL}/docs/a2a/only-a2a`.replace('/docs/a2a/', '/docs/'))
  })

  it('sets docs page priority to 0.7 and weekly changeFrequency', () => {
    const file = write(root, 'docs/content/guide.md')
    const stats = fs.statSync(file)
    const entries = sitemap()
    const e = entries.find((x) => x.url === `${SITE_URL}/docs/guide`)
    expect(e?.priority).toBe(0.7)
    expect(e?.changeFrequency).toBe('weekly')
    // lastModified comes from file mtime
    expect((e?.lastModified as Date).getTime()).toBe(stats.mtime.getTime())
  })

  it('adds contributor profile pages from public/data/leaderboard.json', () => {
    write(
      root,
      'public/data/leaderboard.json',
      JSON.stringify({
        generated_at: '2025-01-15T00:00:00Z',
        entries: [{ login: 'alice' }, { login: 'bob' }],
      })
    )
    const entries = sitemap()
    const alice = entries.find((e) => e.url === `${SITE_URL}/en/leaderboard/alice`)
    const bob = entries.find((e) => e.url === `${SITE_URL}/en/leaderboard/bob`)
    expect(alice).toBeDefined()
    expect(bob).toBeDefined()
    expect(alice?.priority).toBe(0.7)
    expect(alice?.changeFrequency).toBe('monthly')
    expect((alice?.lastModified as Date).toISOString()).toBe('2025-01-15T00:00:00.000Z')
  })

  it('silently skips leaderboard section when the JSON is malformed', () => {
    write(root, 'public/data/leaderboard.json', '{not json')
    expect(() => sitemap()).not.toThrow()
    const urls = sitemap().map((e) => e.url)
    expect(urls.some((u) => u.startsWith(`${SITE_URL}/en/leaderboard/`))).toBe(false)
  })

  it('handles an empty entries array in leaderboard.json without emitting profile URLs', () => {
    write(root, 'public/data/leaderboard.json', JSON.stringify({ entries: [] }))
    const urls = sitemap().map((e) => e.url)
    expect(urls.some((u) => u.startsWith(`${SITE_URL}/en/leaderboard/`))).toBe(false)
  })

  it('returns a valid sitemap even when docs/content does not exist', () => {
    // no docs/content at all
    const entries = sitemap()
    // homepage + 10 marketing + /docs + 5 project roots = 17
    expect(entries.length).toBeGreaterThanOrEqual(17)
    expect(entries.find((e) => e.url === SITE_URL)).toBeDefined()
  })
})
