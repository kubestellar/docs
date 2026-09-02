import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Source-parsing drift-guard for the DEFENSIVE arms inside `buildNavNodes`
 * (src/app/docs/page-map.ts). These arms cannot currently be exercised at
 * runtime because none of the NAV_STRUCTURE_* constants use a bare string
 * item or an external/absolute-URL value; but each arm exists to keep the
 * general-section routing invariant intact when future navs are added.
 *
 * If a future refactor silently deletes or narrows any of these arms, this
 * file catches it before the drift reaches production. It complements the
 * runtime-exercised checks in page-map-general-section-arms.test.ts by
 * pinning the arms that only fire under future nav shapes.
 *
 * Invariants locked (see kubestellar/docs#6663 for context):
 *
 *   1. buildPageMap merges general-section files (contributing/, community/,
 *      news/) from the main kubestellar docs dir into every non-kubestellar
 *      project's allDocFiles — plus the three root-level shared pages.
 *
 *   2. Bare-string item arm (arm 3 in page-map-general-section-arms.test.ts)
 *      routes under /docs/... when the string path starts with any of the
 *      three general-section prefixes; otherwise under projectBasePath.
 *
 *   3. Object-with-string-value arm routes external links (starts with 'http')
 *      and absolute internal paths (starts with '/') directly, without
 *      re-anchoring them under any project base, and without adding them to
 *      processedFiles (they're not local doc files).
 *
 *   4. Object-with-string-value arm applies the SAME three general-section
 *      prefixes to string values before deciding route base.
 *
 *   5. Folder-of-children arm inspects nested object values to detect a
 *      general-section leaf (Object.values(...).some(...)) — required
 *      because navs frequently wrap contributing/community/news pages
 *      inside titled subfolders.
 */

const SRC = readFileSync(
  join(process.cwd(), 'src/app/docs/page-map.ts'),
  'utf8',
)

describe('buildPageMap: general-section file merge (drift-guard)', () => {
  it('merges the three general-section prefixes plus root shared pages when projectId !== kubestellar', () => {
    // Line ~547: the filter that pulls general-section files into non-kubestellar projects.
    expect(SRC).toContain("f.startsWith('contributing/')")
    expect(SRC).toContain("f.startsWith('community/')")
    expect(SRC).toContain("f.startsWith('news/')")
    // Root-level shared pages that render on every project.
    expect(SRC).toContain("f === 'intro.md'")
    expect(SRC).toContain("f === 'legacy-components.md'")
    expect(SRC).toContain("f === 'what-is-console.md'")
    // The gate — only apply the extra merge for non-kubestellar projects.
    expect(SRC).toContain("if (projectId !== 'kubestellar')")
  })
})

describe('buildNavNodes: bare-string item arm (drift-guard)', () => {
  it('has the bare-string branch that routes general-section strings under /docs', () => {
    // Arm gate at ~L561.
    expect(SRC).toContain("if (typeof item === 'string')")
    // General-section detection at ~L567 uses exactly the three prefixes.
    expect(SRC).toMatch(
      /const isGeneralSection = item\.startsWith\('contributing\/'\) \|\| item\.startsWith\('community\/'\) \|\| item\.startsWith\('news\/'\)/,
    )
    // basePathForRoute ternary at ~L568 selects 'docs' vs projectBasePath.
    expect(SRC).toMatch(/const basePathForRoute = isGeneralSection \? 'docs' : projectBasePath/)
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
    // Arm gate at ~L581.
    expect(SRC).toMatch(
      /if \(value\.startsWith\('http'\) \|\| value\.startsWith\('\/'\)\)/,
    )
  })

  it('emits the value verbatim as the route (no project-base rewrite)', () => {
    // Lines 583-584: push MdxPage with route: value, without going through
    // any /${basePathForRoute}/... template. If someone "helpfully" wraps
    // external links under projectBasePath, every external footer link in
    // the docs collapses to a 404 loop.
    expect(SRC).toMatch(/nodes\.push\(\{ kind: 'MdxPage', name: title, route: value \}\)/)
  })
})

describe('buildNavNodes: object-with-string-value general-section arm (drift-guard)', () => {
  it('applies the same three prefixes to string values before choosing route base', () => {
    // Line ~590.
    expect(SRC).toMatch(
      /const isGeneralSection = value\.startsWith\('contributing\/'\) \|\| value\.startsWith\('community\/'\) \|\| value\.startsWith\('news\/'\)/,
    )
  })
})

describe('buildNavNodes: folder-of-children nested-object detection (drift-guard)', () => {
  it('detects a general-section leaf inside a titled subfolder via Object.values(...).some(...)', () => {
    // Line ~607-616: when a folder's children are objects (title -> path),
    // the folder itself must be routed under /docs if any child value
    // points into contributing/community/news. Peeling this back would
    // put the whole 'CI/CD' folder under /docs/<project>/ci-cd/ instead
    // of /docs/ci-cd/, breaking every shared-section cross link.
    expect(SRC).toContain('const objValues = Object.values(v);')
    expect(SRC).toMatch(/objValues\.some\(val =>/)
    // The nested predicate MUST cover the same three prefixes.
    expect(SRC).toMatch(
      /val\.startsWith\('contributing\/'\) \|\| val\.startsWith\('community\/'\) \|\| val\.startsWith\('news\/'\)/,
    )
  })

  it('also handles the direct-string case inside the folder-children detector', () => {
    // Same block, string-typed branch: v itself is a string path.
    expect(SRC).toMatch(
      /v\.startsWith\('contributing\/'\) \|\| v\.startsWith\('community\/'\) \|\| v\.startsWith\('news\/'\)/,
    )
  })
})

describe('buildNavNodes: general-section prefix set is EXACTLY three (drift-guard)', () => {
  it('exactly three arms use the tri-prefix general-section check', () => {
    // Whole-file count: bare-string arm, object-string-value arm, and
    // folder-children direct-string sub-arm. If a fourth or fifth copy
    // appears with a divergent prefix set, or one disappears entirely,
    // this catches the drift.
    const bareStringArm = SRC.match(
      /item\.startsWith\('contributing\/'\) \|\| item\.startsWith\('community\/'\) \|\| item\.startsWith\('news\/'\)/g,
    ) ?? []
    const valueArm = SRC.match(
      /value\.startsWith\('contributing\/'\) \|\| value\.startsWith\('community\/'\) \|\| value\.startsWith\('news\/'\)/g,
    ) ?? []
    const nestedStringArm = SRC.match(
      /v\.startsWith\('contributing\/'\) \|\| v\.startsWith\('community\/'\) \|\| v\.startsWith\('news\/'\)/g,
    ) ?? []
    const nestedValArm = SRC.match(
      /val\.startsWith\('contributing\/'\) \|\| val\.startsWith\('community\/'\) \|\| val\.startsWith\('news\/'\)/g,
    ) ?? []
    // Plus the getAllDocFiles filter uses `f.startsWith(...)` (see first block).
    expect(bareStringArm).toHaveLength(1)
    expect(valueArm).toHaveLength(1)
    expect(nestedStringArm).toHaveLength(1)
    expect(nestedValArm).toHaveLength(1)
  })
})
