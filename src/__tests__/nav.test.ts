import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  GENERAL_SECTIONS,
  NAV_FILE_NAME,
  NavFileError,
  isGeneralSectionFile,
  loadNavFile,
  navItemTouchesGeneralSection,
  parseNavYaml,
  validateNavSections,
} from '../lib/nav'
import { PROJECTS } from '../config/versions'

/**
 * Coverage for src/lib/nav.ts — the nav.yaml schema, validator and loader
 * that replaced the ten hand-maintained NAV_STRUCTURE_* literals in
 * src/app/docs/page-map.ts (kubestellar/docs#7080).
 *
 * The validator is what turns "a docs author typo'd nav.yaml" into a build
 * error with a file + location instead of an `undefined` spread deep inside
 * buildNavNodes, so every rejection path is pinned here.
 */

describe('GENERAL_SECTIONS / isGeneralSectionFile', () => {
  it('lists exactly the three cross-project sections, in sidebar order', () => {
    expect(GENERAL_SECTIONS).toEqual(['contributing', 'community', 'news'])
  })

  it('matches files under a general-section directory', () => {
    expect(isGeneralSectionFile('contributing/contribute.md')).toBe(true)
    expect(isGeneralSectionFile('community/index.md')).toBe(true)
    expect(isGeneralSectionFile('news/reviews.md')).toBe(true)
    expect(isGeneralSectionFile('contributing/documentation/nested.md')).toBe(true)
  })

  it('does not match project files or look-alike names', () => {
    expect(isGeneralSectionFile('kubestellar/testing.md')).toBe(false)
    expect(isGeneralSectionFile('intro.md')).toBe(false)
    // Prefix must be a whole directory segment.
    expect(isGeneralSectionFile('community-extras/x.md')).toBe(false)
    expect(isGeneralSectionFile('newsletter.md')).toBe(false)
  })
})

describe('navItemTouchesGeneralSection', () => {
  it('handles bare-string items', () => {
    expect(navItemTouchesGeneralSection('news/index.md')).toBe(true)
    expect(navItemTouchesGeneralSection('readme.md')).toBe(false)
  })

  it('handles { title: path } items', () => {
    expect(navItemTouchesGeneralSection({ Policy: 'contributing/security/security-inc.md' })).toBe(true)
    expect(navItemTouchesGeneralSection({ Testing: 'kubestellar/testing.md' })).toBe(false)
  })

  it('only inspects direct string values, not nested folders', () => {
    // Mirrors the pre-#7080 Object.values(v).some(typeof val === 'string' …)
    // predicate: a folder whose children are themselves folders is judged
    // by its own (folder) children, not recursively.
    expect(navItemTouchesGeneralSection({ Folder: [{ Leaf: 'contributing/x.md' }] })).toBe(false)
  })
})

