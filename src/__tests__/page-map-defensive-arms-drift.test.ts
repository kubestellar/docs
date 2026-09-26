import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Source-parsing drift-guard for the DEFENSIVE arms inside `buildNavNodes`
 * (src/app/docs/page-map.ts). These arms cannot currently be exercised at
 * runtime because none of the nav.yaml files use a bare string item or an
 * external/absolute-URL value; but each arm exists to keep the
 * general-section routing invariant intact when future navs are added.
 *
 * If a future refactor silently deletes or narrows any of these arms, this
 * file catches it before the drift reaches production. It complements the
 * runtime-exercised checks in page-map-general-section-arms.test.ts by
 * pinning the arms that only fire under future nav shapes.
 *
 * Invariants locked (see kubestellar/docs#6663 and #7080 for context):
 *
 *   1. buildPageMap merges general-section files (every GENERAL_SECTIONS
 *      prefix) from the main kubestellar docs dir into every non-kubestellar
 *      project's allDocFiles — plus the ROOT_SHARED_PAGES.
 *
 *   2. Bare-string item arm routes under /docs/... when the string path is a
 *      general-section file; otherwise under projectBasePath.
 *
 *   3. Object-with-string-value arm routes external links (starts with 'http')
 *      and absolute internal paths (starts with '/') directly, without
 *      re-anchoring them under any project base, and without adding them to
 *      processedFiles (they're not local doc files).
 *
 *   4. Object-with-string-value arm applies the SAME general-section test to
 *      string values before deciding route base.
 *
 *   5. Folder-of-children arm inspects nested object values to detect a
 *      general-section leaf — required because navs frequently wrap
 *      contributing/community/news pages inside titled subfolders.
 *
 *   6. There is exactly ONE definition of "general section" — the
 *      GENERAL_SECTIONS list in src/lib/nav.ts — and page-map.ts contains no
 *      hard-coded 'contributing/' | 'community/' | 'news/' prefix checks of
 *      its own (the pre-#7080 shape that had to be edited in four places).
 */

const SRC = readFileSync(
  join(process.cwd(), 'src/app/docs/page-map.ts'),
  'utf8',
)

describe('buildPageMap: general-section file merge (drift-guard)', () => {
  it('merges general-section files plus root shared pages when projectId !== kubestellar', () => {
    expect(SRC).toMatch(/isGeneralSectionFile\(f\) \|\| \(ROOT_SHARED_PAGES as readonly string\[\]\)\.includes\(f\)/)
    // Root-level shared pages that render on every project.
    expect(SRC).toMatch(/const ROOT_SHARED_PAGES = \['intro\.md', 'legacy-components\.md', 'what-is-console\.md'\] as const/)
    // The gate — only apply the extra merge for non-kubestellar projects.
    expect(SRC).toContain("if (projectId !== 'kubestellar')")
  })
})

describe('buildNavNodes: bare-string item arm (drift-guard)', () => {
  it('has the bare-string branch that routes general-section strings under /docs', () => {
    expect(SRC).toContain("if (typeof item === 'string')")
    expect(SRC).toMatch(/const basePathForRoute = isGeneralSectionFile\(item\) \? 'docs' : projectBasePath/)
  })

  it('adds the bare-string item to processedFiles and pushes an MdxPage node', () => {
    // Bare-string items are LOCAL doc files — they must be marked processed
    // so the "unreferenced files" pass doesn't re-emit them. This is the
    // key difference vs the external-link arm below (which does NOT mark
    // anything as processed).
    expect(SRC).toMatch(/processedFiles\.add\(item\)/)
  })
})

describe('buildNavNodes: external-link / absolute-path arm (drift-guard)', () => {
  it('detects external URLs and absolute internal paths', () => {
    expect(SRC).toMatch(
      /if \(value\.startsWith\('http'\) \|\| value\.startsWith\('\/'\)\)/,
    )
  })

  it('emits the value verbatim as the route (no project-base rewrite)', () => {
    // If someone "helpfully" wraps external links under projectBasePath,
    // every external footer link in the docs collapses to a 404 loop.
    expect(SRC).toMatch(/nodes\.push\(\{ kind: 'MdxPage', name: title, route: value \}\)/)
  })
})

describe('buildNavNodes: object-with-string-value general-section arm (drift-guard)', () => {
  it('applies the shared general-section test to string values before choosing route base', () => {
    expect(SRC).toMatch(/const basePathForRoute = isGeneralSectionFile\(value\) \? 'docs' : projectBasePath/)
  })
})

describe('buildNavNodes: folder-of-children nested-object detection (drift-guard)', () => {
  it('routes a folder under /docs when any direct child touches a general section', () => {
    // Peeling this back would put the whole 'CI/CD' folder under
    // /docs/<project>/ci-cd/ instead of /docs/ci-cd/, breaking every
    // shared-section cross link.
    expect(SRC).toMatch(/const basePathForRoute = value\.some\(navItemTouchesGeneralSection\) \? 'docs' : projectBasePath/)
  })

  it('routes a top-level category under /docs when its title is a general-section title', () => {
    expect(SRC).toMatch(/const generalSectionTitles = new Set\(navStructure\.filter\(c => c\.general\)\.map\(c => c\.title\)\)/)
    expect(SRC).toMatch(/const basePath = generalSectionTitles\.has\(category\.title\) \? 'docs' : projectBasePath/)
  })
})

describe('general-section prefix set has exactly ONE definition (drift-guard)', () => {
  it('page-map.ts has no hard-coded general-section prefix literals', () => {
    // The pre-#7080 file repeated `startsWith('contributing/') || ...` in
    // four places (plus a title list). All of them now route through
    // GENERAL_SECTIONS / isGeneralSectionFile in src/lib/nav.ts.
    expect(SRC).not.toMatch(/startsWith\('(contributing|community|news)\/'\)/)
    expect(SRC).not.toMatch(/\['Contributing', 'Community', 'News'\]/)
  })

  it('page-map.ts contains no per-project NAV_STRUCTURE_* literals', () => {
    expect(SRC).not.toMatch(/NAV_STRUCTURE_/)
  })

  it('each of the three general-section route decisions calls the shared helper exactly once', () => {
    expect(SRC.match(/isGeneralSectionFile\(item\)/g) ?? []).toHaveLength(1)
    expect(SRC.match(/isGeneralSectionFile\(value\)/g) ?? []).toHaveLength(1)
    expect(SRC.match(/value\.some\(navItemTouchesGeneralSection\)/g) ?? []).toHaveLength(1)
  })
})
