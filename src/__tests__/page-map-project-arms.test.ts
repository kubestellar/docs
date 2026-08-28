import { describe, expect, it } from 'vitest'
import { buildPageMap } from '../app/docs/page-map'

/**
 * Coverage for the three previously-untested ProjectId arms of
 * getNavStructure() and the sibling general-files filter in buildPageMap()
 * inside src/app/docs/page-map.ts:
 *
 *   * lines 527-528  -> case 'a2a'          -> NAV_STRUCTURE_A2A
 *   * lines 533-534  -> case 'kubeflex'     -> NAV_STRUCTURE_KUBEFLEX
 *   * lines 542-543  -> case 'multi-plugin' -> NAV_STRUCTURE_MULTI_PLUGIN
 *   * lines 578-587  -> the `if (projectId !== 'kubestellar')` block that
 *                       pulls the shared contributing/community/news
 *                       markdown files (plus intro.md, legacy-components.md,
 *                       what-is-console.md) in from the main docs tree.
 *
 * Prior tests exercise only 'kubestellar', 'console', 'kubestellar-mcp',
 * 'hive'.  Regressions to the a2a/kubeflex/multi-plugin arms — e.g.
 * accidentally routing them to NAV_STRUCTURE_KUBESTELLAR (the default arm)
 * — would go completely unnoticed today.
 */

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

function flatten(nodes: PageNode[]): PageNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children || [])])
}

// --- a2a arm --------------------------------------------------------------

describe("buildPageMap('a2a') — getNavStructure switch arm", () => {
  it('uses the a2a base path (not the default kubestellar base)', () => {
    const { pageMap } = buildPageMap('a2a') as unknown as BuildResult
    const flat = flatten(pageMap)
    // At least one project-scoped node must live under /docs/a2a; a regression
    // to the default arm would put everything under /docs/... instead.
    const a2aNodes = flat.filter(
      (n) => typeof n.route === 'string' && n.route.startsWith('/docs/a2a/')
    )
    expect(a2aNodes.length).toBeGreaterThan(0)
  })

  it('exposes an "a2a-specific" top-level section such as "Contribute to A2A"', () => {
    const { pageMap } = buildPageMap('a2a') as unknown as BuildResult
    const titles = pageMap.map((n) => n.name)
    expect(titles).toContain('Contribute to A2A')
  })

  it('registers the a2a intro.md under /docs/a2a/overview/introduction', () => {
    const { routeMap, filePaths } = buildPageMap('a2a') as unknown as BuildResult
    expect(filePaths).toContain('intro.md')
    expect(routeMap['overview/introduction']).toBe('intro.md')
  })
})

// --- kubeflex arm --------------------------------------------------------

describe("buildPageMap('kubeflex') — getNavStructure switch arm", () => {
  it('uses the kubeflex base path (not the default kubestellar base)', () => {
    const { pageMap } = buildPageMap('kubeflex') as unknown as BuildResult
    const flat = flatten(pageMap)
    const nodes = flat.filter(
      (n) => typeof n.route === 'string' && n.route.startsWith('/docs/kubeflex/')
    )
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('picks up a kubeflex-only source file such as architecture.md', () => {
    const { filePaths } = buildPageMap('kubeflex') as unknown as BuildResult
    expect(filePaths).toContain('architecture.md')
  })
})

// --- multi-plugin arm ----------------------------------------------------

describe("buildPageMap('multi-plugin') — getNavStructure switch arm", () => {
  it('uses the multi-plugin base path', () => {
    const { pageMap } = buildPageMap('multi-plugin') as unknown as BuildResult
    const flat = flatten(pageMap)
    const nodes = flat.filter(
      (n) => typeof n.route === 'string' && n.route.startsWith('/docs/multi-plugin/')
    )
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('picks up multi-plugin-only source files (readme.md, api_reference.md)', () => {
    const { filePaths } = buildPageMap('multi-plugin') as unknown as BuildResult
    expect(filePaths).toContain('readme.md')
    expect(filePaths).toContain('api_reference.md')
  })

  it('exposes a "Development" or similar multi-plugin section not present on the default arm', () => {
    const { pageMap } = buildPageMap('multi-plugin') as unknown as BuildResult
    const titles = pageMap.map((n) => n.name)
    // NAV_STRUCTURE_MULTI_PLUGIN ends with a top-level "Development" folder.
    expect(titles).toContain('Development')
  })
})

// --- shared general-files pull-in ---------------------------------------

describe('buildPageMap — non-kubestellar projects pull in shared general files', () => {
  // This exercises lines 578-587: the block that runs only when
  // projectId !== 'kubestellar' and merges general-section files (plus
  // intro.md / legacy-components.md / what-is-console.md) from the main
  // KubeStellar content root into the project-scoped allDocFiles list.
  it.each(['a2a', 'kubeflex', 'multi-plugin', 'console', 'kubestellar-mcp'] as const)(
    "'%s' includes at least one contributing/, community/, or news/ file from the shared root",
    (projectId) => {
      const { filePaths } = buildPageMap(projectId) as unknown as BuildResult
      const shared = filePaths.filter(
        (f) =>
          f.startsWith('contributing/') || f.startsWith('community/') || f.startsWith('news/')
      )
      expect(shared.length).toBeGreaterThan(0)
    }
  )

  it("'kubestellar' does NOT double-count shared files (they come from its own content root)", () => {
    // For the default project we skip the merge block entirely; the file
    // list should not contain duplicate entries for the same shared path.
    const { filePaths } = buildPageMap('kubestellar') as unknown as BuildResult
    const shared = filePaths.filter(
      (f) =>
        f.startsWith('contributing/') || f.startsWith('community/') || f.startsWith('news/')
    )
    const unique = new Set(shared)
    expect(shared.length).toBe(unique.size)
  })
})
