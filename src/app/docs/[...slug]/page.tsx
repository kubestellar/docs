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

// Detect project from URL slug
function getProjectFromSlug(slug: string[]): ProjectId {
  if (slug.length > 0) {
    if (slug[0] === 'a2a') return 'a2a'
    if (slug[0] === 'kubeflex') return 'kubeflex'
    if (slug[0] === 'multi-plugin') return 'multi-plugin'
    if (slug[0] === 'kubestellar-mcp') return 'kubestellar-mcp'
    if (slug[0] === 'console') return 'console'
    if (slug[0] === 'hive') return 'hive'
    if (slug[0] === 'kubestellar') return 'kubestellar'
  }
  return 'kubestellar'
}

// Get route without project prefix
function getRouteFromSlug(slug: string[], projectId: ProjectId): string {
  if (projectId === 'kubestellar') {
    return slug.join('/')
  }
  // Remove the project prefix from the slug
  return slug.slice(1).join('/')
}

export const dynamic = 'force-static'
export const revalidate = false

const { wrapper: Wrapper, ...components } = getMDXComponents({ $Tabs: Tabs, Callout })
const component = { ...components, Mermaid: MermaidComponent }

type PageProps = Readonly<{
  params: Promise<{ slug?: string[] }>
}>

function resolvePath(baseFile: string, relativePath: string) {
  if (relativePath.startsWith('/')) return relativePath.slice(1)
  const stack = baseFile.split('/')
  stack.pop() // Remove current filename
  const parts = relativePath.split('/')
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') {
      if (stack.length > 0) stack.pop()
    } else {
      stack.push(part)
    }
  }
  const resolved = stack.join('/')
  
  // If path goes above content root (empty or has ../), try just the filename
  if (resolved === '' || resolved.startsWith('..')) {
    // Return just the filename
    return parts[parts.length - 1]
  }
  
  return resolved
}

function wrapMarkdownImagesWithFigures(markdown: string) {
  // Only wrap standalone images that are NOT inside list items
  // This regex matches: start of line, NO leading whitespace, image, end of line
  // We explicitly require NO leading whitespace to avoid wrapping images inside lists
  const imageRegex = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/gm

  return markdown.replace(imageRegex, (match, alt, src, title) => {
    // Safety checks for undefined/null values
    const safeAlt = alt || ''
    const safeSrc = src || ''
    const safeTitle = title || ''
    
    const captionText = safeTitle || safeAlt
    const titleAttr = safeTitle ? ` title="${safeTitle}"` : ''
    const figcaptionElement = captionText ? `\n  <figcaption>${captionText}</figcaption>` : ''

    return `<figure className="ks-doc-figure">\n  <img src="${safeSrc}" alt="${safeAlt}"${titleAttr} />${figcaptionElement}\n</figure>`
  })
}

function wrapBadgeLinksInGrid(markdown: string) {
  const badgePattern = /\[!\[([^\]]*)\]\(([^)]*(?:shields\.io|badge|deepwiki)[^)]*)\)\]\(([^)]*)\)/gi

  const allBadges: Array<{ fullMatch: string; startIndex: number; endIndex: number }> = []
  let match

  while ((match = badgePattern.exec(markdown)) !== null) {
    allBadges.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  if (allBadges.length === 0) return markdown

  const groups: string[][] = []
  let currentGroup: string[] = []
  let lastEndIndex = -1

  for (const badge of allBadges) {
    if (currentGroup.length === 0 || badge.startIndex - lastEndIndex < 200) {
      currentGroup.push(badge.fullMatch)
    } else {
      if (currentGroup.length > 0) groups.push(currentGroup)
      currentGroup = [badge.fullMatch]
    }
    lastEndIndex = badge.endIndex
  }
  if (currentGroup.length > 0) groups.push(currentGroup)

  let result = markdown
  let offset = 0

  for (const group of groups) {
    if (group.length > 0) {
      const badgesToWrap = group.slice(0, 9)
      const firstBadge = badgesToWrap[0]
      const lastBadge = badgesToWrap[badgesToWrap.length - 1]
      const firstIndex = result.indexOf(firstBadge, offset)

      if (firstIndex !== -1) {
        const lastIndex = result.indexOf(lastBadge, firstIndex) + lastBadge.length
        const beforeSection = result.substring(0, firstIndex)
        const afterSection = result.substring(lastIndex)
        const wrapped = `<div className="badge-grid-container">\n${badgesToWrap.map(b => `  <p>${b}</p>`).join('\n')}\n</div>`

        result = beforeSection + wrapped + afterSection
        offset = beforeSection.length + wrapped.length
      }
    }
  }

  return result
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
  // Remove any residual comment openers that were not closed — loop until stable
  // (e.g. "<!-<!--" becomes "<!-" after a pass; loop catches newly-exposed openers).
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

// Sanitize HTML string for safe rendering in MDX context.
// Removes dangerous tags and attributes while preserving valid markup.
export function sanitizeHtmlForMdx(html: string): string {
  let sanitized = html

  // Remove null bytes and control characters (except whitespace)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Remove HTML comments (may hide malicious content)
  sanitized = removeCommentPatterns(sanitized)

  // Remove CDATA sections
  sanitized = sanitized.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '')

  // Remove processing instructions
  sanitized = sanitized.replace(/<\?[\s\S]*?\?>/g, '')

  // Remove doctype declarations
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '')

  // Remove meta and link tags (can redirect or load resources)
  sanitized = sanitized.replace(/<meta[^>]*\/?>/gi, '')
  sanitized = sanitized.replace(/<link[^>]*\/?>/gi, '')

  // Remove base tags (can change all relative URLs)
  sanitized = sanitized.replace(/<base[^>]*\/?>/gi, '')

  // Remove style tags — loop until stable to prevent nested-tag bypass
  // (e.g. <sty<style>le>...</style> reassembles after one pass)
  sanitized = stripUntilStable(sanitized, /<style[^>]*>[\s\S]*?<\/style>/gi)
  
  // Remove script tags — loop until stable to prevent nested-tag bypass
  // (e.g. <scr<script>ipt>alert(1)</script> reassembles after one pass).
  // Use [^>]* in the close tag to match any attributes / whitespace, so
  // </script foo="bar"> is also caught (CodeQL #190: js/bad-tag-filter).
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
    // File doesn't exist in repository root either
  }

  return null
}

