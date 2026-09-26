import { normalizePageMap } from 'nextra/page-map'
import fs from 'fs'
import path from 'path'
import { PROJECTS, type ProjectId } from '@/config/versions'
import {
  GENERAL_SECTIONS,
  NAV_FILE_NAME,
  isGeneralSectionFile,
  loadNavFile,
  navItemTouchesGeneralSection,
  type NavItem,
  type NavSection,
} from '@/lib/nav'

// Local docs path - docs are now in this repository
export const docsContentPath = path.join(process.cwd(), 'docs', 'content')
export const basePath = 'docs'

// Get content path for a project.
//
// Data-driven from PROJECTS[projectId].contentPath (see
// src/config/versions/lookup.ts) so a new value added to the ProjectId union
// fails to compile until the maintainer supplies a contentPath, instead of
// silently falling through to the KubeStellar path via a `default:` arm.
// See kubestellar/docs#7037.
export function getContentPath(projectId: ProjectId): string {
  return path.join(process.cwd(), PROJECTS[projectId].contentPath)
}

// Get base path for a project.
//
// Data-driven from PROJECTS[projectId].basePath (see
// src/config/versions/lookup.ts). Only the KubeStellar project has an empty
// basePath ("" → "docs"); every other project's basePath is joined under
// "docs/". Same rationale as getContentPath — no silent default arm.
// See kubestellar/docs#7037.
export function getBasePath(projectId: ProjectId): string {
  const projectBasePath = PROJECTS[projectId].basePath
  return projectBasePath ? `docs/${projectBasePath}` : 'docs'
}

// Strong types for page-map nodes
type MdxPageNode = { kind: 'MdxPage'; name: string; route: string }
type FolderNode = { kind: 'Folder'; name: string; route: string; children: PageMapNode[]; theme?: { collapsed?: boolean } }
type MetaNode = { kind: 'Meta'; data: Record<string, string> }
type PageMapNode = MdxPageNode | FolderNode | MetaNode

// Helper to prettify names
const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')

// Recursively get all markdown files from the local docs directory
function getAllDocFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    if (entry.isDirectory()) {
      // Skip hidden directories and node_modules
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...getAllDocFiles(fullPath, baseDir))
      }
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      // Normalize to forward slashes for cross-platform consistency
      files.push(relativePath.replace(/\\/g, '/'))
    }
  }

  return files
}

// Sidebar navigation is data: see src/lib/nav.ts for the nav.yaml schema and
// loader. Re-exported so existing importers of page-map keep working.
export { GENERAL_SECTIONS, NAV_FILE_NAME, isGeneralSectionFile, loadNavFile } from '@/lib/nav'
export type { NavItem, NavSection } from '@/lib/nav'

// Root-level pages of docs/content/ that every project can resolve.
const ROOT_SHARED_PAGES = ['intro.md', 'legacy-components.md', 'what-is-console.md'] as const

type ResolvedNavSection = NavSection & { general: boolean }

// Get navigation structure for a project: its own nav.yaml (from
// PROJECTS[projectId].navPath) followed by every GENERAL_SECTIONS nav.
export function getNavStructure(projectId: ProjectId): ResolvedNavSection[] {
  const projectSections = loadNavFile(path.join(process.cwd(), PROJECTS[projectId].navPath))
    .map(section => ({ ...section, general: false }))
  const generalSections = GENERAL_SECTIONS.flatMap(section =>
    loadNavFile(path.join(docsContentPath, section, NAV_FILE_NAME)).map(s => ({ ...s, general: true }))
  )
  return [...projectSections, ...generalSections]
}

