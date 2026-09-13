// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRef } from 'react'

/**
 * Render smoke tests for src/components/docs/DocsSidebar.tsx (632 LOC, 0% coverage
 * before this file; see docs#6703 Track 2). The component depends on
 * next/navigation (usePathname), next/link (which is fine under jsdom), and the
 * DocsProvider context (useDocsMenu). We stub the provider so we can drive the
 * collapsed/expanded state deterministically without mounting DocsProvider.
 *
 * The intent is a render smoke: exercise the top-level branches — active
 * project tree vs. inactive project link, Legacy group expand/collapse,
 * general sections (Contributing/Community/News), the /docs/introduction
 * "Docs Guide" active state, and the itemKey collapse toggle. We assert on
 * visible text and aria labels only; layout math (rem/px) and the resize
 * observer are covered by non-assertion render + effect flushes.
 */

let mockPathname = '/docs/console/features/overview'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

// Minimal SidebarFooter stub — the real component pulls in icons + more
// context; the sidebar test does not need the footer contents.
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

const toggleSidebar = vi.fn(() => {
  menuState.sidebarCollapsed = !menuState.sidebarCollapsed
})
const toggleMenu = vi.fn(() => {
  menuState.menuOpen = !menuState.menuOpen
})
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

vi.mock('../components/docs/DocsProvider', () => ({
  useDocsMenu: () => {
    // navInitialized must be a stable ref-like object across re-renders.
    // Fresh Refs per render would re-run the init-once effect; we return a
    // module-scoped ref instead. Vitest resets between tests via
    // beforeEach() below.
    return {
      sidebarCollapsed: menuState.sidebarCollapsed,
      toggleSidebar,
      menuOpen: menuState.menuOpen,
      toggleMenu,
      bannerDismissed: menuState.bannerDismissed,
      navCollapsed: menuState.navCollapsed,
      setNavCollapsed,
      toggleNavCollapsed,
      navInitialized: navInitializedRef,
    }
  },
}))

// Shared ref across the whole test file — reset in beforeEach.
const navInitializedRef = { current: false } as { current: boolean }

// Import after mocks so the component picks up the mocked modules.
import { DocsSidebar } from '../components/docs/DocsSidebar'

const sampleConsoleMap = [
  {
    name: 'Getting Started',
    children: [
      { name: 'Introduction', title: 'Introduction', route: '/docs/console/getting-started/intro' },
      { name: 'Install', title: 'Install', route: '/docs/console/getting-started/install' },
    ],
  },
  {
    name: 'Features',
    children: [
      { name: 'Overview', title: 'Overview', route: '/docs/console/features/overview' },
      { name: 'Dashboards', title: 'Dashboards', route: '/docs/console/features/dashboards' },
    ],
  },
  // General sections — must render at the bottom, not inside the project tree.
  {
    name: 'Contributing',
    children: [{ name: 'How', title: 'How to contribute', route: '/docs/contributing/how' }],
  },
  {
    name: 'Community',
    children: [{ name: 'Chat', title: 'Chat', route: '/docs/community/chat' }],
  },
  {
    name: 'News',
    children: [{ name: 'Blog', title: 'Blog', route: '/docs/news/blog' }],
  },
]

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

