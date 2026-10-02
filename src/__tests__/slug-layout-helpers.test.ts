import { describe, expect, it } from 'vitest'
import {
  getProjectFromSlug,
  isMetaNode,
  stripMetaNodes,
  type PageMapNode,
} from '@/app/docs/[...slug]/layout-helpers'

describe('getProjectFromSlug', () => {
  it('returns kubestellar for empty slug', () => {
    expect(getProjectFromSlug([])).toBe('kubestellar')
  })

  it('returns kubestellar as the default when the first segment is unknown', () => {
    expect(getProjectFromSlug(['unknown-project', 'intro'])).toBe('kubestellar')
    expect(getProjectFromSlug(['kubestellar', 'intro'])).toBe('kubestellar')
  })

  it.each([
    ['a2a', 'a2a'],
    ['kubeflex', 'kubeflex'],
    ['multi-plugin', 'multi-plugin'],
    ['kubestellar-mcp', 'kubestellar-mcp'],
    ['console', 'console'],
  ] as const)('maps first segment %s to project %s', (segment, projectId) => {
    expect(getProjectFromSlug([segment, 'guide', 'install'])).toBe(projectId)
  })

  it('only inspects the first segment', () => {
    // A nested a2a path under kubeflex must resolve to kubeflex, not a2a.
    expect(getProjectFromSlug(['kubeflex', 'a2a'])).toBe('kubeflex')
  })
})

describe('isMetaNode', () => {
  it('detects raw Meta nodes by kind', () => {
    expect(isMetaNode({ kind: 'Meta', name: '_meta' })).toBe(true)
  })

  it('detects nextra-normalized Meta nodes (data, no name, no route)', () => {
    const node = { data: { intro: 'Introduction' } } as unknown as PageMapNode
    expect(isMetaNode(node)).toBe(true)
  })

  it('does not treat a page node with name+route as Meta', () => {
    expect(isMetaNode({ name: 'intro', route: '/docs/intro' })).toBe(false)
  })

  it('does not treat a folder node (name, no route) as Meta', () => {
    expect(isMetaNode({ name: 'guides' })).toBe(false)
  })

  it('does not treat a node with data+name as Meta (name wins)', () => {
    const node = { name: 'intro', data: { x: 1 } } as unknown as PageMapNode
    expect(isMetaNode(node)).toBe(false)
  })

  it('does not treat a node with data+route as Meta (route wins)', () => {
    const node = {
      route: '/docs/intro',
      data: { x: 1 },
    } as unknown as PageMapNode
    expect(isMetaNode(node)).toBe(false)
  })
})

describe('stripMetaNodes', () => {
  it('returns [] when given a nullish list', () => {
    expect(stripMetaNodes(undefined as unknown as PageMapNode[])).toEqual([])
    expect(stripMetaNodes(null as unknown as PageMapNode[])).toEqual([])
  })

  it('drops top-level Meta nodes but keeps page/folder nodes', () => {
    const nodes: PageMapNode[] = [
      { kind: 'Meta', name: '_meta' },
      { name: 'intro', route: '/docs/intro' },
      { data: { x: 1 } } as unknown as PageMapNode,
      { name: 'guides' },
    ]
    const stripped = stripMetaNodes(nodes)
    expect(stripped).toHaveLength(2)
    expect(stripped.map((n) => n.name)).toEqual(['intro', 'guides'])
  })

  it('recursively strips Meta nodes from children', () => {
    const nodes: PageMapNode[] = [
      {
        name: 'guides',
        children: [
          { kind: 'Meta', name: '_meta' },
          { name: 'quickstart', route: '/docs/guides/quickstart' },
          {
            name: 'advanced',
            children: [
              { data: { ordering: ['a', 'b'] } } as unknown as PageMapNode,
              { name: 'tuning', route: '/docs/guides/advanced/tuning' },
            ],
          },
        ],
      },
    ]
    const stripped = stripMetaNodes(nodes)
    expect(stripped).toHaveLength(1)
    const guides = stripped[0]
    expect(guides.children).toHaveLength(2)
    expect(guides.children?.map((c) => c.name)).toEqual([
      'quickstart',
      'advanced',
    ])
    const advanced = guides.children?.find((c) => c.name === 'advanced')
    expect(advanced?.children).toHaveLength(1)
    expect(advanced?.children?.[0].name).toBe('tuning')
  })

  it('does not mutate the input list or its nested children', () => {
    const nodes: PageMapNode[] = [
      { kind: 'Meta', name: '_meta' },
      {
        name: 'guides',
        children: [
          { kind: 'Meta', name: '_meta' },
          { name: 'quickstart', route: '/docs/guides/quickstart' },
        ],
      },
    ]
    const snapshot = JSON.parse(JSON.stringify(nodes))
    stripMetaNodes(nodes)
    expect(nodes).toEqual(snapshot)
  })

  it('leaves leaf nodes (no children) unchanged', () => {
    const leaf: PageMapNode = { name: 'intro', route: '/docs/intro' }
    const [out] = stripMetaNodes([leaf])
    expect(out).toBe(leaf)
  })
})
