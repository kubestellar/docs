import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'

/**
 * Coverage for the SlugLayout component in src/app/docs/[...slug]/layout.tsx.
 * Helpers are covered in slug-layout-helpers.test.ts; this file verifies the
 * component wiring: projectId handed to buildPageMap, Meta nodes stripped
 * before reaching SidebarContainer, and children still rendered.
 */

const buildPageMapMock = vi.fn()
vi.mock('@/app/docs/page-map', () => ({
  buildPageMap: (...args: unknown[]) => buildPageMapMock(...args),
}))

vi.mock('@/components/docs/SidebarContainer', () => ({
  SidebarContainer: () => null,
}))

import SlugLayout from '@/app/docs/[...slug]/layout'
import { SidebarContainer } from '@/components/docs/SidebarContainer'

const PAGE_MAP = [
  { data: { index: 'Home' } },
  { kind: 'Meta', name: '_meta', data: {} },
  {
    name: 'guide',
    route: '/docs/guide',
    children: [
      { kind: 'Meta', name: '_meta', data: {} },
      { name: 'install', route: '/docs/guide/install' },
    ],
  },
  { name: 'intro', route: '/docs/intro' },
]

async function render(slug: string[], child: ReactNode = 'content') {
  const tree = (await SlugLayout({
    children: child,
    params: Promise.resolve({ slug }),
  })) as ReactElement<{ children: ReactNode }>
  const [sidebar, wrapper] = Children.toArray(tree.props.children) as ReactElement<{
    pageMap?: unknown
    projectId?: string
    children?: ReactNode
  }>[]
  return { sidebar, wrapper }
}

describe('SlugLayout', () => {
  beforeEach(() => {
    buildPageMapMock.mockReset()
    buildPageMapMock.mockReturnValue({ pageMap: PAGE_MAP })
  })

  it.each([
    [['a2a', 'intro'], 'a2a'],
    [['kubeflex', 'guide'], 'kubeflex'],
    [['multi-plugin', 'x'], 'multi-plugin'],
    [['kubestellar-mcp', 'x'], 'kubestellar-mcp'],
    [['console', 'x'], 'console'],
  ])('passes projectId for slug %j to buildPageMap and SidebarContainer', async (slug, projectId) => {
    const { sidebar } = await render(slug)
    expect(buildPageMapMock).toHaveBeenCalledTimes(1)
    expect(buildPageMapMock).toHaveBeenCalledWith(projectId)
    expect(sidebar.props.projectId).toBe(projectId)
  })

  it('falls back to kubestellar for unknown or empty slugs', async () => {
    const unknown = await render(['no-such-project', 'intro'])
    expect(buildPageMapMock).toHaveBeenLastCalledWith('kubestellar')
    expect(unknown.sidebar.props.projectId).toBe('kubestellar')

    const empty = await render([])
    expect(buildPageMapMock).toHaveBeenLastCalledWith('kubestellar')
    expect(empty.sidebar.props.projectId).toBe('kubestellar')
  })

  it('renders SidebarContainer with Meta nodes stripped recursively', async () => {
    const { sidebar } = await render(['kubeflex', 'guide'])
    expect(isValidElement(sidebar)).toBe(true)
    expect(sidebar.type).toBe(SidebarContainer)
    expect(sidebar.props.pageMap).toEqual([
      { name: 'guide', route: '/docs/guide', children: [{ name: 'install', route: '/docs/guide/install' }] },
      { name: 'intro', route: '/docs/intro' },
    ])
  })

  it('does not mutate the pageMap returned by buildPageMap', async () => {
    const before = JSON.stringify(PAGE_MAP)
    await render(['kubeflex'])
    expect(JSON.stringify(PAGE_MAP)).toBe(before)
  })

  it('renders children inside the content wrapper', async () => {
    const child = <main data-testid="child">hello</main>
    const { wrapper } = await render(['console', 'x'], child)
    expect(wrapper.props.children).toBe(child)
  })

  it('handles an empty pageMap', async () => {
    buildPageMapMock.mockReturnValue({ pageMap: [] })
    const { sidebar } = await render(['a2a'])
    expect(sidebar.props.pageMap).toEqual([])
  })
})