export function buildPageMap(projectId: ProjectId = 'kubestellar') {
  const contentPath = getContentPath(projectId)
  const projectBasePath = getBasePath(projectId)
  const navStructure = getNavStructure(projectId)

  // For all projects, include files from both project-specific and main KubeStellar directories
  let allDocFiles = getAllDocFiles(contentPath)
  if (projectId !== 'kubestellar') {
    // Add general sections files and root-level pages from main KubeStellar directory
    const generalFiles = getAllDocFiles(docsContentPath).filter(f =>
      isGeneralSectionFile(f) || (ROOT_SHARED_PAGES as readonly string[]).includes(f)
    )
    allDocFiles = [...allDocFiles, ...generalFiles]
  }
  const processedFiles = new Set<string>()
  const routeMap: Record<string, string> = {}
  const _pageMap: PageMapNode[] = []

  function buildNavNodes(items: NavItem[], parentSlug: string): PageMapNode[] {
    const nodes: PageMapNode[] = []
    const meta: Record<string, string> = {}

    for (const item of items) {
      if (typeof item === 'string') {
        // Simple file reference
        if (allDocFiles.includes(item)) {
          processedFiles.add(item)
          const baseName = item.replace(/\.(md|mdx)$/i, '').split('/').pop()!
          // Use /docs path for general sections, project path for everything else
          const basePathForRoute = isGeneralSectionFile(item) ? 'docs' : projectBasePath
          const route = `/${basePathForRoute}/${parentSlug}/${baseName}`
          routeMap[`${parentSlug}/${baseName}`] = item
          nodes.push({ kind: 'MdxPage', name: pretty(baseName), route })
          meta[pretty(baseName)] = pretty(baseName)
        }
      } else {
        // Object with title: path or title: children
        const title = Object.keys(item)[0]
        const value = (item as Record<string, string | NavItem[]>)[title]

        if (typeof value === 'string') {
          // It's a file path or link
          if (value.startsWith('http') || value.startsWith('/')) {
            // External link or absolute internal link
            nodes.push({ kind: 'MdxPage', name: title, route: value })
            meta[title] = title
          } else if (allDocFiles.includes(value)) {
            processedFiles.add(value)
            // const baseName = value.replace(/\.(md|mdx)$/i, '').split('/').pop()!
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            // Use /docs path for general sections, project path for everything else
            const basePathForRoute = isGeneralSectionFile(value) ? 'docs' : projectBasePath
            const route = `/${basePathForRoute}/${parentSlug ? parentSlug + '/' : ''}${slug}`
            routeMap[`${parentSlug ? parentSlug + '/' : ''}${slug}`] = value
            nodes.push({ kind: 'MdxPage', name: title, route })
            meta[title] = title
          }
        } else if (Array.isArray(value)) {
          // It's a folder with children
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const newParentSlug = parentSlug ? `${parentSlug}/${slug}` : slug
          const children = buildNavNodes(value, newParentSlug)
          if (children.length > 0) {
            // Use /docs path for general sections, project path for everything else.
            // A folder is general when any direct child points into a general section.
            const basePathForRoute = value.some(navItemTouchesGeneralSection) ? 'docs' : projectBasePath
            nodes.push({
              kind: 'Folder',
              name: title,
              route: `/${basePathForRoute}/${newParentSlug}`,
              children
            })
            meta[title] = title
          }
        }
      }
    }

    if (Object.keys(meta).length > 0) {
      nodes.unshift({ kind: 'Meta', data: meta })
    }

    return nodes
  }

  // Top-level section titles that anchor under /docs/<slug> instead of the
  // project base. Derived from the general-section navs (Contributing,
  // Community, News) rather than hard-coded. Matching by TITLE — not by which
  // nav a section came from — is deliberate: a project section that reuses a
  // shared title (kubeflex's own "Community") is anchored under /docs/ too,
  // which page-map-routes.test.ts pins as the sidebar's existing behaviour.
  const generalSectionTitles = new Set(navStructure.filter(c => c.general).map(c => c.title))

  // Build navigation from navStructure (project-specific)
  for (const category of navStructure) {
    const categorySlug = category.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const children = buildNavNodes(category.items, categorySlug)

    if (children.length > 0) {
      // Use /docs path for general sections, project path for project-specific sections
      const basePath = generalSectionTitles.has(category.title) ? 'docs' : projectBasePath

      const folderNode: FolderNode = {
        kind: 'Folder',
        name: category.title,
        route: `/${basePath}/${categorySlug}`,
        children
      }

      // Set theme for first category to be expanded
      if (category.title === 'Welcome' || category.title === 'Overview') {
        folderNode.theme = { collapsed: false }
      }

      _pageMap.push(folderNode)
    }
  }

  // Add top-level introduction page (accessible at /docs/introduction)
  // Route map entry only - sidebar renders this separately above projects
  if (projectId === 'kubestellar' && allDocFiles.includes('intro.md')) {
    routeMap['introduction'] = 'intro.md'
  }

  // Add legacy components overview page (accessible at /docs/legacy-components)
  if (allDocFiles.includes('legacy-components.md')) {
    routeMap['legacy-components'] = 'legacy-components.md'
  }

  // Add "What is Console" disambiguation page (accessible at /docs/what-is-console)
  // This is a standalone page that clarifies KubeStellar Console is a separate
  // project from the original kubestellar/kubestellar repository. See issue #1472.
  if (allDocFiles.includes('what-is-console.md')) {
    routeMap['what-is-console'] = 'what-is-console.md'
  }

  // Add top-level meta - only include our defined navigation structure
  const meta: Record<string, string> = {}
  for (const category of navStructure) {
    meta[category.title] = category.title
  }
  _pageMap.unshift({ kind: 'Meta', data: meta })

  // Populate routeMap with all files for fallback resolution (needed for link rewriting)
  for (const fp of allDocFiles) {
    const noExt = fp.replace(/\.(md|mdx)$/i, '')
    if (!routeMap[noExt]) {
      routeMap[noExt] = fp
    }
  }

  const pageMap = normalizePageMap(_pageMap)

  return { pageMap, routeMap, filePaths: allDocFiles, contentPath }
}

// For backwards compatibility, export a function that doesn't need branch parameter
export async function buildPageMapForBranch() {
  return buildPageMap()
}
