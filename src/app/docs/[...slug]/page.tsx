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

// Type for slug params
type SlugParams = {
  params: Promise<{
    slug: string[]
  }>
}

// Allowed HTML tags for sanitization whitelist
const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio',
  'b', 'blockquote', 'br', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd', 'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'menu', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'picture', 'pre', 'progress',
  'q', 'rp', 'rt', 'ruby',
  's', 'samp', 'section', 'select', 'small', 'source', 'span', 'strong', 'summary',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
])

// Tags that should never be allowed regardless of context
const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'])

// Sanitize HTML attributes — remove event handlers and javascript: hrefs
function sanitizeAttributes(tag: string): string {
  // Remove all event handler attributes (on*)
  let sanitized = tag.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
  // Remove javascript: protocol from href/src/action
  sanitized = sanitized.replace(/(?:href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '')
  // Remove data: URIs from src attributes (can contain executable content)
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*data:[^"'\s>]*/gi, '')
  return sanitized
}

// Wrap consecutive badge <p> elements in a grid container for proper display
function wrapBadgeGroups(content: string): string {
  // Match sequences of badge <p> tags (shield.io images)
  const badgePattern = /<p>\s*(?:<a[^>]*>)?\s*<img[^>]*shields\.io[^>]*>\s*(?:<\/a>)?\s*<\/p>/gi
  const matches = [...content.matchAll(badgePattern)]

  if (matches.length < 2) return content

  let result = content
  let offset = 0

  // Group consecutive badges
  const groups: RegExpMatchArray[][] = []
  let currentGroup: RegExpMatchArray[] = []

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const nextMatch = matches[i + 1]

    currentGroup.push(match)

    // Check if next badge immediately follows this one
    const currentEnd = (match.index ?? 0) + match[0].length
    const nextStart = nextMatch?.index ?? -1

    if (nextStart === -1 || nextStart - currentEnd > 5) {
      if (currentGroup.length >= 2) {
        groups.push([...currentGroup])
      }
      currentGroup = []
    }
  }

  for (const group of groups) {
    const badgesToWrap = group.map(m => m[0])
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
  return content
    .replace(/\{\{VERSION\}\}/g, version)
    .replace(/\{\{CURRENT_VERSION\}\}/g, version)
}

// Consolidate multiple consecutive blank lines into at most two
function consolidateBlankLines(content: string): string {
  return content.replace(/\n{3,}/g, '\n\n')
}

// Trim trailing whitespace from each line
function trimTrailingWhitespace(content: string): string {
  return content.split('\n').map(line => line.trimEnd()).join('\n')
}

// Build a JSON-serializable page map for use in client components
export async function buildSerializablePageMap(projectId: ProjectId) {
  const pageMap = await buildPageMap(projectId)
  return JSON.parse(JSON.stringify(pageMap))
}

// Build the content path for a given project and slug
export function buildContentPath(projectId: ProjectId, slug: string[]): string {
  return path.join(docsContentPath(projectId), ...slug) + '.mdx'
}

// Check if a file exists at the given path
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

// Read raw MDX file content
export function readMdxFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

// Pre-process raw MDX content before compilation
export function preprocessMdxContent(rawContent: string): string {
  let content = rawContent

  // Replace template variables
  content = replaceTemplateVariables(content)

  // Sanitize any inline HTML
  content = sanitizeHtmlForMdx(content)

  // Wrap badge groups in grid containers
  content = wrapBadgeGroups(content)

  // Consolidate blank lines
  content = consolidateBlankLines(content)

  // Trim trailing whitespace
  content = trimTrailingWhitespace(content)

  return content
}

// Load and preprocess MDX content for a given project and slug
export async function loadMdxContent(
  projectId: ProjectId,
  slug: string[]
): Promise<{ content: string; filePath: string } | null> {
  const filePath = buildContentPath(projectId, slug)

  if (!fileExists(filePath)) {
    return null
  }

  const rawContent = readMdxFile(filePath)
  const content = preprocessMdxContent(rawContent)

  return { content, filePath }
}

// Compile MDX content with nextra
export async function compileMdxContent(content: string) {
  return compileMdx(content, {
    defaultShowCopyCode: true,
  })
}

// Evaluate compiled MDX with components
export async function evaluateMdxContent(compiledSource: Awaited<ReturnType<typeof compileMdx>>) {
  return evaluate(compiledSource, {
    ...getMDXComponents(),
    Callout,
    Tabs,
    MermaidComponent,
  })
}

// Main page component
export default async function DocPage({ params }: SlugParams) {
  const { slug } = await params

  // Detect project from slug prefix
  let projectId: ProjectId = 'kubestellar'
  let docSlug = slug

  // Check if first segment is a known project identifier
  const knownProjects: ProjectId[] = ['kubestellar', 'clusteradm', 'ocm', 'kubeflex']
  if (slug.length > 0 && knownProjects.includes(slug[0] as ProjectId)) {
    projectId = slug[0] as ProjectId
    docSlug = slug.slice(1)
  }

  const result = await loadMdxContent(projectId, docSlug)

  if (!result) {
    notFound()
  }

  const { content } = result

  const compiledSource = await compileMdxContent(content)
  const { default: MDXContent } = await evaluateMdxContent(compiledSource)

  const pageMap = await buildSerializablePageMap(projectId)

  return (
    <div className="docs-content">
      <MDXContent
        components={{
          ...getMDXComponents(),
          Callout,
          Tabs,
          MermaidComponent,
        }}
      />
    </div>
  )
}
