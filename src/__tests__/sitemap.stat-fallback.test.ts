import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sitemap from '@/app/sitemap'

const SITE_URL = 'https://kubestellar.io'

function mkTmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-stat-fallback-'))
}

function write(root: string, rel: string, body = 'x') {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, body)
  return abs
}

/*
 * Regression coverage for the `catch` branch of `getLastModified` in
 * `src/app/sitemap.ts` (line 89). The function is called for every
 * markdown file discovered by `findMarkdownFiles`, but the existing
 * sitemap tests use a real temp directory so `fs.statSync` never
 * throws — leaving the fallback path (`return new Date()`) uncovered.
 *
 * If a file disappears between the readdir scan and the stat call
 * (or if the process lacks permission to stat it), we still want a
 * valid `Date` in the sitemap entry, not `undefined`. Otherwise the
 * emitted <lastmod> for the entry becomes invalid XML.
 *
 * This suite forces `statSync` to throw for one specific file and
 * asserts the corresponding sitemap entry:
 *   - is still emitted (i.e., the whole sitemap doesn't blow up), and
 *   - has a valid Date-typed `lastModified` field.
 */
describe('sitemap() — getLastModified fallback when statSync throws', () => {
  let root: string
  let cwdSpy: ReturnType<typeof vi.spyOn>
  let statSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    root = mkTmpRoot()
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(root)
  })

  afterEach(() => {
    statSpy?.mockRestore()
    cwdSpy.mockRestore()
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('emits an entry with a Date lastModified even when statSync throws (KubeStellar root file)', () => {
    const badFile = write(root, 'docs/content/broken.md')

    const realStat = fs.statSync
    statSpy = vi.spyOn(fs, 'statSync').mockImplementation(((p: string, ...rest: unknown[]) => {
      if (typeof p === 'string' && path.resolve(p) === path.resolve(badFile)) {
        const err = Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        })
        throw err
      }
      // Delegate everything else — readdir & existsSync also touch statSync via
      // the underlying binding on some Node versions, so we cannot blanket-throw.
      return (realStat as unknown as (...a: unknown[]) => fs.Stats).call(fs, p, ...rest)
    }) as unknown as typeof fs.statSync)

    const entries = sitemap()
    const brokenEntry = entries.find((e) => e.url === `${SITE_URL}/docs/broken`)

    expect(brokenEntry, 'entry for /docs/broken should still be emitted').toBeDefined()
    // Fallback path in getLastModified returns `new Date()` — the concrete
    // value is time-dependent, so we only assert the type invariant.
    expect(brokenEntry?.lastModified).toBeInstanceOf(Date)
    expect(Number.isFinite((brokenEntry?.lastModified as Date).getTime())).toBe(true)
  })

  it('emits an entry with a Date lastModified even when statSync throws (project sub-directory file)', () => {
    const badFile = write(root, 'docs/content/a2a/gone.md')

    const realStat = fs.statSync
    statSpy = vi.spyOn(fs, 'statSync').mockImplementation(((p: string, ...rest: unknown[]) => {
      if (typeof p === 'string' && path.resolve(p) === path.resolve(badFile)) {
        const err = Object.assign(new Error('EACCES: permission denied'), {
          code: 'EACCES',
        })
        throw err
      }
      return (realStat as unknown as (...a: unknown[]) => fs.Stats).call(fs, p, ...rest)
    }) as unknown as typeof fs.statSync)

    const entries = sitemap()
    const goneEntry = entries.find((e) => e.url === `${SITE_URL}/docs/a2a/gone`)

    expect(goneEntry, 'entry for /docs/a2a/gone should still be emitted').toBeDefined()
    expect(goneEntry?.lastModified).toBeInstanceOf(Date)
    expect(Number.isFinite((goneEntry?.lastModified as Date).getTime())).toBe(true)
  })

  it('populates lastModified from real mtime when statSync succeeds (control)', () => {
    // Positive control so a future refactor that accidentally short-circuits
    // getLastModified to always return `new Date()` still gets caught.
    const abs = write(root, 'docs/content/ok.md')
    const past = new Date('2024-01-02T03:04:05.000Z')
    fs.utimesSync(abs, past, past)

    const entries = sitemap()
    const okEntry = entries.find((e) => e.url === `${SITE_URL}/docs/ok`)

    expect(okEntry).toBeDefined()
    const lm = okEntry?.lastModified as Date
    expect(lm).toBeInstanceOf(Date)
    // Filesystem mtime resolution varies (seconds on some FS); allow a
    // 2 s window either side of the recorded timestamp.
    const delta = Math.abs(lm.getTime() - past.getTime())
    expect(delta).toBeLessThanOrEqual(2000)
  })
})
