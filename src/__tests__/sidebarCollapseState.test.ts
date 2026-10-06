import { describe, it, expect } from 'vitest'
import {
  computeInitialCollapsedState,
  getFirstChildRoute,
  getGeneralSectionSlugFromPath,
  getGeneralSections,
  getProjectItems,
  LEGACY_GROUP_KEY,
  PROJECT_KEY_PREFIX,
  type MenuItem,
} from '../components/docs/sidebarCollapseState'
import { ALL_PROJECTS, LEGACY_PROJECTS, PRIMARY_PROJECTS } from '../components/docs/sidebarProjects'

const primaryId = PRIMARY_PROJECTS[0].id
const legacyId = LEGACY_PROJECTS[0]?.id

function buildPageMap(): MenuItem[] {
  return [
    {
      name: 'overview',
      route: '/docs/overview',
    },
    {
      name: 'guide',
      children: [
        { name: 'intro', route: '/docs/guide/intro' },
        { name: 'advanced', route: '/docs/guide/advanced' },
      ],
    },
    { name: 'Contributing', route: '/docs/contributing' },
    { name: 'Community', route: '/docs/community' },
    { name: 'News', route: '/docs/news' },
  ]
}

describe('getProjectItems / getGeneralSections', () => {
  it('splits general sections (Contributing/Community/News) from project items', () => {
    const pageMap = buildPageMap()
    const projectItems = getProjectItems(pageMap)
    const generalSections = getGeneralSections(pageMap)

    expect(projectItems.map(i => i.name)).toEqual(['overview', 'guide'])
    expect(generalSections.map(i => i.name)).toEqual(['Contributing', 'Community', 'News'])
  })
})

describe('getGeneralSectionSlugFromPath', () => {
  it('extracts the slug for a general-section path', () => {
    expect(getGeneralSectionSlugFromPath('/docs/community')).toBe('community')
    expect(getGeneralSectionSlugFromPath('/docs/community/foo')).toBe('community')
  })

  it('returns null for a non-general-section path', () => {
    expect(getGeneralSectionSlugFromPath('/docs/console/overview')).toBeNull()
  })
})

describe('getFirstChildRoute', () => {
  it('finds the first navigable route, skipping Meta/Separator and placeholder routes', () => {
    const item: MenuItem = {
      name: 'folder',
      children: [
        { name: 'meta', kind: 'Meta' },
        { name: 'placeholder', route: '#' },
        { name: 'page', route: '/docs/page' },
      ],
    }
    expect(getFirstChildRoute(item)).toBe('/docs/page')
  })

  it('recurses into nested children', () => {
    const item: MenuItem = {
      name: 'folder',
      children: [{ name: 'nested', children: [{ name: 'deep', route: '/docs/deep' }] }],
    }
    expect(getFirstChildRoute(item)).toBe('/docs/deep')
  })

  it('returns undefined when there is nothing navigable', () => {
    expect(getFirstChildRoute({ name: 'empty' })).toBeUndefined()
  })
})

describe('computeInitialCollapsedState', () => {
  it('collapses every project section except the active one', () => {
    const result = computeInitialCollapsedState(buildPageMap(), primaryId, '/docs/overview')

    for (const proj of ALL_PROJECTS) {
      const key = `${PROJECT_KEY_PREFIX}${proj.id}`
      if (proj.id === primaryId) {
        expect(result.has(key)).toBe(false)
      } else {
        expect(result.has(key)).toBe(true)
      }
    }
  })

  it('collapses every project section (including the active one) on /docs/introduction', () => {
    const result = computeInitialCollapsedState(buildPageMap(), primaryId, '/docs/introduction')
    expect(result.has(`${PROJECT_KEY_PREFIX}${primaryId}`)).toBe(true)
  })

  it('collapses the legacy group when the active project is not a legacy project', () => {
    const result = computeInitialCollapsedState(buildPageMap(), primaryId, '/docs/overview')
    expect(result.has(LEGACY_GROUP_KEY)).toBe(true)
  })

  it('leaves the legacy group expanded when the active project is a legacy project', () => {
    if (!legacyId) return // no legacy projects configured — nothing to assert
    const result = computeInitialCollapsedState(buildPageMap(), legacyId, '/docs/overview')
    expect(result.has(LEGACY_GROUP_KEY)).toBe(false)
  })

  it('expands the folder on the path to the active page, collapses its siblings', () => {
    const result = computeInitialCollapsedState(buildPageMap(), primaryId, '/docs/guide/intro')
    const activeParentKey = `${PROJECT_KEY_PREFIX}${primaryId}`
    const folderKey = `${activeParentKey}-guide`

    // Folder containing the active page must stay expanded.
    expect(result.has(folderKey)).toBe(false)
  })

  it('collapses general sections other than the one being viewed', () => {
    const result = computeInitialCollapsedState(buildPageMap(), primaryId, '/docs/community')

    expect(result.has('Contributing')).toBe(true)
    expect(result.has('News')).toBe(true)
    expect(result.has('Community')).toBe(false)
  })

  it('collapses all general sections when not viewing one', () => {
    const result = computeInitialCollapsedState(buildPageMap(), primaryId, '/docs/overview')

    expect(result.has('Contributing')).toBe(true)
    expect(result.has('Community')).toBe(true)
    expect(result.has('News')).toBe(true)
  })
})
