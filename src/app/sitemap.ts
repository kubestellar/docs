import type { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { PROJECTS, type ProjectId } from '@/config/versions'

const SITE_URL = 'https://kubestellar.io'

/** Weekly update frequency for docs content */
const DOCS_CHANGE_FREQ = 'weekly' as const
/** Monthly update frequency for marketing pages */
const MARKETING_CHANGE_FREQ = 'monthly' as const

/** Priority for the homepage */
const HOMEPAGE_PRIORITY = 1.0
/** Priority for top-level marketing pages */
const MARKETING_PRIORITY = 0.8
/** Priority for docs landing / project root pages */
const DOCS_ROOT_PRIORITY = 0.9
/** Priority for individual docs pages */
const DOCS_PAGE_PRIORITY = 0.7

/**
 * Recursively find all .md and .mdx files in a directory.
 * Returns paths relative to the given base directory.
 */
function findMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip hidden directories, node_modules, common-subs (partials), and images
      if (
        !entry.name.startsWith('.') &&
        !entry.name.startsWith('_') &&
        entry.name !== 'node_modules' &&
        entry.name !== 'common-subs' &&
        entry.name !== 'images'
      ) {
        files.push(...findMarkdownFiles(fullPath, baseDir))
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
      !entry.name.startsWith('_')
    ) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      files.push(relativePath)
    }
  }

  return files
}

/**
 * Convert a markdown file path to its URL route for a given project.
 * Uses the same slug logic as page-map.ts navigation structures.
 */
function filePathToRoute(filePath: string, projectId: ProjectId): string {
  // Remove file extension
  let route = filePath.replace(/\.(md|mdx)$/i, '')

  // Remove trailing /index (index files map to the parent folder route)
  route = route.replace(/\/index$/, '')

  // For project sub-paths (a2a, kubeflex, etc.), strip the project prefix
  // since content is already scoped to the project directory
  const project = PROJECTS[projectId]
  const projectBase = project.basePath ? `/docs/${project.basePath}` : '/docs'

  return `${projectBase}/${route}`
}

/**
 * Get the last modified date for a file, falling back to current date.
 */
function getLastModified(filePath: string): Date {
  try {
    const stats = fs.statSync(filePath)
    return stats.mtime
  } catch {
    return new Date()
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []
  const contentRoot = path.join(process.cwd(), 'docs', 'content')

  // --- Homepage ---
  entries.push({
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: MARKETING_CHANGE_FREQ,
    priority: HOMEPAGE_PRIORITY,
  })

  // --- Marketing / locale pages ---
  const marketingPages = [
    '/en',
    '/en/products',
    '/en/partners',
    '/en/programs',
    '/en/leaderboard',
    '/en/marketplace',
    '/en/quick-installation',
    '/en/contribute-handbook',
    '/en/ladder',
    '/en/playground',
  ]

  for (const page of marketingPages) {
    entries.push({
      url: `${SITE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: MARKETING_CHANGE_FREQ,
      priority: MARKETING_PRIORITY,
    })
  }

  // --- Docs landing page ---
  entries.push({
    url: `${SITE_URL}/docs`,
    lastModified: new Date(),
    changeFrequency: DOCS_CHANGE_FREQ,
    priority: DOCS_ROOT_PRIORITY,
  })

  // --- KubeStellar docs (root content) ---
  const ksFiles = findMarkdownFiles(contentRoot)
    .filter((f) => {
      // Only include files directly in the root or under kubestellar/, ui-docs/,
      // contributing/, community/, news/ — NOT project sub-dirs
      const projectDirs = ['a2a', 'kubeflex', 'multi-plugin', 'kubestellar-mcp', 'console']
      const topDir = f.split('/')[0]
      return !projectDirs.includes(topDir)
    })

  for (const file of ksFiles) {
    const fullPath = path.join(contentRoot, file)
    const route = filePathToRoute(file, 'kubestellar')

    entries.push({
      url: `${SITE_URL}${route}`,
      lastModified: getLastModified(fullPath),
      changeFrequency: DOCS_CHANGE_FREQ,
      priority: DOCS_PAGE_PRIORITY,
    })
  }

  // --- Project-specific docs ---
  const projectIds: ProjectId[] = ['a2a', 'kubeflex', 'multi-plugin', 'kubestellar-mcp', 'console']

  for (const projectId of projectIds) {
    const projectContentPath = path.join(contentRoot, PROJECTS[projectId].basePath)

    // Add project root entry
    entries.push({
      url: `${SITE_URL}/docs/${PROJECTS[projectId].basePath}`,
      lastModified: new Date(),
      changeFrequency: DOCS_CHANGE_FREQ,
      priority: DOCS_ROOT_PRIORITY,
    })

    const projectFiles = findMarkdownFiles(projectContentPath)

    for (const file of projectFiles) {
      const fullPath = path.join(projectContentPath, file)
      const route = filePathToRoute(file, projectId)

      entries.push({
        url: `${SITE_URL}${route}`,
        lastModified: getLastModified(fullPath),
        changeFrequency: DOCS_CHANGE_FREQ,
        priority: DOCS_PAGE_PRIORITY,
      })
    }
  }

  return entries
}
