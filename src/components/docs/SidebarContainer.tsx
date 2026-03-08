'use client'

import { DocsSidebar } from './DocsSidebar'
import type { ProjectId } from '@/config/versions'

interface PageMapItem {
  name: string
  route?: string
  title?: string
  children?: PageMapItem[]
  frontMatter?: Record<string, unknown>
  kind?: string
}

interface SidebarContainerProps {
  pageMap: PageMapItem[]
  projectId: ProjectId
}

export function SidebarContainer({ pageMap, projectId }: SidebarContainerProps) {
  return <DocsSidebar pageMap={pageMap} projectId={projectId} />
}
