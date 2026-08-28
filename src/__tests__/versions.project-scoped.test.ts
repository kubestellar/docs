import { describe, it, expect } from 'vitest'
import {
  getVersionUrl,
  isVersionMigrated,
  PRODUCTION_URL,
  NETLIFY_SITE_NAME,
} from '../config/versions'

// Targeted branch guards for the project-scoped arms of
// getVersionUrl / isVersionMigrated in src/config/versions.ts.
//
// The existing suite (versions.test.ts) exercises these functions
// only for the default `kubestellar` project; the previously-added
// versions.external-url.test.ts covers the legacy `externalUrl`
// arm. What still slips through unnoticed:
//
//   * getVersionUrl called against a non-kubestellar project such
//     as a2a — a copy-paste that mis-scoped project lookups (e.g.
//     always reading from PROJECTS.kubestellar.versions instead of
//     PROJECTS[projectId].versions) would pass every current test.
//   * getVersionUrl's default `projectId` parameter (used when the
//     caller only passes versionKey + pathname); a rename of the
//     default arm to a different project id would go undetected.
//   * isVersionMigrated's default `projectId` parameter, ditto.

describe('getVersionUrl — non-kubestellar project routing', () => {
  it('routes a2a "main" through the Netlify branch deploy URL', () => {
    // In the a2a project, `main` is a non-latest, non-external
    // version whose branch is literally "main". This forces the
    // final arm of getVersionUrl (branch-slug + netlify.app) with a
    // non-kubestellar project id.
    const url = getVersionUrl('main', '/docs/a2a/anything', 'a2a')
    expect(url).toContain('.netlify.app')
    expect(url).toContain(NETLIFY_SITE_NAME)
    expect(url.endsWith('/docs/a2a/anything')).toBe(true)
    // branchSlug for `main` is just `main` (no slashes/dots).
    expect(url).toContain('main--')
  })

  it('routes a2a "latest" to the production URL', () => {
    // a2a.latest has isDefault: true → production URL arm, but
    // scoped through PROJECTS.a2a rather than PROJECTS.kubestellar.
    const url = getVersionUrl('latest', '/docs/a2a', 'a2a')
    expect(url).toBe(`${PRODUCTION_URL}/docs/a2a`)
  })

  it('unknown version key on a non-kubestellar project falls through to production', () => {
    // Ensures the `if (!version)` guard reads PROJECTS[projectId].versions,
    // not the kubestellar-scoped map.
    const url = getVersionUrl('does-not-exist', '/docs/a2a', 'a2a')
    expect(url).toBe(`${PRODUCTION_URL}/docs/a2a`)
  })
})

describe('getVersionUrl / isVersionMigrated — default projectId argument', () => {
  it('getVersionUrl defaults projectId to "kubestellar" when omitted', () => {
    // Calling with only versionKey + pathname must be equivalent to
    // explicitly passing "kubestellar". Guards against a rename of
    // the default-value literal in the function signature.
    const implicit = getVersionUrl('latest', '/docs')
    const explicit = getVersionUrl('latest', '/docs', 'kubestellar')
    expect(implicit).toBe(explicit)
    expect(implicit).toBe(`${PRODUCTION_URL}/docs`)
  })

  it('isVersionMigrated defaults projectId to "kubestellar" when omitted', () => {
    const implicit = isVersionMigrated('latest')
    const explicit = isVersionMigrated('latest', 'kubestellar')
    expect(implicit).toBe(explicit)
    expect(implicit).toBe(true)
  })
})
