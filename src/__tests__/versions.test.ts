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
  PRODUCTION_URL,
  NETLIFY_SITE_NAME,
} from '../config/versions'
import { KUBESTELLAR_VERSIONS } from '../config/versions/data/kubestellar'

// ---------------------------------------------------------------------------
// PROJECTS registry
// ---------------------------------------------------------------------------

describe('PROJECTS registry', () => {
  const expectedIds = ['kubestellar', 'a2a', 'kubeflex', 'multi-plugin', 'kubestellar-mcp', 'console'] as const

  it('contains an entry for every ProjectId', () => {
    for (const id of expectedIds) {
      expect(PROJECTS[id]).toBeDefined()
      expect(PROJECTS[id].id).toBe(id)
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

// ---------------------------------------------------------------------------
// getProjectFromPath — routing-critical: determines active project from URL
// ---------------------------------------------------------------------------

describe('getProjectFromPath', () => {
  it('returns kubestellar for root docs path', () => {
    expect(getProjectFromPath('/docs')).toHaveProperty('id', 'kubestellar')
    expect(getProjectFromPath('/docs/getting-started')).toHaveProperty('id', 'kubestellar')
  })

  it('returns a2a for /docs/a2a paths', () => {
    expect(getProjectFromPath('/docs/a2a')).toHaveProperty('id', 'a2a')
    expect(getProjectFromPath('/docs/a2a/quickstart')).toHaveProperty('id', 'a2a')
  })

  it('returns kubeflex for /docs/kubeflex paths', () => {
    expect(getProjectFromPath('/docs/kubeflex')).toHaveProperty('id', 'kubeflex')
    expect(getProjectFromPath('/docs/kubeflex/install')).toHaveProperty('id', 'kubeflex')
  })

  it('returns multi-plugin for /docs/multi-plugin paths', () => {
    expect(getProjectFromPath('/docs/multi-plugin')).toHaveProperty('id', 'multi-plugin')
  })

  it('returns kubestellar-mcp for /docs/kubestellar-mcp paths', () => {
    expect(getProjectFromPath('/docs/kubestellar-mcp')).toHaveProperty('id', 'kubestellar-mcp')
  })

  it('returns kubestellar-mcp for legacy /docs/related-projects/kubestellar-mcp paths', () => {
    expect(getProjectFromPath('/docs/related-projects/kubestellar-mcp/overview')).toHaveProperty('id', 'kubestellar-mcp')
  })

  it('returns console for /docs/console paths', () => {
    expect(getProjectFromPath('/docs/console')).toHaveProperty('id', 'console')
  })

  // Hive moved to hive.hivecommons.dev; /docs/hive is now a static pointer
  // page with no project arm, so it falls through to the kubestellar default.
  it('falls back to kubestellar for the retired /docs/hive path', () => {
    expect(getProjectFromPath('/docs/hive')).toHaveProperty('id', 'kubestellar')
  })

  it('defaults to kubestellar for unknown paths', () => {
    expect(getProjectFromPath('/unknown')).toHaveProperty('id', 'kubestellar')
    expect(getProjectFromPath('/')).toHaveProperty('id', 'kubestellar')
    expect(getProjectFromPath('')).toHaveProperty('id', 'kubestellar')
  })

  it('is prefix-based, not substring-based (a path containing "a2a" mid-string does not route to a2a)', () => {
    // Guards against a naive .includes() rewrite that would misroute e.g.
    // /docs/kubestellar/a2a-notes into the a2a project.
    expect(getProjectFromPath('/docs/kubestellar/a2a-notes')).toHaveProperty('id', 'kubestellar')
  })
})

// ---------------------------------------------------------------------------
// getProject — project lookup by ID
// ---------------------------------------------------------------------------

describe('getProject', () => {
  it('returns the correct project for each ID', () => {
    expect(getProject('kubestellar').name).toBeTruthy()
    expect(getProject('a2a').id).toBe('a2a')
    expect(getProject('kubeflex').id).toBe('kubeflex')
    expect(getProject('console').id).toBe('console')
  })

  it('returns project with required fields', () => {
    const project = getProject('kubestellar')
    expect(project.id).toBe('kubestellar')
    expect(project.name).toBeTruthy()
    expect(typeof project.currentVersion).toBe('string')
    expect(typeof project.contentPath).toBe('string')
    expect(project.versions).toBeTruthy()
  })

  it('returns the same reference as PROJECTS[id]', () => {
    expect(getProject('a2a')).toBe(PROJECTS.a2a)
    expect(getProject('kubestellar')).toBe(PROJECTS.kubestellar)
  })
})

// ---------------------------------------------------------------------------
// getAllProjects
// ---------------------------------------------------------------------------

describe('getAllProjects', () => {
  it('returns a non-empty array', () => {
    const projects = getAllProjects()
    expect(projects.length).toBeGreaterThan(0)
  })

  it('includes kubestellar', () => {
    const projects = getAllProjects()
    expect(projects.some(p => p.id === 'kubestellar')).toBe(true)
  })

  it('all projects have required fields', () => {
    for (const project of getAllProjects()) {
      expect(project.id).toBeTruthy()
      expect(project.name).toBeTruthy()
      expect(typeof project.basePath).toBe('string')
      expect(project.versions).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// getDefaultVersion / getCurrentVersion
// ---------------------------------------------------------------------------

describe('backwards-compatible KubeStellar exports', () => {
  it('CURRENT_VERSION matches PROJECTS.kubestellar.currentVersion', () => {
    expect(CURRENT_VERSION).toBe(PROJECTS.kubestellar.currentVersion)
    expect(getCurrentVersion()).toBe(CURRENT_VERSION)
  })

  it('VERSIONS is the KubeStellar versions map', () => {
    expect(VERSIONS).toBe(KUBESTELLAR_VERSIONS)
  })
})

describe('getDefaultVersion', () => {
  it('returns "latest"', () => {
    expect(getDefaultVersion()).toBe('latest')
    expect(VERSIONS.latest).toBeDefined()
    expect(VERSIONS.latest.isDefault).toBe(true)
  })
})

describe('getCurrentVersion', () => {
  it('returns a non-empty version string', () => {
    const version = getCurrentVersion()
    expect(version).toBeTruthy()
    expect(typeof version).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// getBranchForVersion
// ---------------------------------------------------------------------------

describe('getBranchForVersion', () => {
  it('returns branch for "latest"', () => {
    const branch = getBranchForVersion('latest')
    expect(branch).toBeTruthy()
    expect(branch).toContain('docs/')
  })

  it('returns branch for "main"', () => {
    expect(getBranchForVersion('main')).toBe('main')
  })

  it('returns the branch recorded for every known version', () => {
    for (const [key, info] of Object.entries(KUBESTELLAR_VERSIONS)) {
      expect(getBranchForVersion(key as keyof typeof KUBESTELLAR_VERSIONS)).toBe(info.branch)
    }
  })

  it('returns "main" for unknown version key', () => {
    // Unknown versions fall back to main
    expect(getBranchForVersion('nonexistent' as any)).toBe('main')
  })
})

// ---------------------------------------------------------------------------
// getVersionFromBranch — reverse mapping
// ---------------------------------------------------------------------------

describe('getVersionFromBranch', () => {
  it('returns "latest" for main branch', () => {
    expect(getVersionFromBranch('main')).toBe('latest')
  })

  it('returns "latest" for master branch', () => {
    expect(getVersionFromBranch('master')).toBe('latest')
  })

  it('returns version key for docs/ branch', () => {
    const result = getVersionFromBranch('docs/0.30.0')
    expect(result).not.toBeNull()
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

  it('returns null for unrecognized branches', () => {
    expect(getVersionFromBranch('feature/my-feature')).toBeNull()
    expect(getVersionFromBranch('fix/bug')).toBeNull()
    expect(getVersionFromBranch('')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getAllVersions
// ---------------------------------------------------------------------------

describe('getAllVersions', () => {
  it('returns non-empty array', () => {
    const versions = getAllVersions()
    expect(versions.length).toBeGreaterThan(0)
  })

  it('each version has key, label, and branch', () => {
    for (const v of getAllVersions()) {
      expect(v.key).toBeTruthy()
      expect(v.label).toBeTruthy()
      expect(v.branch).toBeTruthy()
      expect(typeof v.isDefault).toBe('boolean')
    }
  })

  it('includes a default version', () => {
    const versions = getAllVersions()
    expect(versions.some(v => v.isDefault)).toBe(true)
  })

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

// ---------------------------------------------------------------------------
// isVersionBranch
// ---------------------------------------------------------------------------

describe('isVersionBranch', () => {
  it('accepts "main"', () => {
    expect(isVersionBranch('main')).toBe(true)
  })

  it('accepts docs/ prefix branches', () => {
    expect(isVersionBranch('docs/0.28.0')).toBe(true)
    expect(isVersionBranch('docs/0.30.0')).toBe(true)
  })

  it('rejects feature branches', () => {
    expect(isVersionBranch('feature/new-feature')).toBe(false)
    expect(isVersionBranch('fix/bug-fix')).toBe(false)
    expect(isVersionBranch('release/1.0')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isVersionBranch('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getVersionUrl — URL generation for Netlify branch deploys
// ---------------------------------------------------------------------------

describe('getVersionUrl', () => {
  it('returns production URL for latest version', () => {
    const url = getVersionUrl('latest', '/docs')
    expect(url).toBe(`${PRODUCTION_URL}/docs`)
  })

  it('returns Netlify branch deploy URL for non-latest versions', () => {
    const url = getVersionUrl('0.28.0', '/docs/getting-started')
    expect(url).toContain(NETLIFY_SITE_NAME)
    expect(url).toContain('.netlify.app')
    expect(url).toContain('/docs/getting-started')
  })

  it('returns production URL for unknown version key', () => {
    const url = getVersionUrl('nonexistent-version', '/docs')
    expect(url).toBe(`${PRODUCTION_URL}/docs`)
  })

  it('returns PRODUCTION_URL + pathname for any isDefault version', () => {
    // Find the default entry per project; that entry must resolve to production.
    for (const project of getAllProjects()) {
      const defaultKey = Object.entries(project.versions).find(([, v]) => v.isDefault)?.[0]
      if (!defaultKey) continue
      expect(getVersionUrl(defaultKey, '/docs', project.id)).toBe(`${PRODUCTION_URL}/docs`)
    }
  })

  it('uses externalUrl when present on the version entry', () => {
    // KubeStellar's "legacy" entry pins an externalUrl; guard the invariant
    // rather than the specific URL string (which is data, not logic).
    const legacy = KUBESTELLAR_VERSIONS.legacy
    if (legacy && 'externalUrl' in legacy && legacy.externalUrl) {
      expect(getVersionUrl('legacy', '/anything-ignored', 'kubestellar')).toBe(legacy.externalUrl)
    }
  })

  it('converts branch slashes and dots to hyphens in URL', () => {
    // docs/0.28.0 -> docs-0-28-0
    const url = getVersionUrl('0.28.0', '/docs')
    expect(url).toContain('docs-0-28-0')
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

// ---------------------------------------------------------------------------
// getProjectVersions
// ---------------------------------------------------------------------------

describe('getProjectVersions', () => {
  it('returns versions for kubestellar', () => {
    const versions = getProjectVersions('kubestellar')
    expect(versions.length).toBeGreaterThan(0)
    expect(versions.some(v => v.key === 'latest')).toBe(true)
  })

  it('returns versions for a2a', () => {
    const versions = getProjectVersions('a2a')
    expect(versions.length).toBeGreaterThan(0)
  })

  it('each version has key and label', () => {
    for (const v of getProjectVersions('kubestellar')) {
      expect(v.key).toBeTruthy()
      expect(v.label).toBeTruthy()
    }
  })

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

// ---------------------------------------------------------------------------
// isVersionMigrated
// ---------------------------------------------------------------------------

describe('isVersionMigrated', () => {
  it('"latest" is always migrated', () => {
    expect(isVersionMigrated('latest')).toBe(true)
  })

  it('"legacy" is always migrated', () => {
    expect(isVersionMigrated('legacy')).toBe(true)
  })

  it('known version is migrated', () => {
    expect(isVersionMigrated('0.28.0', 'kubestellar')).toBe(true)
  })

  it('unknown version is not migrated', () => {
    expect(isVersionMigrated('99.99.99', 'kubestellar')).toBe(false)
  })

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

  it('returns false for a version key that is not in any project versions map', () => {
    expect(isVersionMigrated('does-not-exist', 'a2a')).toBe(false)
  })

  it('defaults projectId to "kubestellar" when omitted', () => {
    expect(isVersionMigrated('latest')).toBe(true)
    expect(isVersionMigrated('99.99.99')).toBe(false)
  })
})
