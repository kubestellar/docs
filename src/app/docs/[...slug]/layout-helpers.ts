import type { ProjectId } from '@/config/versions'

/** Detect project from the first URL segment */
export function getProjectFromSlug(slug: string[]): ProjectId {
  if (slug.length > 0) {
    if (slug[0] === 'a2a') return 'a2a'
    if (slug[0] === 'kubeflex') return 'kubeflex'
    if (slug[0] === 'multi-plugin') return 'multi-plugin'
    if (slug[0] === 'kubestellar-mcp') return 'kubestellar-mcp'
    if (slug[0] === 'console') return 'console'
  }
  return 'kubestellar'
}

export interface PageMapNode {
  kind?: string
  name: string
  route?: string
  title?: string
  children?: PageMapNode[]
  frontMatter?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Check if a node is a Meta node. Nextra's normalizePageMap strips the
 * `kind: 'Meta'` field, leaving nodes with only a `data` property and
 * no `name`/`route`. Detect both raw and normalized Meta nodes.
 */
export function isMetaNode(item: PageMapNode): boolean {
  if (item.kind === 'Meta') return true
  if ('data' in item && !item.name && !item.route) return true
  return false
}

/**
 * Recursively strip Meta nodes from the page map — they are only used by
 * Nextra's built-in sidebar and add ~30-40 % to the serialized RSC payload.
 * Our custom DocsSidebar skips Meta nodes anyway (kind === 'Meta' → return null).
 */
export function stripMetaNodes(items: PageMapNode[]): PageMapNode[] {
  return (items || [])
    .filter((item: PageMapNode) => !isMetaNode(item))
    .map((item: PageMapNode) =>
      item.children
        ? { ...item, children: stripMetaNodes(item.children) }
        : item
    )
}