describe('validateNavSections', () => {
  const FILE = 'docs/content/x/nav.yaml'

  it('accepts the canonical shape and returns it normalised', () => {
    const out = validateNavSections(FILE, [
      { title: 'Overview', items: [{ Introduction: 'intro.md' }, 'bare.md'] },
      { title: 'Guides', items: [{ Folder: [{ Child: 'a/child.md' }, { Deeper: [{ Leaf: 'a/b/leaf.md' }] }] }] },
      { title: 'Links', items: [{ Site: 'https://example.com' }, { Abs: '/docs/elsewhere' }] },
    ])
    expect(out).toEqual([
      { title: 'Overview', items: [{ Introduction: 'intro.md' }, 'bare.md'] },
      { title: 'Guides', items: [{ Folder: [{ Child: 'a/child.md' }, { Deeper: [{ Leaf: 'a/b/leaf.md' }] }] }] },
      { title: 'Links', items: [{ Site: 'https://example.com' }, { Abs: '/docs/elsewhere' }] },
    ])
  })

  it('accepts an empty section list and an empty items list', () => {
    expect(validateNavSections(FILE, [])).toEqual([])
    expect(validateNavSections(FILE, [{ title: 'Empty', items: [] }])).toEqual([{ title: 'Empty', items: [] }])
  })

  it.each([
    [null, /top level must be a list/],
    [undefined, /top level must be a list/],
    [{ title: 'X', items: [] }, /top level must be a list/],
    ['- oops', /top level must be a list/],
  ])('rejects a non-list top level (%j)', (input, message) => {
    expect(() => validateNavSections(FILE, input)).toThrow(NavFileError)
    expect(() => validateNavSections(FILE, input)).toThrow(message)
  })

  it.each([
    ['a string section', ['Overview'], /section\[0\]: expected \{ title, items \}/],
    ['a list section', [[]], /section\[0\]: expected \{ title, items \}/],
    ['a null section', [null], /section\[0\]: expected \{ title, items \}/],
    ['a missing title', [{ items: [] }], /section\[0\]: "title" must be a non-empty string/],
    ['an empty title', [{ title: '', items: [] }], /section\[0\]: "title" must be a non-empty string/],
    ['a non-string title', [{ title: 3, items: [] }], /section\[0\]: "title" must be a non-empty string/],
    ['missing items', [{ title: 'T' }], /section\[0\] "T": "items" must be a list/],
    ['a scalar items', [{ title: 'T', items: 'intro.md' }], /section\[0\] "T": "items" must be a list/],
    ['a mapping items', [{ title: 'T', items: { Intro: 'intro.md' } }], /section\[0\] "T": "items" must be a list/],
  ])('rejects %s', (_label, input, message) => {
    expect(() => validateNavSections(FILE, input)).toThrow(NavFileError)
    expect(() => validateNavSections(FILE, input)).toThrow(message)
  })

  it.each([
    ['an empty bare-string path', [''], /items\[0\]: empty path/],
    ['a number item', [42], /items\[0\]: expected "Title: path" or "Title: \[children\]"/],
    ['a null item', [null], /items\[0\]: expected "Title: path"/],
    ['a list item', [['x.md']], /items\[0\]: expected "Title: path"/],
    ['an item with zero keys', [{}], /items\[0\]: each item must have exactly one "Title" key, got 0/],
    ['an item with two keys', [{ A: 'a.md', B: 'b.md' }], /items\[0\]: each item must have exactly one "Title" key, got 2 \(A, B\)/],
    ['an empty path value', [{ A: '' }], /items\[0\] "A": empty path/],
    ['a null path value (YAML `Title:` with nothing after)', [{ A: null }], /items\[0\] "A": value must be a path string or a list of items, got null/],
    ['a number value', [{ A: 7 }], /items\[0\] "A": value must be a path string or a list of items, got 7/],
    ['a mapping value', [{ A: { B: 'b.md' } }], /items\[0\] "A": value must be a path string or a list of items/],
  ])('rejects %s inside items', (_label, items, message) => {
    const input = [{ title: 'Sec', items }]
    expect(() => validateNavSections(FILE, input)).toThrow(NavFileError)
    expect(() => validateNavSections(FILE, input)).toThrow(message)
  })

  it('reports the nested location of a bad folder child', () => {
    const input = [{ title: 'Sec', items: [{ Folder: [{ Ok: 'ok.md' }, { Bad: 5 }] }] }]
    expect(() => validateNavSections(FILE, input)).toThrow(
      /section\[0\] "Sec"\.items\[0\] "Folder"\[1\] "Bad": value must be a path string/,
    )
  })

  it('prefixes every error with the file being validated', () => {
    expect(() => validateNavSections(FILE, 'nope')).toThrow(`Invalid sidebar nav file ${FILE}:`)
  })
})

