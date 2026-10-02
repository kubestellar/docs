import { SidebarContainer } from '@/components/docs/SidebarContainer'
import { buildPageMap } from '../page-map'
import {
  getProjectFromSlug,
  stripMetaNodes,
  type PageMapNode,
} from './layout-helpers'

type Props = {
  children: React.ReactNode
  params: Promise<{ slug: string[] }>
}

/**
 * Nested layout for /docs/[...slug] routes.
 *
 * Unlike the top-level /docs/layout.tsx which wraps the entire page shell
 * (html, body, navbar, footer), this layout is responsible for the sidebar
 * and content area. It reads the slug to determine the active project and
 * builds ONLY that project's page map — reducing the serialized RSC payload
 * from ~52 KB (all 6 projects) to ~5-15 KB (one project).
 */
export default async function SlugLayout({ children, params }: Props) {
  const { slug } = await params
  const projectId = getProjectFromSlug(slug)

  const { pageMap } = buildPageMap(projectId)
  const slimPageMap = stripMetaNodes(pageMap as PageMapNode[])

  return (
    <>
      <SidebarContainer pageMap={slimPageMap} projectId={projectId} />
      <div className="flex-1 min-w-0 flex flex-row">
        {children}
      </div>
    </>
  )
}
