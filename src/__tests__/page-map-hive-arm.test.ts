import { describe, expect, it } from 'vitest'
import { buildPageMap } from '../app/docs/page-map'

/**
 * Coverage for the 'hive' arm of getNavStructure() (page-map.ts:527-528)
 * — the only remaining project id in the switch that had no dedicated
 * test after page-map-project-arms.test.ts covered a2a / kubeflex /
 * multi-plugin (#6xx) and page-map-getters.test.ts covered kubestellar /
 * console / kubestellar-mcp getters.
 *
 * A regression that dropped the 'hive' case would silently fall through
 * to the `default: baseStructure = NAV_STRUCTURE_KUBESTELLAR` arm and
 * ship the wrong sidebar for docs.kubestellar.io/hive.
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

describe("buildPageMap('hive') — getNavStructure switch arm", () => {
  it('uses the hive base path (not the default kubestellar base)', () => {
    const { pageMap } = buildPageMap('hive') as unknown as BuildResult
    const flat = flatten(pageMap)
    const hiveNodes = flat.filter(
      (n) => typeof n.route === 'string' && n.route.startsWith('/docs/hive/')
    )
    expect(hiveNodes.length).toBeGreaterThan(0)
  })

  it('exposes NAV_STRUCTURE_HIVE top-level sections ("Overview" and "Operations")', () => {
    // If the switch fell through to the kubestellar default, the top-level
    // categories would include "Getting Started" and "User Guide" — not the
    // hive-specific "Operations" section.
    const { pageMap } = buildPageMap('hive') as unknown as BuildResult
    const titles = pageMap.map((n) => n.name)
    expect(titles).toContain('Overview')
    expect(titles).toContain('Operations')
  })

  it('registers hive-specific pages such as architecture.md and governor.md', () => {
    const { routeMap, filePaths } = buildPageMap('hive') as unknown as BuildResult
    expect(filePaths).toContain('architecture.md')
    expect(filePaths).toContain('governor.md')
    // The Operations section maps { 'Governor': 'governor.md' } via a
    // slugified title, so the route key ends with '/governor'.
    const governorKey = Object.keys(routeMap).find(
      (k) => routeMap[k] === 'governor.md',
    )
    expect(governorKey).toBeDefined()
  })

  it('includes shared general sections (Contributing, Community, News) alongside hive nav', () => {
    // Non-kubestellar projects merge in the shared contributing/community/news
    // files via buildPageMap's `projectId !== 'kubestellar'` block (~lines
    // 543-551), so those sidebar categories must be present too.
    const { pageMap } = buildPageMap('hive') as unknown as BuildResult
    const titles = pageMap.map((n) => n.name)
    expect(titles).toContain('Community')
    expect(titles).toContain('News')
  })
})
