import { describe, it, expect } from 'vitest'
import {
  PROJECTS,
  getProjectFromPath,
  getProject,
  getAllProjects,
  CURRENT_VERSION,
  VERSIONS,
  getDefaultVersion,
  getCurrentVersion,
  getBranchForVersion,
  getVersionFromBranch,
  getAllVersions,
  isVersionBranch,
  getVersionUrl,
  getProjectVersions,
  isVersionMigrated,
} from '../config/versions/lookup'
import { NETLIFY_SITE_NAME, PRODUCTION_URL } from '../config/versions/constants'
import { KUBESTELLAR_VERSIONS } from '../config/versions/data/kubestellar'

// ---------------------------------------------------------------------------
// versions/lookup.ts unit tests
//
// lookup.ts is the single source of truth for cross-project version routing:
// every version-selector, edit-page link, canonical URL, and Netlify branch
// deploy URL is resolved through these functions. It had no unit tests, so
// silent drift (renamed project id, changed basePath, a broken pathname
// prefix) would misroute users without CI catching it. These tests pin the
// observable contract: routing prefixes, branch<->version mapping, Netlify
// URL construction, and the "latest"/"legacy" always-migrated invariants.
// ---------------------------------------------------------------------------

describe('PROJECTS registry', () => {
  const expectedIds = ['kubestellar', 'a2a', 'kubeflex', 'multi-plugin', 'kubestellar-mcp', 'console'] as const

  it('contains an entry for every ProjectId', () => {
    for (const id of expectedIds) {
      expect(PROJECTS[id]).toBeDefined()
      expect(PROJECTS[id].id).toBe(id)
    }
  })

  it('every project has a non-empty name, contentPath, currentVersion and a versions map', () => {
    for (const id of expectedIds) {
      const p = PROJECTS[id]
      expect(p.name).toMatch(/\S/)
      expect(p.contentPath).toMatch(/^docs\/content/)
      expect(p.currentVersion).toMatch(/^\d+\.\d+\.\d+/)
      expect(Object.keys(p.versions).length).toBeGreaterThan(0)
    }
  })

  it('only the kubestellar project uses an empty basePath', () => {
    expect(PROJECTS.kubestellar.basePath).toBe('')
    for (const id of expectedIds.filter((x) => x !== 'kubestellar')) {
      expect(PROJECTS[id].basePath).not.toBe('')
    }
  })

  it('basePaths are unique across projects (no routing collisions)', () => {
    const basePaths = expectedIds.map((id) => PROJECTS[id].basePath)
    expect(new Set(basePaths).size).toBe(basePaths.length)
  })
})

describe('getProjectFromPath', () => {
  it('routes /docs/a2a* to a2a', () => {
    expect(getProjectFromPath('/docs/a2a').id).toBe('a2a')
    expect(getProjectFromPath('/docs/a2a/getting-started').id).toBe('a2a')
  })

  it('routes /docs/kubeflex* to kubeflex', () => {
    expect(getProjectFromPath('/docs/kubeflex/overview').id).toBe('kubeflex')
  })

  it('routes /docs/multi-plugin* to multi-plugin', () => {
    expect(getProjectFromPath('/docs/multi-plugin').id).toBe('multi-plugin')
  })

  it('routes /docs/kubestellar-mcp* to kubestellar-mcp', () => {
    expect(getProjectFromPath('/docs/kubestellar-mcp/install').id).toBe('kubestellar-mcp')
  })

  it('routes /docs/related-projects/kubestellar-mcp* to kubestellar-mcp', () => {
    expect(getProjectFromPath('/docs/related-projects/kubestellar-mcp').id).toBe('kubestellar-mcp')
  })

  it('routes /docs/console* to console', () => {
    expect(getProjectFromPath('/docs/console/agents').id).toBe('console')
  })

  it('falls back to kubestellar for the root docs path and unknown paths', () => {
    expect(getProjectFromPath('/docs').id).toBe('kubestellar')
    expect(getProjectFromPath('/').id).toBe('kubestellar')
    expect(getProjectFromPath('/docs/unknown-project').id).toBe('kubestellar')
  })

  it('is prefix-based, not substring-based (a path containing "a2a" mid-string does not route to a2a)', () => {
    // Guards against a naive .includes() rewrite that would misroute e.g.
    // /docs/kubestellar/a2a-notes into the a2a project.
    expect(getProjectFromPath('/docs/kubestellar/a2a-notes').id).toBe('kubestellar')
  })
})

