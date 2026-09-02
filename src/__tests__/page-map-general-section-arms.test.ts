import { describe, expect, it } from 'vitest'
import { buildPageMap } from '../app/docs/page-map'
import type { ProjectId } from '../config/versions'

/**
 * Coverage for the `isGeneralSection` routing arms inside `buildNavNodes`
 * in src/app/docs/page-map.ts (see kubestellar/docs#6663).
 *
 * NAV_STRUCTURE_CONTRIBUTING / NAV_STRUCTURE_COMMUNITY / NAV_STRUCTURE_NEWS
 * are appended by getNavStructure() to every project's baseStructure, so
 * their pages MUST route under /docs/<section>/... rather than under the
 * per-project base (/docs/a2a/contributing/..., /docs/hive/community/...,
 * etc). Three separate `isGeneralSection` guards in buildNavNodes enforce
 * that invariant — one for each of the three item shapes:
 *
 *   1. object-with-string-value  (page-map.ts ~L581)
 *      { 'Overview': 'contributing/contribute.md' }
 *
 *   2. folder-of-string-children  (page-map.ts ~L597)
 *      { 'CI/CD': [ ... ] } where children are objects whose values
 *      start with contributing/community/news — detected via the
 *      nested Object.values(...).some(...) predicate at L605-611.
 *
 *   3. bare-string item          (page-map.ts ~L561)
 *      A defensive arm for future navs; none of the current
 *      NAV_STRUCTURE_* constants use bare strings, so we only assert
 *      that the top-level route wiring below stays correct — the arm
 *      itself is exercised elsewhere by future nav changes.
 *
 * Regressions in any of these arms would silently move community/news/
 * contributing pages under the wrong project prefix, breaking every
 * cross-project shared-section link.
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

function findByName(nodes: PageNode[], name: string): PageNode | undefined {
  return flatten(nodes).find((n) => n.name === name)
}

function findSharedSection(nodes: PageNode[], name: string, leafName: string): PageNode | undefined {
  // A project can have its own top-level folder with the same title as a
  // shared section (e.g. kubeflex has its own 'Community' entry). Pick the
  // one that actually contains the shared-section leaf.
  return flatten(nodes).find(
    (n) =>
      n.kind === 'Folder' &&
      n.name === name &&
      Array.isArray(n.children) &&
      n.children!.some((c) => c.name === leafName)
  )
}

// The three shared sections appear in every project's nav.
const projects: ProjectId[] = [
  'kubestellar',
  'a2a',
  'kubeflex',
  'multi-plugin',
  'kubestellar-mcp',
  'console',
  'hive',
]

describe('buildNavNodes — object-with-string-value general-section arm', () => {
  it.each(projects)(
    "'%s': 'Overview' under Contributing routes to /docs/contributing/... (not under the project base)",
    (projectId) => {
      const { pageMap } = buildPageMap(projectId) as unknown as BuildResult
      const contributing = findSharedSection(pageMap, 'Contributing', 'Overview')
      expect(contributing).toBeDefined()
      expect(contributing!.kind).toBe('Folder')
      // Folder itself must live under /docs/contributing (shared-section arm
      // in the Array.isArray branch), never under /docs/<project>/contributing.
      expect(contributing!.route).toBe('/docs/contributing')

      // Its leaf 'Overview' (an object with string value
      // 'contributing/contribute.md') must route to /docs/contributing/overview
      // — this hits the object-value string arm's `isGeneralSection = true`
      // path at page-map.ts:592-596.
      const overview = findByName([contributing!], 'Overview')
      expect(overview).toBeDefined()
      expect(overview!.kind).toBe('MdxPage')
      expect(overview!.route).toBe('/docs/contributing/overview')
    }
  )

  it.each(projects)(
    "'%s': 'Get Involved' under Community routes to /docs/community/get-involved",
    (projectId) => {
      const { pageMap } = buildPageMap(projectId) as unknown as BuildResult
      const community = findSharedSection(pageMap, 'Community', 'Get Involved')
      expect(community).toBeDefined()
      expect(community!.route).toBe('/docs/community')

      const getInvolved = findByName([community!], 'Get Involved')
      expect(getInvolved).toBeDefined()
      expect(getInvolved!.route).toBe('/docs/community/get-involved')
    }
  )

  it.each(projects)(
    "'%s': 'Latest News' under News routes to /docs/news/latest-news",
    (projectId) => {
      const { pageMap } = buildPageMap(projectId) as unknown as BuildResult
      const news = findSharedSection(pageMap, 'News', 'Latest News')
      expect(news).toBeDefined()
      expect(news!.route).toBe('/docs/news')

      const latest = findByName([news!], 'Latest News')
      expect(latest).toBeDefined()
      expect(latest!.route).toBe('/docs/news/latest-news')
    }
  )
})

describe('buildNavNodes — folder-of-object-children general-section arm', () => {
  // 'Contributing to Docs/Website' is a folder whose children are single-key
  // objects whose values start with 'contributing/documentation/...'. Detecting
  // that requires the Object.values(v).some(...) inner predicate at
  // page-map.ts:605-611. The folder itself must therefore also route under
  // /docs/contributing (NOT /docs/<project>/contributing).
  it.each(projects)(
    "'%s': nested 'Contributing to Docs/Website' folder routes under /docs/contributing",
    (projectId) => {
      const { pageMap } = buildPageMap(projectId) as unknown as BuildResult
      const contributing = findSharedSection(pageMap, 'Contributing', 'Overview')
      expect(contributing).toBeDefined()

      const docsWebsite = findByName(
        [contributing!],
        'Contributing to Docs/Website'
      )
      expect(docsWebsite).toBeDefined()
      expect(docsWebsite!.kind).toBe('Folder')
      expect(docsWebsite!.route).toBe(
        '/docs/contributing/contributing-to-docs-website'
      )

      // And its leaves must inherit the general-section prefix.
      const structure = findByName([docsWebsite!], 'Docs Structure')
      expect(structure).toBeDefined()
      expect(structure!.route).toBe(
        '/docs/contributing/contributing-to-docs-website/docs-structure'
      )
    }
  )
})

describe('buildNavNodes — non-general folder retains project base path', () => {
  // The complement arm: for every non-'kubestellar' project, the project's own
  // baseStructure produces folders/pages that do NOT start with contributing/,
  // community/, or news/. Those must route under /docs/<project>/... — the
  // `isGeneralSection = false` path of the same three guards.
  const nonDefault: ProjectId[] = [
    'a2a',
    'kubeflex',
    'multi-plugin',
    'kubestellar-mcp',
    'console',
    'hive',
  ]

  it.each(nonDefault)(
    "'%s': at least one project-scoped page routes under /docs/%s/... (non-general arm)",
    (projectId) => {
      const { pageMap } = buildPageMap(projectId) as unknown as BuildResult
      const flat = flatten(pageMap)
      const projectRoutes = flat.filter(
        (n) =>
          typeof n.route === 'string' &&
          n.route.startsWith(`/docs/${projectId}/`)
      )
      expect(projectRoutes.length).toBeGreaterThan(0)

      // And the SHARED-section top-level folders must not have been placed
      // under the project prefix (they live under /docs/contributing etc.
      // regardless of project). A project may legitimately have its own
      // 'community/…' pages inside its contentPath — those are project-owned
      // and unrelated to the shared NAV_STRUCTURE_COMMUNITY arm.
      const sharedFolderUnderProject = flat.filter(
        (n) =>
          n.kind === 'Folder' &&
          (n.name === 'Contributing' ||
            n.name === 'Community' ||
            n.name === 'News') &&
          typeof n.route === 'string' &&
          n.route.startsWith(`/docs/${projectId}/`)
      )
      expect(sharedFolderUnderProject).toEqual([])
    }
  )
})

describe('buildPageMap — special root-level page registrations', () => {
  // Route-map registrations for the two disambiguation pages at
  // page-map.ts:672-682. They fire only when the underlying files exist
  // on disk in the shared docs/content root, which they do in-repo.
  it("registers 'legacy-components' route when legacy-components.md exists", () => {
    const { routeMap } = buildPageMap('kubestellar') as unknown as BuildResult
    expect(routeMap['legacy-components']).toBe('legacy-components.md')
  })

  it("registers 'what-is-console' route when what-is-console.md exists", () => {
    const { routeMap } = buildPageMap('kubestellar') as unknown as BuildResult
    expect(routeMap['what-is-console']).toBe('what-is-console.md')
  })

  it("still registers 'legacy-components' / 'what-is-console' for non-default projects (shared-files merge)", () => {
    const { routeMap } = buildPageMap('a2a') as unknown as BuildResult
    // These come from the projectId !== 'kubestellar' merge block that pulls
    // legacy-components.md and what-is-console.md into allDocFiles, then the
    // includes() guards at L673/L680 fire against the shared root.
    expect(routeMap['legacy-components']).toBe('legacy-components.md')
    expect(routeMap['what-is-console']).toBe('what-is-console.md')
  })
})
