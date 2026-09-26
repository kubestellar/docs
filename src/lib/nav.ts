import fs from 'fs'
import path from 'path'
import { load as parseYaml } from 'js-yaml'

// ---------------------------------------------------------------------------
// Sidebar navigation data files
//
// Navigation is DATA, not code. Each project's sidebar lives in a nav.yaml next
// to the content it describes (PROJECTS[projectId].navPath, e.g.
// docs/content/console/nav.yaml), and the cross-project sections live in
// docs/content/<section>/nav.yaml (see GENERAL_SECTIONS). The schema mirrors an
// mkdocs.yml `nav:` block:
//
//   - title: Section
//     items:
//       - Page Title: relative/path.md
//       - Folder Title:
//           - Child Title: relative/path.md
//
// Files are loaded and validated by loadNavFile() when the page map is built,
// so a missing or malformed nav is a build error rather than an `undefined`
// spread at runtime. This module is deliberately free of Next.js / nextra
// imports so scripts/check-internal-links.ts can reuse it under plain tsx.
// See kubestellar/docs#7080.
// ---------------------------------------------------------------------------

export type NavItem = { [key: string]: string | NavItem[] | NavItem } | string
export type NavSection = { title: string; items: NavItem[] }

// Cross-project sections appended (in this order) to every project's nav.
// Each is a directory under docs/content/ whose pages route under /docs/<dir>/
// regardless of the project being rendered, and whose sidebar section is
// defined in docs/content/<dir>/nav.yaml.
export const GENERAL_SECTIONS = ['contributing', 'community', 'news'] as const

export const NAV_FILE_NAME = 'nav.yaml'

// True when a content-relative file path belongs to one of GENERAL_SECTIONS
// (and therefore routes under /docs/… instead of /docs/<project>/…).
export function isGeneralSectionFile(file: string): boolean {
  return GENERAL_SECTIONS.some(section => file.startsWith(`${section}/`))
}

// True when a nav item (string path, or {title: path|children} object) points
// at — or contains a direct child pointing at — a general-section file.
export function navItemTouchesGeneralSection(item: NavItem): boolean {
  if (typeof item === 'string') return isGeneralSectionFile(item)
  return Object.values(item).some(v => typeof v === 'string' && isGeneralSectionFile(v))
}

export class NavFileError extends Error {
  constructor(file: string, message: string) {
    super(`Invalid sidebar nav file ${file}: ${message}`)
    this.name = 'NavFileError'
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateNavItem(file: string, item: unknown, where: string): NavItem {
  if (typeof item === 'string') {
    if (item.length === 0) throw new NavFileError(file, `${where}: empty path`)
    return item
  }
  if (!isPlainObject(item)) {
    throw new NavFileError(file, `${where}: expected "Title: path" or "Title: [children]", got ${JSON.stringify(item)}`)
  }
  const keys = Object.keys(item)
  if (keys.length !== 1) {
    throw new NavFileError(file, `${where}: each item must have exactly one "Title" key, got ${keys.length} (${keys.join(', ')})`)
  }
  const title = keys[0]
  const value = item[title]
  if (typeof value === 'string') {
    if (value.length === 0) throw new NavFileError(file, `${where} "${title}": empty path`)
    return { [title]: value }
  }
  if (Array.isArray(value)) {
    return { [title]: value.map((child, i) => validateNavItem(file, child, `${where} "${title}"[${i}]`)) }
  }
  throw new NavFileError(file, `${where} "${title}": value must be a path string or a list of items, got ${JSON.stringify(value)}`)
}

// Validate already-parsed YAML/JSON against the nav schema. `file` is only
// used to label errors.
export function validateNavSections(file: string, parsed: unknown): NavSection[] {
  if (!Array.isArray(parsed)) {
    throw new NavFileError(file, 'top level must be a list of { title, items } sections')
  }
  return parsed.map((section, i) => {
    const where = `section[${i}]`
    if (!isPlainObject(section)) throw new NavFileError(file, `${where}: expected { title, items }`)
    const { title, items } = section
    if (typeof title !== 'string' || title.length === 0) throw new NavFileError(file, `${where}: "title" must be a non-empty string`)
    if (!Array.isArray(items)) throw new NavFileError(file, `${where} "${title}": "items" must be a list`)
    return { title, items: items.map((item, j) => validateNavItem(file, item, `${where} "${title}".items[${j}]`)) }
  })
}

// Parse and validate nav YAML source text. `file` is only used to label errors.
export function parseNavYaml(file: string, source: string): NavSection[] {
  let parsed: unknown
  try {
    parsed = parseYaml(source)
  } catch (err) {
    throw new NavFileError(file, `YAML parse error: ${err instanceof Error ? err.message : String(err)}`)
  }
  return validateNavSections(file, parsed)
}

// Read and validate a nav.yaml from disk. Throws NavFileError (naming the
// offending file and location) on a missing file, YAML syntax error, or
// schema violation.
export function loadNavFile(absPath: string): NavSection[] {
  const rel = path.relative(process.cwd(), absPath).replace(/\\/g, '/')
  if (!fs.existsSync(absPath)) {
    throw new NavFileError(rel, 'file not found')
  }
  return parseNavYaml(rel, fs.readFileSync(absPath, 'utf8'))
}
