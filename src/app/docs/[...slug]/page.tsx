import { compileMdx } from 'nextra/compile'
import { Callout, Mermaid, Tabs } from 'nextra/components'
import { evaluate } from 'nextra/evaluate'
import { useMDXComponents as getMDXComponents } from '../../../../mdx-components'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'
import { sanitizeHtmlForMdx, removeCommentPatterns } from '@/lib/sanitizeHtml'
import { buildPageMap, docsContentPath, getContentPath } from '../page-map'
import { CURRENT_VERSION, type ProjectId } from '@/config/versions'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'

const HIVE_DOCS_PATH = process.env.HIVE_DOCS_PATH

type Props = {
  params: Promise<{ slug: string[] }>
}

// Replace template variables with actual values
function replaceTemplateVariables(content: string): string {
  // Use CURRENT_VERSION from config to support versioned documentation
  // When a version branch is created, CURRENT_VERSION is updated to that version
  const version = CURRENT_VERSION as string
  const versionBranch = version === '0.29.0' ? 'main' : `release-${version}`
  const versionTag = version === '0.29.0' ? 'latest' : `v${version}`

  const vars: Record<string, string> = {
    'config.ks_branch': versionBranch,
    'config.ks_tag': versionTag,
    'config.ks_latest_release': CURRENT_VERSION,
    'config.ks_latest_regular_release': CURRENT_VERSION,
    'config.docs_url': 'https://docs.kubestellar.io',
    'config.repo_url': 'https://github.com/kubestellar/kubestellar',
    'config.site_url': 'https://docs.kubestellar.io'
  }
  
  let result = content
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key.replace('.', '\\.')}\\s*\\}\\}`, 'g'), value)
  }
  
  // Remove any remaining template variables
  result = result.replace(/\{\{[^}]+\}\}/g, '')
  
  return result
}

function readLocalFile(filePath: string, contentPath: string = docsContentPath): string | null {
  // Reject path traversal attempts (mirrors protection in docs-image/route.ts)
  if (filePath.includes('..')) return null

  // Try the project-specific content path first
  const fullPath = path.join(contentPath, filePath)
  if (!fullPath.startsWith(contentPath + path.sep) && fullPath !== contentPath) return null
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8')
    }
  } catch {
    // File doesn't exist in content directory
  }

  // If not found in project directory, try main KubeStellar content path
  // This is needed for general sections (Contributing, Community, News) on non-KubeStellar projects
  if (contentPath !== docsContentPath) {
    const kubestellarPath = path.join(docsContentPath, filePath)
    if (kubestellarPath.startsWith(docsContentPath + path.sep)) {
      try {
        if (fs.existsSync(kubestellarPath)) {
          return fs.readFileSync(kubestellarPath, 'utf-8')
        }
      } catch {
        // File doesn't exist in KubeStellar directory either
      }
    }
  }

  // If not found in content directories, try repository root
  const cwd = process.cwd()
  const repoRootPath = path.join(cwd, filePath)
  if (repoRootPath.startsWith(cwd + path.sep)) {
    try {
      if (fs.existsSync(repoRootPath)) {
        return fs.readFileSync(repoRootPath, 'utf-8')
      }
    } catch {
      // File doesn't exist in repository root
    }
  }

  return null
}

type PageContent = {
  content: string
  // Path of the resolved source file, relative to the content directory.
  // Used by the DocsLayout wrapper to build "edit this page" links.
  filePath: string
}

async function getPageContent(slug: string[], projectId?: ProjectId): Promise<PageContent | null> {
  const mdPath = slug.join('/') + '.md'

  const contentPath = projectId
    ? getContentPath(projectId)
    : docsContentPath

  // Try .md first, then .mdx
  let content = readLocalFile(mdPath, contentPath)
  if (content) return { content, filePath: mdPath }

  const mdxPath = slug.join('/') + '.mdx'
  content = readLocalFile(mdxPath, contentPath)
  if (content) return { content, filePath: mdxPath }

  // If direct lookup failed, consult the routeMap for nav-generated routes
  const mapProjectId = projectId || 'kubestellar'
  const { routeMap } = buildPageMap(mapProjectId)
  const routeKey = slug.join('/')
  const mappedFile = routeMap[routeKey]
  if (mappedFile) {
    content = readLocalFile(mappedFile, contentPath)
    if (!content) {
      // Also try in the default docs content path (for general sections)
      content = readLocalFile(mappedFile, docsContentPath)
    }
    if (content) return { content, filePath: mappedFile }
  }

  return null
}

async function buildContent(slug: string[], projectId?: ProjectId): Promise<PageContent | null> {
  const page = await getPageContent(slug, projectId)

  if (!page) return null

  let content = page.content
  content = replaceTemplateVariables(content)
  content = removeCommentPatterns(content)
  content = sanitizeHtmlForMdx(content)

  return { content, filePath: page.filePath }
}

function getProjectFromSlug(slug: string[]): { projectId: ProjectId | undefined; docSlug: string[] } {
  const knownProjects: string[] = ['kubestellar', 'clusteradm-ocm', 'ks-core', 'multi-plugin', 'hive', 'kubestellar-mcp', 'console', 'a2a', 'kubeflex']
  
  if (slug.length > 0 && knownProjects.includes(slug[0])) {
    return {
      projectId: slug[0] as ProjectId,
      docSlug: slug.slice(1)
    }
  }
  
  return { projectId: undefined, docSlug: slug }
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const { projectId, docSlug } = getProjectFromSlug(slug)

  const page = await buildContent(docSlug, projectId)

  if (!page) {
    notFound()
  }

  const { content, filePath } = page

  // Extract the layout wrapper (DocsLayout: prose typography, table of
  // contents, edit-page actions) so it can be rendered explicitly around the
  // MDX output. nextra's evaluate() does not apply the wrapper component
  // itself — without this the page renders as unstyled markup.
  const { wrapper: Wrapper, ...components } = getMDXComponents({
    Callout,
    Tabs,
    Mermaid,
    convertHtmlScriptsToJsxComments
  })

  let evaluated: ReturnType<typeof evaluate> | null = null
  let compilationFailed = false
  try {
    const compiled = await compileMdx(content, {
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: []
      }
    })

    evaluated = evaluate(compiled, components)
  } catch {
    // If MDX compilation fails, fall back to plain text rendering
    compilationFailed = true
  }

  const MDXContent = evaluated?.default

  return (
    <Wrapper
      toc={evaluated?.toc ?? []}
      metadata={evaluated?.metadata}
      filePath={filePath}
      projectId={projectId ?? 'kubestellar'}
    >
      {compilationFailed || !MDXContent ? <pre>{content}</pre> : <MDXContent />}
    </Wrapper>
  )
}

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  const allParams: Array<{ slug: string[] }> = []
  
  function collectParams(dir: string, prefix: string[] = []) {
    if (!fs.existsSync(dir)) return
    
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        collectParams(path.join(dir, entry.name), [...prefix, entry.name])
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        const slug = [...prefix, entry.name.replace(/\.mdx?$/, '')]
        allParams.push({ slug })
      }
    }
  }
  
  collectParams(docsContentPath)
  
  // Also add Hive docs if available
  if (HIVE_DOCS_PATH && fs.existsSync(HIVE_DOCS_PATH)) {
    const hiveEntries = fs.readdirSync(HIVE_DOCS_PATH, { withFileTypes: true })
    for (const entry of hiveEntries) {
      if (!entry.isDirectory()) continue
      const route = entry.name
      allParams.push({ slug: ['hive', ...route.split('/')] })
    }
  }

  return allParams
}
