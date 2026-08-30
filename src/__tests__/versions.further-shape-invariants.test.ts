/**
 * Further PROJECTS shape invariants that versions.shape-invariants.test.ts
 * doesn't cover.
 *
 * versions.shape-invariants.test.ts locks `id ↔ key`, the presence and
 * defaults of the `latest` entry, `currentVersion ↔ latest.label`,
 * `contentPath ↔ basePath`, and the isDev → branch=main direction. Three
 * further per-project shape rules are enforced by other parts of the code
 * but not by any test today:
 *
 *   1. **Branch uniqueness within a project.** getBranchForVersion and
 *      getVersionUrl look up the branch via the version key, but
 *      getVersionFromBranch does the reverse. If two version keys map to
 *      the same branch, getVersionFromBranch returns whichever entry
 *      Object.entries iterates first — a silent content-collision that
 *      only manifests when the "wrong" key wins in the version dropdown.
 *
 *   2. **`main` key ⇒ branch === 'main'.** versions.shape-invariants
 *      checks the isDev → branch=main direction; nothing checks the
 *      inverse. A `main` key whose branch drifts to `docs/0.29.0` would
 *      route the "dev" dropdown selection to a frozen release branch
 *      without any symptom other than a subtle content mismatch.
 *
 *   3. **`externalUrl`, when present, is a well-formed absolute URL.**
 *      versions.external-url.test.ts covers the KubeStellar `legacy`
 *      fixture but not the general rule. getVersionUrl returns
 *      `externalUrl` verbatim; a relative path or empty string would
 *      render as an in-app link that 404s.
 */
import { describe, it, expect } from 'vitest'
import { PROJECTS, type ProjectId } from '../config/versions'

const projectEntries = Object.entries(PROJECTS) as [
  ProjectId,
  typeof PROJECTS[ProjectId],
][]

describe('PROJECTS further shape invariants', () => {
  it.each(projectEntries)(
    '%s: every version branch is unique within the project',
    (_key, project) => {
      const seen = new Map<string, string>()
      for (const [k, v] of Object.entries(project.versions)) {
        if (v.externalUrl) continue // external entries don't use branch
        const prev = seen.get(v.branch)
        expect(
          prev,
          `duplicate branch ${JSON.stringify(v.branch)} across version keys ` +
            `${JSON.stringify(prev)} and ${JSON.stringify(k)} — ` +
            'getVersionFromBranch would silently prefer whichever key ' +
            'Object.entries yields first',
        ).toBeUndefined()
        seen.set(v.branch, k)
      }
    },
  )

  it.each(projectEntries)(
    '%s: when a "main" version key exists, its branch is exactly "main"',
    (_key, project) => {
      const main = project.versions.main
      if (main === undefined) return
      expect(
        main.branch,
        'the "main" key is what the dev dropdown selection routes to; ' +
          'if its branch drifts, dev navigates to a frozen release branch',
      ).toBe('main')
    },
  )

  it.each(projectEntries)(
    '%s: every externalUrl is an absolute http(s) URL',
    (_key, project) => {
      for (const [k, v] of Object.entries(project.versions)) {
        if (!v.externalUrl) continue
        expect(
          v.externalUrl,
          `${k}.externalUrl must start with http:// or https:// — ` +
            'getVersionUrl returns it verbatim',
        ).toMatch(/^https?:\/\//)
        expect(() => new URL(v.externalUrl!)).not.toThrow()
      }
    },
  )
})