describe('parseNavYaml', () => {
  it('parses valid YAML into sections', () => {
    const yaml = [
      '# comment',
      '- title: Overview',
      '  items:',
      '    - Introduction: intro.md',
      '    - Guides:',
      '        - Quick Start: guides/quick-start.md',
    ].join('\n')
    expect(parseNavYaml('f.yaml', yaml)).toEqual([
      { title: 'Overview', items: [{ Introduction: 'intro.md' }, { Guides: [{ 'Quick Start': 'guides/quick-start.md' }] }] },
    ])
  })

  it('wraps YAML syntax errors in NavFileError with the file name', () => {
    const bad = '- title: X\n  items: [\n'
    expect(() => parseNavYaml('f.yaml', bad)).toThrow(NavFileError)
    expect(() => parseNavYaml('f.yaml', bad)).toThrow(/Invalid sidebar nav file f\.yaml: YAML parse error:/)
  })

  it('rejects an empty document', () => {
    expect(() => parseNavYaml('f.yaml', '')).toThrow(NavFileError)
  })

  it('rejects a document whose top level is a mapping', () => {
    expect(() => parseNavYaml('f.yaml', 'title: X\nitems: []\n')).toThrow(/top level must be a list/)
  })
})

describe('loadNavFile', () => {
  const dirs: string[] = []
  const tmp = () => {
    const d = mkdtempSync(join(tmpdir(), 'nav-test-'))
    dirs.push(d)
    return d
  }
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  it('reads and validates a nav.yaml from disk', () => {
    const dir = tmp()
    const file = join(dir, NAV_FILE_NAME)
    writeFileSync(file, '- title: Overview\n  items:\n    - Intro: intro.md\n')
    expect(loadNavFile(file)).toEqual([{ title: 'Overview', items: [{ Intro: 'intro.md' }] }])
  })

  it('throws NavFileError naming the file when it does not exist', () => {
    const missing = join(tmp(), 'does-not-exist.yaml')
    expect(() => loadNavFile(missing)).toThrow(NavFileError)
    expect(() => loadNavFile(missing)).toThrow(/does-not-exist\.yaml: file not found/)
  })

  it('surfaces schema violations from a real file', () => {
    const dir = tmp()
    const file = join(dir, NAV_FILE_NAME)
    writeFileSync(file, '- title: Overview\n  items: intro.md\n')
    expect(() => loadNavFile(file)).toThrow(/"items" must be a list/)
  })

  it('loads every real project nav and general-section nav without error', () => {
    for (const project of Object.values(PROJECTS)) {
      const sections = loadNavFile(join(process.cwd(), project.navPath))
      expect(sections.length, project.id).toBeGreaterThan(0)
    }
    for (const section of GENERAL_SECTIONS) {
      const sections = loadNavFile(join(process.cwd(), 'docs', 'content', section, NAV_FILE_NAME))
      expect(sections).toHaveLength(1)
    }
  })

  it('every real nav entry (except external/absolute links) points at an existing page', () => {
    // The pre-#7080 failure mode (#5001, #5002, #5067) was pages missing
    // from the nav; the inverse — nav pointing at a page that does not
    // exist — is now cheap to catch here. Kubestellar-relative fallbacks
    // (contributing/, kubestellar/…) resolve against docs/content.
    const contentRoot = join(process.cwd(), 'docs', 'content')
    const missing: string[] = []
    const check = (base: string, items: ReturnType<typeof loadNavFile>[number]['items']) => {
      for (const item of items) {
        const pairs = typeof item === 'string' ? [[item, item] as const] : Object.entries(item)
        for (const [, value] of pairs) {
          if (Array.isArray(value)) {
            check(base, value)
          } else if (typeof value === 'string' && !value.startsWith('http') && !value.startsWith('/')) {
            if (!existsSync(join(base, value)) && !existsSync(join(contentRoot, value))) {
              missing.push(`${base}: ${value}`)
            }
          }
        }
      }
    }
    for (const project of Object.values(PROJECTS)) {
      const base = join(process.cwd(), project.contentPath)
      for (const section of loadNavFile(join(process.cwd(), project.navPath))) check(base, section.items)
    }
    for (const section of GENERAL_SECTIONS) {
      for (const s of loadNavFile(join(contentRoot, section, NAV_FILE_NAME))) check(contentRoot, s.items)
    }
    expect(missing).toEqual([])
  })
})
