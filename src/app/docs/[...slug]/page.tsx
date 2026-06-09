import { compileMdx } from 'nextra/compile'
import { Callout, Tabs } from 'nextra/components'
import { evaluate } from 'nextra/evaluate'
import { useMDXComponents as getMDXComponents } from '../../../../mdx-components'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'
import { MermaidComponent } from '@/lib/Mermaid'
import { buildPageMap, docsContentPath } from '../page-map'
import { CURRENT_VERSION, type ProjectId } from '@/config/versions'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'

const HIVE_DOCS_PATH = process.env.HIVE_DOCS_PATH

type Props = {
  params: Promise<{ slug: string[] }>
}

// Apply a regex removal repeatedly until the output is stable.
// Prevents bypass of multi-character patterns via nested/interleaved input
// (e.g. <scr<script>ipt> → after one pass → <script>; loop catches the remainder).
function stripUntilStable(content: string, pattern: RegExp): string {
  let prev = ''
  while (content !== prev) {
    prev = content
    content = content.replace(pattern, '')
  }
  return content
}

function removeCommentPatterns(content: string): string {
  let cleaned = content
  
  // Remove all HTML comments — loop until stable to prevent partial-comment bypass
  // (e.g. <!-<!----> could reassemble to <!-- after one pass)
  let prev = ''
  while (cleaned !== prev) {
    prev = cleaned
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  }
  // Remove any residual comment openers that were not closed (loop until stable)
  prev = ''
  while (cleaned !== prev) {
    prev = cleaned
    cleaned = cleaned.replace(/<!--[\s\S]*/g, '')
  }
  
  // Remove Jinja-style comments
  cleaned = cleaned.replace(/\{#[\s\S]*?#\}/g, '')
  
  // Remove JSX-style comments that aren't valid
  cleaned = cleaned.replace(/\{\/[^}]*\/\}/g, '')
  
  return cleaned
}

// Escape HTML special characters so that extracted attribute values cannot
// re-introduce HTML tags or break out of attribute context when interpolated
// into template literals (CWE-79 / CodeQL js/incomplete-html-attribute-sanitization).
function escapeAngle(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Sanitize HTML for MDX compatibility
function sanitizeHtmlForMdx(content: string): string {
  let sanitized = content
  
  // Convert contributors table to a grid of contributor cards
  sanitized = sanitized.replace(/<table>[\s\S]*?<\/table>/gi, (tableMatch) => {
    // Extract all contributor info from table cells
    const contributors: Array<{ name: string; github: string; avatar: string; profileUrl: string }> = []
    const tdRegex = /<td[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*><img src="([^"]+)"[^>]*\/?><br\s*\/?><sub><b>([^<]+)<\/b><\/sub><\/a>[\s\S]*?<\/td>/gi
    
    let tdMatch
    while ((tdMatch = tdRegex.exec(tableMatch)) !== null) {
      const profileUrl = tdMatch[1]
      const avatar = tdMatch[2]
      const name = tdMatch[3]
      const githubMatch = profileUrl.match(/github\.com\/([^\/]+)/)
      const github = githubMatch ? githubMatch[1] : ''
      
      if (name && avatar) {
        contributors.push({ name, github, avatar, profileUrl })
      }
    }
    
    if (contributors.length === 0) return ''
    
    // Generate a CSS grid of contributor cards.
    // Escape '<'/'>' in extracted values before interpolation to prevent tag injection.
    const cards = contributors.map(c =>
      `<a href="${escapeAngle(c.profileUrl)}" className="contributor-card" target="_blank" rel="noopener noreferrer">
        <img src="${escapeAngle(c.avatar)}" alt="${escapeAngle(c.name)}" />
        <span>${escapeAngle(c.name)}</span>
      </a>`
    ).join('\n')
    
    return `<div className="contributors-grid">\n${cards}\n</div>`
  })
  
  // Remove leftover tr/td that aren't part of tables we converted
  sanitized = sanitized.replace(/<tr>[\s\S]*?<\/tr>/gi, '')
  sanitized = sanitized.replace(/<td[^>]*>[\s\S]*?<\/td>/gi, '')
  
  // Remove all iframe tags — also handles unclosed <iframe ...> without </iframe>
  sanitized = stripUntilStable(sanitized, /<iframe[\s\S]*?<\/iframe>/gi)
  sanitized = sanitized.replace(/<iframe\b[^>]*\/?>/gi, '')
  
  // Normalize all img tags - handle both <img ...> and <img ... />
  sanitized = sanitized.replace(/<img\s+([^>]*?)\/?>/gi, (match, attrs) => {
    // Keep only src, alt, and title attributes
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    const titleMatch = attrs.match(/title=["']([^"']*)["']/i)
    
    const src = srcMatch ? srcMatch[1] : ''
    const alt = altMatch ? altMatch[1] : ''
    const title = titleMatch ? ` title="${titleMatch[1]}"` : ''
    
    if (!src) return ''
    return `<img src="${src}" alt="${alt}"${title} />`
  })
  
  // Fix self-closing tags
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '<br />')
  sanitized = sanitized.replace(/<hr\s*\/?>/gi, '<hr />')
  
  // Remove inline event handlers — single comprehensive pattern applied until stable.
  // Handles: quoted values (any quote style), unquoted values, no-value attributes,
  // and mixed-quote bypasses (e.g. onclick='value"', onclick=alert(1)).
  sanitized = stripUntilStable(
    sanitized,
    /\s+on\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>'"]+))?/gi,
  )
  
  // Remove other problematic attributes from remaining tags
  sanitized = sanitized.replace(/\s+align=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+width=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+height=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+frameborder=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\s+allowfullscreen(?:=["'][^"']*["'])?/gi, '')
  sanitized = sanitized.replace(/\s+scrolling=["']?[^"'\s>]+["']?/gi, '')
  sanitized = sanitized.replace(/\sclass=/gi, ' className=')
  
  // Remove style attributes that might cause issues
  sanitized = sanitized.replace(/\s+style=["'][^"']*["']/gi, '')
  
  // Remove style tags — loop until stable to prevent nested-tag bypass
  // (e.g. <sty<style>le>...</style> reassembles after one pass)
  sanitized = stripUntilStable(sanitized, /<style[^>]*>[\s\S]*?<\/style>/gi)
  
  // Remove script tags — loop until stable to prevent nested-tag bypass
  // (e.g. <scr<script>ipt>alert(1)</script> reassembles after one pass).
  // Use [^>]* before closing > to also match </script foo="bar"> and other
  // attribute-bearing end tags browsers accept as valid (CodeQL #190: js/bad-tag-filter).
  sanitized = stripUntilStable(sanitized, /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
  
  // Remove <sub> and other problematic inline tags that may have issues
  sanitized = sanitized.replace(/<sub>/gi, '')
  sanitized = sanitized.replace(/<\/sub>/gi, '')
  
  return sanitized
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
  
  let mdxContent
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
    
    const MDXContent = evaluated.default
    
    mdxContent = <MDXContent />
  } catch {
    // If MDX compilation fails, render as plain text
    mdxContent = <pre>{content}</pre>
  }
  
  return (
    <div className="docs-content">
      {mdxContent}
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