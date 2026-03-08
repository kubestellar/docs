'use client'

import { usePathname } from 'next/navigation'
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

function getProjectFromPathname(pathname: string): ProjectId {
  if (pathname.startsWith('/docs/a2a')) return 'a2a'
  if (pathname.startsWith('/docs/kubeflex')) return 'kubeflex'
  if (pathname.startsWith('/docs/multi-plugin')) return 'multi-plugin'
  if (pathname.startsWith('/docs/kubestellar-mcp')) return 'kubestellar-mcp'
  if (pathname.startsWith('/docs/console')) return 'console'
  return 'kubestellar'
}

interface SidebarContainerProps {
  allPageMaps: Record<ProjectId, PageMapItem[]>
}

export function SidebarContainer({ allPageMaps }: SidebarContainerProps) {
  const pathname = usePathname()
  const projectId = getProjectFromPathname(pathname)
  const pageMap = allPageMaps[projectId] || allPageMaps['kubestellar']

  return <DocsSidebar pageMap={pageMap} projectId={projectId} />
}
