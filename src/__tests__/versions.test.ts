import { describe, it, expect } from 'vitest'
import {
  getProjectFromPath,
  getProject,
  getAllProjects,
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

  it('returns hive for /docs/hive paths', () => {
    expect(getProjectFromPath('/docs/hive')).toHaveProperty('id', 'hive')
  })

  it('defaults to kubestellar for unknown paths', () => {
    expect(getProjectFromPath('/unknown')).toHaveProperty('id', 'kubestellar')
    expect(getProjectFromPath('/')).toHaveProperty('id', 'kubestellar')
    expect(getProjectFromPath('')).toHaveProperty('id', 'kubestellar')
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

describe('getDefaultVersion', () => {
  it('returns "latest"', () => {
    expect(getDefaultVersion()).toBe('latest')
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

  it('converts branch slashes and dots to hyphens in URL', () => {
    // docs/0.28.0 -> docs-0-28-0
    const url = getVersionUrl('0.28.0', '/docs')
    expect(url).toContain('docs-0-28-0')
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
})
