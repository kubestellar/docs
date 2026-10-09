// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

/**
 * Covers the collapse/expand click-handler branches of
 * src/components/docs/DocsSidebar.tsx that DocsSidebar.render.test.tsx does
 * not exercise: folder rows with/without a first-child route, the active
 * project tree header toggle, and the inactive-project-link / Legacy-group
 * link+chevron pair (clicking the link while collapsed re-expands it;
 * clicking the chevron always toggles). See kubestellar/docs coverage-gap
 * finding on DocsSidebar.tsx (lines 166,190,255,294-304,365-375 — 0% before
 * this file).
 */

let mockPathname = '/docs/console/features/overview'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

vi.mock('../components/docs/SidebarFooter', () => ({
  SidebarFooter: ({ variant }: { variant?: string }) => (
    <div data-testid={`sidebar-footer${variant ? `-${variant}` : ''}`}>footer</div>
  ),
}))

type DocsMenuState = {
  sidebarCollapsed: boolean
  menuOpen: boolean
  bannerDismissed: boolean
  navCollapsed: Set<string>
}

const menuState: DocsMenuState = {
  sidebarCollapsed: false,
  menuOpen: false,
  bannerDismissed: false,
  navCollapsed: new Set<string>(),
}

const toggleSidebar = vi.fn()
const toggleMenu = vi.fn()
const setNavCollapsed = vi.fn(
  (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    menuState.navCollapsed =
      typeof updater === 'function'
        ? (updater as (p: Set<string>) => Set<string>)(menuState.navCollapsed)
        : updater
  },
)
const toggleNavCollapsed = vi.fn((key: string) => {
  const next = new Set(menuState.navCollapsed)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  menuState.navCollapsed = next
})

const navInitializedRef = { current: false } as { current: boolean }

vi.mock('../components/docs/DocsProvider', () => ({
  useDocsMenu: () => ({
    sidebarCollapsed: menuState.sidebarCollapsed,
    toggleSidebar,
    menuOpen: menuState.menuOpen,
    toggleMenu,
    bannerDismissed: menuState.bannerDismissed,
    navCollapsed: menuState.navCollapsed,
    setNavCollapsed,
    toggleNavCollapsed,
    navInitialized: navInitializedRef,
  }),
}))

import { DocsSidebar } from '../components/docs/DocsSidebar'

beforeEach(() => {
  mockPathname = '/docs/console/features/overview'
  menuState.sidebarCollapsed = false
  menuState.menuOpen = false
  menuState.bannerDismissed = false
  menuState.navCollapsed = new Set<string>()
  navInitializedRef.current = false
  toggleSidebar.mockClear()
  toggleMenu.mockClear()
  setNavCollapsed.mockClear()
  toggleNavCollapsed.mockClear()
})

