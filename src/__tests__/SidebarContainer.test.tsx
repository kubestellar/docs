// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

import { SidebarContainer } from '@/components/docs/SidebarContainer'

/**
 * Coverage for src/components/docs/SidebarContainer.tsx (baseline 0%).
 *
 * SidebarContainer is a thin wrapper around DocsSidebar. It has one job:
 * forward `pageMap` and `projectId` unchanged. Mock DocsSidebar so the
 * wrapper's prop-forwarding is the only surface asserted here — the real
 * DocsSidebar has its own dedicated tests (DocsSidebar.render.test.tsx).
 */

vi.mock('@/components/docs/DocsSidebar', () => ({
  DocsSidebar: (props: Record<string, unknown>) => (
    <div data-testid="docs-sidebar-mock" data-props={JSON.stringify(props)} />
  ),
}))

describe('SidebarContainer', () => {
  afterEach(() => cleanup())

  it('forwards pageMap and projectId to DocsSidebar unchanged', () => {
    const pageMap = [
      { name: 'index', route: '/', title: 'Home' },
      { name: 'guide', title: 'Guide', children: [{ name: 'a', route: '/a' }] },
    ]
    const { getByTestId } = render(
      <SidebarContainer pageMap={pageMap} projectId="kubestellar" />,
    )
    const stub = getByTestId('docs-sidebar-mock')
    const props = JSON.parse(stub.getAttribute('data-props') ?? '{}')
    expect(props.projectId).toBe('kubestellar')
    expect(props.pageMap).toEqual(pageMap)
  })

  it('accepts an empty pageMap', () => {
    const { getByTestId } = render(
      <SidebarContainer pageMap={[]} projectId="kubestellar" />,
    )
    const props = JSON.parse(
      getByTestId('docs-sidebar-mock').getAttribute('data-props') ?? '{}',
    )
    expect(props.pageMap).toEqual([])
  })
})