// Process include directives with common logic
function processInclude(
  fullMatch: string,
  relativePath: string,
  filePath: string,
  contentPath: string,
  extractContent?: (content: string) => string
): string {
  const resolvedPath = resolvePath(filePath, relativePath)
  const includeContent = readLocalFile(resolvedPath, contentPath)
  
  if (includeContent) {
    const content = extractContent ? extractContent(includeContent) : includeContent
    return removeCommentPatterns(content)
  }
  
  if (relativePath.includes('coming-soon.md')) {
    return ''
  }
  
  return `> **Note**: Include file \`${relativePath}\` not found`
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const slug = params.slug ?? []

  // Detect project from URL slug
  const projectId = getProjectFromSlug(slug)
  const route = getRouteFromSlug(slug, projectId)

  const { routeMap, filePaths, contentPath } = buildPageMap(projectId)

  const filePath =
    routeMap[route] ??
    [`${route}.mdx`, `${route}.md`, `${route}/README.md`, `${route}/readme.md`, `${route}/index.mdx`, `${route}/index.md`]
      .find(p => filePaths.includes(p))

  if (!filePath) notFound()

  const rawText = readLocalFile(filePath, contentPath)

  if (!rawText) notFound()

  // --- START PROCESSING INCLUDES ---
  let processedContent = removeCommentPatterns(rawText)

  // 1. Process Jekyll-style includes: {% include "path" %}
  processedContent = processedContent.replace(
    /{%\s*include\s+["']([^"']+)["']\s*%}/g,
    (match, relativePath) => processInclude(match, relativePath, filePath, contentPath)
  )

  // 2. Process partial includes with markers: {% include-markdown "path" start="..." end="..." %}
  processedContent = processedContent.replace(
    /{%[\s\S]*?include-markdown[\s\S]+?["']([^"']+)["'][\s\S]*?start\s*=\s*["']([^"']*)["'][\s\S]*?end\s*=\s*["']([^"']*)["'][\s\S]*?%}/g,
    (match, relativePath, startMarker, endMarker) => {
      return processInclude(match, relativePath, filePath, contentPath, (content) => {
        // If markers are empty, return whole content
        if (!startMarker && !endMarker) return content
        
        const startIndex = content.indexOf(startMarker)
        const endIndex = content.indexOf(endMarker)
        
        if (startIndex !== -1 && endIndex !== -1) {
          return content.substring(startIndex + startMarker.length, endIndex).trim()
        }
        
        return `> **Note**: Markers not found in \`${relativePath}\``
      })
    }
  )

  // 3. Process full includes (without markers): {% include-markdown "path" %}
  processedContent = processedContent.replace(
    /{%[\s\S]*?include-markdown[\s\S]+?["']([^"']+)["'][\s\S]*?%}/g,
    (match, relativePath) => processInclude(match, relativePath, filePath, contentPath)
  )
  // --- END PROCESSING INCLUDES ---

  const filePathToRoute = new Map<string, string>()
  // Only set if not already set - prefer nav structure routes over fallback routes
  Object.entries(routeMap).forEach(([r, fp]) => {
    if (!filePathToRoute.has(fp)) {
      filePathToRoute.set(fp, r)
    }
  })

  // Get the base path for links based on project
  const linkBasePath = projectId === 'kubestellar' ? '/docs' : `/docs/${projectId}`

  // Rewrite Markdown links/images using the fully processed content
  let rewrittenText = processedContent.replace(/(!?\[.*?\])\((.*?)\)/g, (match, label, link) => {
    if (/^(http|https|mailto:|#)/.test(link)) return match

    const isImage = label.startsWith('!')
    const [linkUrl, linkHash] = link.split('#')

    const resolvedPath = resolvePath(filePath, linkUrl)

    if (isImage) {
      // Check if the resolved path is an image file
      const isImageFile = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(resolvedPath)
      if (isImageFile) {
        // Serve images from the /docs-images path which maps to docs/content
        // For a2a and kubeflex projects, prepend the project name
        const imagePrefix = projectId === 'kubestellar' ? '' : `${projectId}/`
        const imgPath = `/docs-images/${imagePrefix}${resolvedPath}`
        return `${label}(${imgPath})`
      }
      return match
    } else {
      let targetRoute = filePathToRoute.get(resolvedPath)
      if (!targetRoute) targetRoute = filePathToRoute.get(resolvedPath + '.md')
      if (!targetRoute) targetRoute = filePathToRoute.get(resolvedPath + '.mdx')

      if (targetRoute) {
        return `${label}(${linkBasePath}/${targetRoute}${linkHash ? '#' + linkHash : ''})`
      }

      // Keep the original link if we can't resolve it
      return match
    }
  })

  rewrittenText = rewrittenText.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)\/?>/gi, (match, pre, src, post) => {
    if (/^(http|https|mailto:|#|data:)/.test(src)) return match

    const resolvedPath = resolvePath(filePath, src)
    const isImageFile = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(resolvedPath)
    if (isImageFile) {
      // For a2a and kubeflex projects, prepend the project name
      const imagePrefix = projectId === 'kubestellar' ? '' : `${projectId}/`
      const imgPath = `/docs-images/${imagePrefix}${resolvedPath}`
      // Only keep alt attribute, remove other problematic attributes
      const altMatch = (pre + post).match(/alt=["']([^"']*)["']/i)
      const alt = altMatch ? altMatch[1] : ''
      return `<img src="${imgPath}" alt="${alt}" />`
    }
    return match
  })

  rewrittenText = wrapMarkdownImagesWithFigures(rewrittenText)
  rewrittenText = wrapBadgeLinksInGrid(rewrittenText)

  // Pre-process Jinja and Pymdown syntax before MDX compilation
  let preProcessedText = replaceTemplateVariables(rewrittenText)
  
  // Handle code block attributes
  preProcessedText = preProcessedText.replace(/```\s*\{([^}]+)\}\s*\n/g, (_match, attrs) => {
    const normalizedAttrs = attrs.replace(/^\./, '').replace(/\s+\./g, ' ')
    return `\`\`\`${normalizedAttrs}\n`
  })

  // Sanitize HTML for MDX
  let processedData = sanitizeHtmlForMdx(preProcessedText)
  processedData = convertHtmlScriptsToJsxComments(processedData)
  // Convert ```mermaid code fences to <Mermaid> JSX so the component renders
  processedData = processedData.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_match, chart: string) => `<Mermaid>{\`${chart.trimEnd()}\`}</Mermaid>`
  )

  const rawJs = await compileMdx(processedData, { filePath })
  const { default: MDXContent, toc, metadata } = evaluate(rawJs, component)

  // Get project-specific pageMap for the sidebar
  const { pageMap } = buildPageMap(projectId)

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={rawJs} pageMap={pageMap} filePath={filePath} projectId={projectId}>
      <MDXContent />
    </Wrapper>
  )
}