describe('DocsSidebar — folder row click handlers', () => {
  const mapWithFirstChildRoute = [
    {
      name: 'Features',
      children: [
        { name: 'Overview', title: 'Overview', route: '/docs/console/features/overview' },
        { name: 'Dashboards', title: 'Dashboards', route: '/docs/console/features/dashboards' },
      ],
    },
  ]

  // Top-level items rendered inside the active project tree get a
  // `${sectionKey}-${name}` itemKey, where sectionKey is
  // `${PROJECT_KEY_PREFIX}${projectId}` (see renderActiveProjectTree).
  const featuresItemKey = '__project_console-Features'

  it('re-expands a collapsed folder-with-route row when its link is clicked', () => {
    menuState.navCollapsed = new Set([featuresItemKey])
    render(<DocsSidebar pageMap={mapWithFirstChildRoute} projectId="console" />)
    const link = screen.getByText('Features').closest('a')
    expect(link).toBeTruthy()
    fireEvent.click(link!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith(featuresItemKey)
  })

  it('does NOT toggle a folder-with-route row when its link is clicked while already expanded', () => {
    render(<DocsSidebar pageMap={mapWithFirstChildRoute} projectId="console" />)
    const link = screen.getByText('Features').closest('a')
    fireEvent.click(link!)
    expect(toggleNavCollapsed).not.toHaveBeenCalled()
  })

  it('toggles a folder-with-route row via its dedicated chevron button', () => {
    render(<DocsSidebar pageMap={mapWithFirstChildRoute} projectId="console" />)
    const row = screen.getByText('Features').closest('div')!
    const chevron = row.querySelector('button.ks-sidebar-chevron')
    expect(chevron).toBeTruthy()
    fireEvent.click(chevron!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith(featuresItemKey)
  })

  it('toggles a folder-without-child-route row via its own button', () => {
    // No child has a `route`, so getFirstChildRoute() returns null and the
    // folder renders as a plain toggle button (no separate link + chevron).
    const mapNoChildRoute = [
      {
        name: 'Empty Folder',
        children: [{ name: 'Meta', title: 'Meta', kind: 'Meta' }],
      },
    ]
    render(<DocsSidebar pageMap={mapNoChildRoute} projectId="console" />)
    const button = screen.getByText('Empty Folder').closest('button')
    expect(button).toBeTruthy()
    fireEvent.click(button!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith('__project_console-Empty Folder')
  })
})

describe('DocsSidebar — active project tree header toggle', () => {
  it('toggles the active project section via its header button', () => {
    const map = [
      { name: 'Features', children: [{ name: 'Overview', title: 'Overview', route: '/docs/console/features/overview' }] },
    ]
    render(<DocsSidebar pageMap={map} projectId="console" />)
    const header = screen.getByText('KubeStellar Console').closest('button')
    expect(header).toBeTruthy()
    fireEvent.click(header!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith('__project_console')
  })
})

describe('DocsSidebar — inactive project link + chevron', () => {
  it('re-expands an inactive project link when the label link is clicked while collapsed', () => {
    menuState.navCollapsed = new Set(['__project_kubestellar-mcp'])
    render(<DocsSidebar pageMap={[]} projectId="console" />)
    const link = screen.getByText('KubeStellar MCP').closest('a')
    expect(link).toBeTruthy()
    fireEvent.click(link!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith('__project_kubestellar-mcp')
  })

  it('does NOT toggle an inactive project link when clicked while already expanded', () => {
    render(<DocsSidebar pageMap={[]} projectId="console" />)
    const link = screen.getByText('KubeStellar MCP').closest('a')
    fireEvent.click(link!)
    expect(toggleNavCollapsed).not.toHaveBeenCalled()
  })

  it('toggles an inactive project link via its dedicated chevron button regardless of state', () => {
    render(<DocsSidebar pageMap={[]} projectId="console" />)
    const mcpLabel = screen.getByText('KubeStellar MCP')
    const row = mcpLabel.closest('div')!
    const chevron = row.querySelector('button.ks-sidebar-chevron')
    expect(chevron).toBeTruthy()
    fireEvent.click(chevron!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith('__project_kubestellar-mcp')
  })
})

describe('DocsSidebar — Legacy group link + chevron', () => {
  it('re-expands the Legacy group when its label link is clicked while collapsed', () => {
    menuState.navCollapsed = new Set(['__legacy'])
    render(<DocsSidebar pageMap={[]} projectId="console" />)
    const link = screen.getByText('Legacy Components').closest('a')
    expect(link).toBeTruthy()
    fireEvent.click(link!)
    expect(toggleNavCollapsed).toHaveBeenCalledWith('__legacy')
  })

  it('toggles the Legacy group via its dedicated chevron button', () => {
    render(<DocsSidebar pageMap={[]} projectId="console" />)
    const legacyLabel = screen.getByText('Legacy Components')
    const row = legacyLabel.closest('div')!
    const chevron = row.querySelector('button.ks-sidebar-chevron')
    expect(chevron).toBeTruthy()
    fireEvent.click(chevron!)
    expect(toggleNavCollapsed).toHaveBeenCalled()
  })
})
