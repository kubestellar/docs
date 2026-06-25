import { describe, it, expect } from 'vitest'
import {
  getVersionsForProject,
  getProjectInfo,
  getEditUrl,
  getSurveyUrl,
  type SharedConfig,
  type VersionInfo,
} from '../hooks/useSharedConfig'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockConfig: SharedConfig = {
  versions: {
    kubestellar: {
      latest: { label: 'v0.30.0 (Latest)', branch: 'docs/0.30.0', isDefault: true },
      main: { label: 'main (dev)', branch: 'main', isDefault: false, isDev: true },
    },
    a2a: {
      latest: { label: 'v0.1.0 (Latest)', branch: 'docs/a2a/0.1.0', isDefault: true },
    },
  },
  projects: {
    kubestellar: { name: 'KubeStellar', basePath: '', currentVersion: '0.30.0' },
    a2a: { name: 'A2A', basePath: 'a2a', currentVersion: '0.1.0' },
  },
  relatedProjects: [
    { title: 'KubeFlex', href: '/docs/kubeflex' },
  ],
  editBaseUrls: {
    kubestellar: 'https://github.com/kubestellar/docs/edit/main/docs/content',
    a2a: 'https://github.com/kubestellar/docs/edit/main/docs/content/a2a',
  },
  surveyUrl: 'https://example.com/survey',
  updatedAt: '2026-06-25T12:00:00Z',
}

// ---------------------------------------------------------------------------
// getVersionsForProject
// ---------------------------------------------------------------------------

describe('getVersionsForProject', () => {
  it('returns versions array for a known project', () => {
    const versions = getVersionsForProject(mockConfig, 'kubestellar')
    expect(versions).toHaveLength(2)
    expect(versions[0].key).toBe('latest')
    expect(versions[0].label).toBe('v0.30.0 (Latest)')
  })

  it('returns empty array for unknown project', () => {
    expect(getVersionsForProject(mockConfig, 'nonexistent')).toEqual([])
  })

  it('returns empty array when config is null', () => {
    expect(getVersionsForProject(null, 'kubestellar')).toEqual([])
  })

  it('each version entry has key and VersionInfo fields', () => {
    const versions = getVersionsForProject(mockConfig, 'a2a')
    expect(versions).toHaveLength(1)
    expect(versions[0]).toEqual({
      key: 'latest',
      label: 'v0.1.0 (Latest)',
      branch: 'docs/a2a/0.1.0',
      isDefault: true,
    })
  })
})

// ---------------------------------------------------------------------------
// getProjectInfo
// ---------------------------------------------------------------------------

describe('getProjectInfo', () => {
  it('returns project info for a known project', () => {
    const info = getProjectInfo(mockConfig, 'kubestellar')
    expect(info).toEqual({
      name: 'KubeStellar',
      basePath: '',
      currentVersion: '0.30.0',
    })
  })

  it('returns null for unknown project', () => {
    expect(getProjectInfo(mockConfig, 'nonexistent')).toBeNull()
  })

  it('returns null when config is null', () => {
    expect(getProjectInfo(null, 'kubestellar')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getEditUrl
// ---------------------------------------------------------------------------

describe('getEditUrl', () => {
  it('constructs edit URL for known project', () => {
    const url = getEditUrl(mockConfig, 'kubestellar', 'getting-started/install.md')
    expect(url).toBe(
      'https://github.com/kubestellar/docs/edit/main/docs/content/getting-started/install.md'
    )
  })

  it('strips leading slash from filePath', () => {
    const url = getEditUrl(mockConfig, 'kubestellar', '/getting-started/install.md')
    expect(url).toBe(
      'https://github.com/kubestellar/docs/edit/main/docs/content/getting-started/install.md'
    )
  })

  it('returns null for unknown project', () => {
    expect(getEditUrl(mockConfig, 'nonexistent', 'file.md')).toBeNull()
  })

  it('returns null when config is null', () => {
    expect(getEditUrl(null, 'kubestellar', 'file.md')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getSurveyUrl
// ---------------------------------------------------------------------------

describe('getSurveyUrl', () => {
  it('returns surveyUrl from config', () => {
    expect(getSurveyUrl(mockConfig)).toBe('https://example.com/survey')
  })

  it('returns fallback when config is null', () => {
    expect(getSurveyUrl(null)).toBe('https://kubestellar.io/survey')
  })

  it('returns fallback when surveyUrl is undefined', () => {
    const configWithout = { ...mockConfig, surveyUrl: undefined }
    expect(getSurveyUrl(configWithout)).toBe('https://kubestellar.io/survey')
  })
})
