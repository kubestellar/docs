import { compileMdx } from 'nextra/compile'
import { Callout, Tabs } from 'nextra/components'
import { evaluate } from 'nextra/evaluate'
import { useMDXComponents as getMDXComponents } from '../../../../mdx-components'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'
import { MermaidComponent } from '@/lib/Mermaid'
import { sanitizeHtmlForMdx, removeCommentPatterns } from '@/lib/sanitizeHtml'
import { buildPageMap, docsContentPath } from '../page-map'
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
  // Try the project-specific content path first
  const fullPath = path.join(contentPath, filePath)
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
    try {
      if (fs.existsSync(kubestellarPath)) {
        return fs.readFileSync(kubestellarPath, 'utf-8')
      }
    } catch {
      // File doesn't exist in KubeStellar directory either
    }
  }

  // If not found in content directories, try repository root
  const repoRootPath = path.join(process.cwd(), filePath)
  try {
    if (fs.existsSync(repoRootPath)) {
      return fs.readFileSync(repoRootPath, 'utf-8')
    }
  } catch {
    // File doesn't exist in repository root
  }

  return null
}

async function getPageContent(slug: string[], projectId?: ProjectId): Promise<string | null> {
  const filePath = slug.join('/') + '.md'
  
  const contentPath = projectId 
    ? path.join(docsContentPath, '..', projectId, 'content')
    : docsContentPath

  // Try .md first, then .mdx
  let content = readLocalFile(filePath, contentPath)
  if (!content) {
    const mdxPath = slug.join('/') + '.mdx'
    content = readLocalFile(mdxPath, contentPath)
  }
  
  return content
}

async function buildContent(slug: string[], projectId?: ProjectId): Promise<string | null> {
  let content = await getPageContent(slug, projectId)
  
  if (!content) return null
  
  content = replaceTemplateVariables(content)
  content = removeCommentPatterns(content)
  content = sanitizeHtmlForMdx(content)
  
  return content
}

function getProjectFromSlug(slug: string[]): { projectId: ProjectId | undefined; docSlug: string[] } {
  const knownProjects = ['kubestellar', 'clusteradm-ocm', 'ks-core']
  
  if (slug.length > 0 && knownProjects.includes(slug[0] as ProjectId)) {
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
  
  const content = await buildContent(docSlug, projectId)
  
  if (!content) {
    notFound()
  }
  
  let MDXContent: ReturnType<typeof evaluate>['default'] | null = null
  let compilationFailed = false
  try {
    const compiled = await compileMdx(content, {
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: []
      }
    })
    
    const components = getMDXComponents({
      Callout,
      Tabs,
      MermaidComponent,
      convertHtmlScriptsToJsxComments
    })
    
    const evaluated = evaluate(compiled, components)
    MDXContent = evaluated.default
  } catch {
    // If MDX compilation fails, fall back to plain text rendering
    compilationFailed = true
  }
  
  return (
    <div className="docs-content">
      {compilationFailed || !MDXContent ? <pre>{content}</pre> : <MDXContent />}
    </div>
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
