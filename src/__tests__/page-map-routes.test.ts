import { describe, expect, it } from 'vitest'
import { buildPageMap, buildPageMapForBranch } from '../app/docs/page-map'

/**
 * Coverage for uncovered arms of buildPageMap() and buildPageMapForBranch()
 * in src/app/docs/page-map.ts:
 *
 *   - The "general section" branch (contributing/, community/, news/) that
 *     routes those folders under /docs/<section> even when buildPageMap is
 *     invoked with a non-kubestellar projectId. A regression here would
 *     route contributing/community/news pages under the current project's
 *     base path (e.g. /docs/console/contributing/...) and break shared
 *     cross-project navigation.
 *
 *   - The three special-page route-map entries injected outside the normal
 *     nav walk: `introduction` (intro.md, kubestellar project only),
 *     `legacy-components` (legacy-components.md), and `what-is-console`
 *     (what-is-console.md). Any of these disappearing silently would
 *     break externally-shared /docs/introduction, /docs/legacy-components,
 *     and /docs/what-is-console URLs.
 *
 *   - The exported `buildPageMapForBranch` compatibility wrapper — it
 *     must delegate to buildPageMap() with the default project so callers
 *     upstream of the branch-aware refactor keep seeing the same shape.
 */

describe('buildPageMap – general section routing (contributing/community/news)', () => {
  it('routes the Contributing folder under /docs/contributing regardless of project', () => {
    // Console is a non-default project; without the isGeneralSection
    // branch its base path would be `/docs/console`, which would send
    // contributing pages under `/docs/console/contributing/...`.
    const { pageMap } = buildPageMap('console')
    const flat = flattenNodes(pageMap as PageNode[])
    const contributing = flat.filter(
      (n) => n.kind === 'Folder' && typeof n.route === 'string' && n.route.startsWith('/docs/contributing')
    )
    expect(contributing.length).toBeGreaterThan(0)
    // Not routed under the project base.
    const misrouted = flat.filter(
      (n) => n.kind === 'Folder' && typeof n.route === 'string' && n.route.startsWith('/docs/console/contributing')
    )
    expect(misrouted).toHaveLength(0)
  })

  it('routes the Community folder under /docs/community regardless of project', () => {
    const { pageMap } = buildPageMap('kubeflex')
    const flat = flattenNodes(pageMap as PageNode[])
    const community = flat.filter(
      (n) => n.kind === 'Folder' && typeof n.route === 'string' && n.route.startsWith('/docs/community')
    )
    expect(community.length).toBeGreaterThan(0)
    const misrouted = flat.filter(
      (n) => n.kind === 'Folder' && typeof n.route === 'string' && n.route.startsWith('/docs/kubeflex/community')
    )
    expect(misrouted).toHaveLength(0)
  })

  it('routes the News folder under /docs/news regardless of project', () => {
    const { pageMap } = buildPageMap('kubestellar-mcp')
    const flat = flattenNodes(pageMap as PageNode[])
    const news = flat.filter(
      (n) => n.kind === 'Folder' && typeof n.route === 'string' && n.route.startsWith('/docs/news')
    )
    expect(news.length).toBeGreaterThan(0)
    const misrouted = flat.filter(
      (n) => n.kind === 'Folder' && typeof n.route === 'string' && n.route.startsWith('/docs/kubestellar-mcp/news')
    )
    expect(misrouted).toHaveLength(0)
  })
})

describe('buildPageMap – special top-level route entries', () => {
  it('injects the introduction route for the default kubestellar project only', () => {
    const ks = buildPageMap('kubestellar') as unknown as BuildResult
    expect(ks.routeMap['introduction']).toBe('intro.md')

    // For a non-default project the shared kubestellar intro is not
    // injected under /docs/<project>/introduction.
    const console = buildPageMap('console') as unknown as BuildResult
    expect(console.routeMap['introduction']).toBeUndefined()
  })

  it('injects the legacy-components route when the file exists', () => {
    const { routeMap, filePaths } = buildPageMap('kubestellar') as unknown as BuildResult
    // Precondition — the fixture must actually ship the file, otherwise
    // this test is guarding nothing.
    expect(filePaths).toContain('legacy-components.md')
    expect(routeMap['legacy-components']).toBe('legacy-components.md')
  })

  it('injects the what-is-console disambiguation route when the file exists', () => {
    const { routeMap, filePaths } = buildPageMap('kubestellar') as unknown as BuildResult
    expect(filePaths).toContain('what-is-console.md')
    expect(routeMap['what-is-console']).toBe('what-is-console.md')
  })

  it('registers a stable fallback route for every markdown file it discovered', () => {
    // The tail-loop populates routeMap[noExt] for any file not already
    // routed by the nav walk. Spot-check that a couple of known files
    // are addressable by their extension-stripped path.
    const { routeMap, filePaths } = buildPageMap('kubestellar') as unknown as BuildResult
    const knownFiles = filePaths.filter((f) => f.endsWith('.md') || f.endsWith('.mdx')).slice(0, 20)
    expect(knownFiles.length).toBeGreaterThan(0)
    for (const fp of knownFiles) {
      const noExt = fp.replace(/\.(md|mdx)$/i, '')
      expect(routeMap[noExt]).toBeDefined()
    }
  })
})

describe('buildPageMapForBranch – backwards-compatible wrapper', () => {
  it('delegates to buildPageMap with the default kubestellar project', async () => {
    const wrapped = await buildPageMapForBranch()
    const direct = buildPageMap('kubestellar')

    // The wrapper is a thin compatibility shim: it should produce a
    // result with the same top-level shape as the direct call.
    expect(Object.keys(wrapped).sort()).toEqual(
      Object.keys(direct).sort()
    )
    const w = wrapped as unknown as BuildResult
    const d = direct as unknown as BuildResult
    expect(w.contentPath).toBe(d.contentPath)
    expect(w.filePaths.length).toBe(d.filePaths.length)
    // The two calls resolve the same intro route.
    expect(w.routeMap['introduction']).toBe(d.routeMap['introduction'])
  })
})

// --- Helpers & types local to this test module ---------------------------

type PageNode = {
  kind: 'Folder' | 'MdxPage' | 'Meta'
  name?: string
  route?: string
  children?: PageNode[]
}

type BuildResult = {
  pageMap: PageNode[]
  routeMap: Record<string, string>
  filePaths: string[]
  contentPath: string
}

function flattenNodes(nodes: PageNode[]): PageNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children || [])])
}