describe('getProject / getAllProjects', () => {
  it('getProject returns the same reference as PROJECTS[id]', () => {
    expect(getProject('a2a')).toBe(PROJECTS.a2a)
    expect(getProject('kubestellar')).toBe(PROJECTS.kubestellar)
  })

  it('getAllProjects returns every registered project', () => {
    const all = getAllProjects()
    expect(all.length).toBe(Object.keys(PROJECTS).length)
    expect(all).toContain(PROJECTS.kubestellar)
    expect(all).toContain(PROJECTS.console)
  })
})

describe('backwards-compatible KubeStellar exports', () => {
  it('CURRENT_VERSION matches PROJECTS.kubestellar.currentVersion', () => {
    expect(CURRENT_VERSION).toBe(PROJECTS.kubestellar.currentVersion)
    expect(getCurrentVersion()).toBe(CURRENT_VERSION)
  })

  it('VERSIONS is the KubeStellar versions map', () => {
    expect(VERSIONS).toBe(KUBESTELLAR_VERSIONS)
  })

  it('getDefaultVersion is "latest" and "latest" exists in VERSIONS', () => {
    expect(getDefaultVersion()).toBe('latest')
    expect(VERSIONS.latest).toBeDefined()
    expect(VERSIONS.latest.isDefault).toBe(true)
  })
})

describe('getBranchForVersion', () => {
  it('returns the branch recorded for a known version', () => {
    for (const [key, info] of Object.entries(KUBESTELLAR_VERSIONS)) {
      expect(getBranchForVersion(key as keyof typeof KUBESTELLAR_VERSIONS)).toBe(info.branch)
    }
  })

  it('falls back to "main" for an unknown version key', () => {
    // Cast through unknown because getBranchForVersion is typed to VersionKey;
    // real callers can still pass a string that fails the lookup at runtime.
    expect(getBranchForVersion('not-a-real-version' as unknown as keyof typeof KUBESTELLAR_VERSIONS)).toBe('main')
  })
})

describe('getVersionFromBranch', () => {
  it('maps "main" and "master" to "latest"', () => {
    expect(getVersionFromBranch('main')).toBe('latest')
    expect(getVersionFromBranch('master')).toBe('latest')
  })

  it('maps a docs/<version> branch back to its version key', () => {
    // Pick a non-latest entry so the "latest" fallback cannot mask a bug.
    const nonLatest = Object.entries(KUBESTELLAR_VERSIONS).find(
      ([key, v]) => key !== 'latest' && key !== 'main' && v.branch.startsWith('docs/'),
    )
    expect(nonLatest, 'expected at least one docs/<version> entry').toBeDefined()
    const [key, info] = nonLatest!
    expect(getVersionFromBranch(info.branch)).toBe(key)
  })

  it('returns null for an unknown branch that is neither main/master nor docs/<known>', () => {
    expect(getVersionFromBranch('feature/xyz')).toBeNull()
    expect(getVersionFromBranch('release-1.0')).toBeNull()
  })
})

describe('getAllVersions', () => {
  it('returns one entry per KUBESTELLAR_VERSIONS key and includes the key on each', () => {
    const all = getAllVersions()
    expect(all.length).toBe(Object.keys(KUBESTELLAR_VERSIONS).length)
    for (const entry of all) {
      expect(entry.key).toBeDefined()
      expect(KUBESTELLAR_VERSIONS[entry.key]).toBeDefined()
      expect(entry.branch).toBe(KUBESTELLAR_VERSIONS[entry.key].branch)
    }
  })
})

describe('isVersionBranch', () => {
  it('accepts "main" and any docs/-prefixed branch', () => {
    expect(isVersionBranch('main')).toBe(true)
    expect(isVersionBranch('docs/0.28.0')).toBe(true)
    expect(isVersionBranch('docs/anything')).toBe(true)
  })

  it('rejects other branch names', () => {
    expect(isVersionBranch('master')).toBe(false)
    expect(isVersionBranch('feature/x')).toBe(false)
    expect(isVersionBranch('')).toBe(false)
  })
})