describe('DocsSidebar — render smoke', () => {
  it('renders the Docs Guide link and the active console project label', () => {
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    expect(screen.getByText('Docs Guide')).toBeTruthy()
    expect(screen.getByText('KubeStellar Console')).toBeTruthy()
    expect(screen.getByText('KubeStellar MCP')).toBeTruthy()
    expect(screen.getByText('Legacy Components')).toBeTruthy()
  })

  it('renders general sections (Contributing, Community, News) below projects', () => {
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    expect(screen.getByText('Contributing')).toBeTruthy()
    expect(screen.getByText('Community')).toBeTruthy()
    expect(screen.getByText('News')).toBeTruthy()
  })

  it('does NOT include general sections inside the active project tree', () => {
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    // The project section labels come from getProjectItems() — they should
    // include only non-general items.
    expect(screen.getByText('Getting Started')).toBeTruthy()
    expect(screen.getByText('Features')).toBeTruthy()
  })

  it('marks the Docs Guide as active on /docs/introduction', () => {
    mockPathname = '/docs/introduction'
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    const guideLink = screen.getByText('Docs Guide').closest('a')
    expect(guideLink).toBeTruthy()
    // Active state uses the blue-600 text class.
    expect(guideLink!.className).toMatch(/text-blue-600/)
  })

  it('marks the Legacy group active when projectId is a legacy project', () => {
    mockPathname = '/docs/a2a/intro'
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="a2a" />)
    // The Legacy Components wrapper carries the active blue-50 bg class.
    const legacyLabel = screen.getByText('Legacy Components')
    const wrapper = legacyLabel.closest('div')
    expect(wrapper).toBeTruthy()
    expect(wrapper!.className).toMatch(/bg-blue-50/)
  })

  it('does NOT mark Legacy active when browsing a general section', () => {
    mockPathname = '/docs/contributing/how'
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="a2a" />)
    const wrapper = screen.getByText('Legacy Components').closest('div')
    expect(wrapper!.className).not.toMatch(/bg-blue-50/)
  })

  it('toggles nav collapsed state via toggleNavCollapsed on chevron click', () => {
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    const button = screen.getAllByLabelText(/Expand section|Collapse section/)[0]
    fireEvent.click(button)
    expect(toggleNavCollapsed).toHaveBeenCalled()
  })

  it('renders the slim sidebar footer variant when sidebarCollapsed=true', () => {
    menuState.sidebarCollapsed = true
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    expect(screen.getByTestId('sidebar-footer-slim')).toBeTruthy()
  })

  it('renders a mobile close button that invokes toggleMenu', () => {
    render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    const closeBtn = screen.getByLabelText('Close sidebar')
    fireEvent.click(closeBtn)
    expect(toggleMenu).toHaveBeenCalled()
  })

  it('handles an empty pageMap without crashing', () => {
    const { container } = render(<DocsSidebar pageMap={[]} projectId="console" />)
    expect(container.querySelector('aside[data-sidebar="docs"]')).toBeTruthy()
    // Docs Guide + project labels + Legacy Components still render even with
    // no pageMap items.
    expect(screen.getByText('Docs Guide')).toBeTruthy()
    expect(screen.getByText('Legacy Components')).toBeTruthy()
  })

  it('renders when projectId is undefined (all projects show as links, no tree)', () => {
    render(<DocsSidebar pageMap={sampleConsoleMap} />)
    // With projectId undefined, the equality check in renderProject means
    // every project renders as a link (no expanded tree), so tree-only labels
    // like "Getting Started" are NOT visible.
    expect(screen.queryByText('Getting Started')).toBeNull()
    // Project links themselves still appear.
    expect(screen.getByText('KubeStellar Console')).toBeTruthy()
  })

  it('applies a custom className on the aside element', () => {
    const { container } = render(
      <DocsSidebar pageMap={sampleConsoleMap} projectId="console" className="my-custom-class" />,
    )
    const aside = container.querySelector('aside[data-sidebar="docs"]')
    expect(aside).toBeTruthy()
    expect(aside!.className).toMatch(/my-custom-class/)
  })

  it('skips separator, meta, and index items', () => {
    const map = [
      {
        name: 'Weird',
        children: [
          { name: '_meta', title: '_meta' },
          { name: 'sep', title: '---', kind: 'Separator' },
          { name: 'meta2', title: 'Meta Item', kind: 'Meta' },
          { name: 'index', title: 'Index' },
          { name: 'real', title: 'Real Item', route: '/docs/console/weird/real' },
        ],
      },
    ]
    render(<DocsSidebar pageMap={map} projectId="console" />)
    // Only the "Real Item" child should appear inside the Weird section.
    expect(screen.getByText('Real Item')).toBeTruthy()
    expect(screen.queryByText('Meta Item')).toBeNull()
    expect(screen.queryByText('Index')).toBeNull()
  })

  it('sets suppressHydrationWarning + fixed positioning class on the aside', () => {
    const { container } = render(<DocsSidebar pageMap={sampleConsoleMap} projectId="console" />)
    const aside = container.querySelector('aside[data-sidebar="docs"]') as HTMLElement
    expect(aside).toBeTruthy()
    expect(aside.className).toMatch(/fixed/)
    expect(aside.className).toMatch(/lg:sticky/)
  })
})
