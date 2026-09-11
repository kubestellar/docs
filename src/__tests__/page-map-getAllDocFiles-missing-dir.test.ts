import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Focused coverage for the defensive early-return in `getAllDocFiles`
 * at src/app/docs/page-map.ts:63:
 *
 *     if (!fs.existsSync(dir)) {
 *       return files   // empty
 *     }
 *
 * This arm exists to make `buildPageMap` degrade gracefully when a
 * project's content directory is absent (unpinned submodule, pre-CI
 * checkout, doc-source pruning). All existing page-map tests run
 * against the real, fully-populated /docs/content/ tree, so the
 * `!fs.existsSync(dir)` branch never fires under normal test runs.
 *
 * Regression risk: if this branch is deleted (or the guard is
 * inverted), a missing content dir throws ENOENT from
 * `fs.readdirSync`, which crashes SSR of every `/docs/*` page.
 */

describe('getAllDocFiles — nonexistent-dir defensive early return', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('buildPageMap returns without throwing when contentPath does not exist', async () => {
    // Force existsSync to return false for every path so getAllDocFiles
    // takes the early-return arm on the very first call. readdirSync is
    // stubbed to a throwing implementation to guarantee that if the guard
    // regresses, the failure surface is loud and this test catches it.
    vi.doMock('fs', () => {
      const throwEnoent = () => {
        const err = Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        })
        throw err
      }
      return {
        default: {
          existsSync: () => false,
          readdirSync: throwEnoent,
        },
        existsSync: () => false,
        readdirSync: throwEnoent,
      }
    })

    const mod = await import('../app/docs/page-map')

    // buildPageMap may throw downstream from `normalizePageMap`
    // (Nextra's _meta validator) when there are no files to route, but
    // it MUST NOT throw ENOENT from `fs.readdirSync` — that's what the
    // getAllDocFiles guard exists to prevent. Pick a non-kubestellar
    // projectId so the general-section merge block also calls
    // getAllDocFiles(docsContentPath), exercising the guard twice.
    let caught: unknown
    try {
      mod.buildPageMap('console')
    } catch (err) {
      caught = err
    }

    const msg = caught instanceof Error ? caught.message : String(caught ?? '')
    // If the guard regressed, we'd see the ENOENT bubble up from
    // readdirSync (the "throwing" stub above). Assert we do NOT.
    expect(msg).not.toContain('ENOENT')
    expect(msg).not.toContain('no such file or directory')
  })
})
