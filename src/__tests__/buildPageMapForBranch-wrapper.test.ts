import { describe, expect, it } from 'vitest'
import {
  buildPageMap,
  buildPageMapForBranch,
} from '../app/docs/page-map'

/**
 * Coverage for the async `buildPageMapForBranch()` wrapper exported from
 * `src/app/docs/page-map.ts`. This is the entry point historically used
 * by branch-scoped previews; it is documented in-source as being kept
 * "for backwards compatibility" and is a thin delegate to
 * `buildPageMap('kubestellar')`.
 *
 * Prior to this suite the wrapper had zero coverage — no test file
 * imports or invokes it. A silent refactor that (a) turned the
 * delegation into a broken direct call, (b) dropped the async-ness,
 * or (c) started passing the caller's own arguments through would
 * change the shape of the returned build (a `pageMap`/`routeMap`/
 * `filePaths`/`contentPath` bundle for the `kubestellar` project) and
 * every branch-preview build downstream would silently regress to
 * empty navigation.
 *
 * We lock four things here:
 *
 *   1. The wrapper is an async function returning a Promise.
 *   2. The resolved value is deep-equal to `buildPageMap('kubestellar')`
 *      — i.e., no extra rewriting, no project-id substitution.
 *   3. The four documented top-level keys (`pageMap`, `routeMap`,
 *      `filePaths`, `contentPath`) are all present.
 *   4. Calling it a second time is stable (same result), so it can
 *      safely be invoked from repeat branch-preview requests.
 */
describe('buildPageMapForBranch — async delegation wrapper', () => {
  it('is an async function returning a Promise', () => {
    expect(typeof buildPageMapForBranch).toBe('function')
    const returned = buildPageMapForBranch()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(returned && typeof (returned as any).then).toBe('function')
    // Prevent an unhandled promise if the assertion fires.
    return returned.then(() => {})
  })

  it('resolves to the exact same build as buildPageMap("kubestellar")', async () => {
    const [async_, sync] = await Promise.all([
      buildPageMapForBranch(),
      Promise.resolve(buildPageMap('kubestellar')),
    ])
    expect(async_).toEqual(sync)
  })

  it('resolved value carries the documented pageMap/routeMap/filePaths/contentPath shape', async () => {
    const build = await buildPageMapForBranch()
    expect(build).toHaveProperty('pageMap')
    expect(build).toHaveProperty('routeMap')
    expect(build).toHaveProperty('filePaths')
    expect(build).toHaveProperty('contentPath')

    expect(Array.isArray(build.pageMap)).toBe(true)
    expect(Array.isArray(build.filePaths)).toBe(true)
    expect(typeof build.contentPath).toBe('string')
    expect(build.contentPath.length).toBeGreaterThan(0)
    expect(typeof build.routeMap).toBe('object')
    expect(build.routeMap).not.toBeNull()
  })

  it('returns a stable result across repeat calls (idempotent for preview reruns)', async () => {
    const first = await buildPageMapForBranch()
    const second = await buildPageMapForBranch()
    expect(second).toEqual(first)
  })
})