export async function generateStaticParams() {
  const allParams: { slug: string[] }[] = []

  // KubeStellar routes
  const kubestellarMap = buildPageMap('kubestellar')
  for (const route of Object.keys(kubestellarMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: route.split('/') })
    }
  }

  // A2A routes (prefixed with 'a2a')
  const a2aMap = buildPageMap('a2a')
  for (const route of Object.keys(a2aMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: ['a2a', ...route.split('/')] })
    }
  }

  // KubeFlex routes (prefixed with 'kubeflex')
  const kubeflexMap = buildPageMap('kubeflex')
  for (const route of Object.keys(kubeflexMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: ['kubeflex', ...route.split('/')] })
    }
  }

  // Multi-Plugin routes (prefixed with 'multi-plugin')
  const multiPluginMap = buildPageMap('multi-plugin')
  for (const route of Object.keys(multiPluginMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: ['multi-plugin', ...route.split('/')] })
    }
  }

  // kubestellar-mcp routes (prefixed with 'kubestellar-mcp')
  const kubestellarMcpMap = buildPageMap('kubestellar-mcp')
  for (const route of Object.keys(kubestellarMcpMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: ['kubestellar-mcp', ...route.split('/')] })
    }
  }

  // Console routes (prefixed with 'console')
  const consoleMap = buildPageMap('console')
  for (const route of Object.keys(consoleMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: ['console', ...route.split('/')] })
    }
  }

  // Hive routes (prefixed with 'hive')
  const hiveMap = buildPageMap('hive')
  for (const route of Object.keys(hiveMap.routeMap)) {
    if (route !== '') {
      allParams.push({ slug: ['hive', ...route.split('/')] })
    }
  }

  return allParams
}