describe('getVersionUrl', () => {
  it('returns PRODUCTION_URL + pathname for "latest"', () => {
    expect(getVersionUrl('latest', '/docs/install', 'kubestellar')).toBe(`${PRODUCTION_URL}/docs/install`)
  })

  it('returns PRODUCTION_URL + pathname for any isDefault version', () => {
    // Find the default entry per project; that entry must resolve to production.
    for (const project of getAllProjects()) {
      const defaultKey = Object.entries(project.versions).find(([, v]) => v.isDefault)?.[0]
      if (!defaultKey) continue
      expect(getVersionUrl(defaultKey, '/docs', project.id)).toBe(`${PRODUCTION_URL}/docs`)
    }
  })

  it('returns PRODUCTION_URL + pathname (unchanged) when the version key is unknown', () => {
    expect(getVersionUrl('does-not-exist', '/docs/x', 'kubestellar')).toBe(`${PRODUCTION_URL}/docs/x`)
  })

  it('uses externalUrl when present on the version entry', () => {
    // KubeStellar's "legacy" entry pins an externalUrl; guard the invariant
    // rather than the specific URL string (which is data, not logic).
    const legacy = KUBESTELLAR_VERSIONS.legacy
    if (legacy && 'externalUrl' in legacy && legacy.externalUrl) {
      expect(getVersionUrl('legacy', '/anything-ignored', 'kubestellar')).toBe(legacy.externalUrl)
    }
  })

  it('builds a Netlify branch-deploy URL for non-default, non-external versions', () => {
    // Pick a non-default kubestellar version whose branch starts with docs/.
    const nonDefault = Object.entries(KUBESTELLAR_VERSIONS).find(
      ([key, v]) =>
        key !== 'latest' && !v.isDefault && !('externalUrl' in v && v.externalUrl) && v.branch.startsWith('docs/'),
    )
    expect(nonDefault, 'expected a non-default docs/<version> entry').toBeDefined()
    const [key, info] = nonDefault!
    const branchSlug = info.branch.replace(/\//g, '-').replace(/\./g, '-')
    const expected = `https://${branchSlug}--${NETLIFY_SITE_NAME}.netlify.app/docs/x`
    expect(getVersionUrl(key, '/docs/x', 'kubestellar')).toBe(expected)
  })

  it('escapes both slashes and dots in the branch when building the Netlify slug', () => {
    // Explicit lockdown: docs/0.28.0 must become docs-0-28-0 (both replacements
    // applied) — a regression here silently 404s every non-latest doc URL.
    const entry = Object.entries(KUBESTELLAR_VERSIONS).find(
      ([, v]) => v.branch === 'docs/0.28.0' && !v.isDefault,
    )
    if (entry) {
      const [key] = entry
      expect(getVersionUrl(key, '/', 'kubestellar')).toBe(
        `https://docs-0-28-0--${NETLIFY_SITE_NAME}.netlify.app/`,
      )
    }
  })

  it('defaults pathname to "/docs" and projectId to "kubestellar" when omitted', () => {
    expect(getVersionUrl('latest')).toBe(`${PRODUCTION_URL}/docs`)
  })
})

describe('getProjectVersions', () => {
  it('returns one entry per version in the project, each carrying its key', () => {
    for (const project of getAllProjects()) {
      const list = getProjectVersions(project.id)
      expect(list.length).toBe(Object.keys(project.versions).length)
      for (const entry of list) {
        expect(project.versions[entry.key]).toBeDefined()
        expect(entry.branch).toBe(project.versions[entry.key].branch)
      }
    }
  })
})

describe('isVersionMigrated', () => {
  it('always returns true for "latest" and "legacy" regardless of project', () => {
    for (const project of getAllProjects()) {
      expect(isVersionMigrated('latest', project.id)).toBe(true)
      expect(isVersionMigrated('legacy', project.id)).toBe(true)
    }
  })

  it('returns true when the version key exists in the project versions map', () => {
    for (const project of getAllProjects()) {
      for (const key of Object.keys(project.versions)) {
        expect(isVersionMigrated(key, project.id)).toBe(true)
      }
    }
  })

  it('returns false for a version key that is not in the project versions map', () => {
    expect(isVersionMigrated('99.99.99', 'kubestellar')).toBe(false)
    expect(isVersionMigrated('does-not-exist', 'a2a')).toBe(false)
  })

  it('defaults projectId to "kubestellar" when omitted', () => {
    expect(isVersionMigrated('latest')).toBe(true)
    expect(isVersionMigrated('99.99.99')).toBe(false)
  })
})
