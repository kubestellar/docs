/**
 * Shape invariants for src/config/versions.ts::PROJECTS.
 *
 * PROJECTS is the single source of truth for every per-project version
 * dropdown, canonical URL, edit-on-GitHub link, and shared.json snapshot
 * (via scripts/generate-shared-config.ts). A silent drift in one entry
 * — a mismatched `id` key, a `latest` entry that no longer carries
 * `isDefault: true`, a `currentVersion` that no longer matches the
 * `latest` label after a bump — ships broken navigation or a wrong-version
 * badge to every reader without any test today catching it.
 *
 * The behavioral tests in versions.test.ts exercise helpers against
 * KubeStellar's data; these tests instead assert cross-project shape rules
 * that must hold for EVERY project in PROJECTS.
 */
import { describe, it, expect } from 'vitest'
import { PROJECTS, type ProjectId } from '../config/versions'

const projectEntries = Object.entries(PROJECTS) as [ProjectId, typeof PROJECTS[ProjectId]][]

describe('PROJECTS shape invariants', () => {
  // -----------------------------------------------------------------
  // Identity: PROJECTS[key].id must equal the map key. getProject(id)
  // returns PROJECTS[id], and getAllProjects().find(p => p.id === x)
  // would silently miss a project whose id drifted from its key.
  // -----------------------------------------------------------------
  it.each(projectEntries)('%s: project.id equals its map key', (key, project) => {
    expect(project.id).toBe(key)
  })

  // -----------------------------------------------------------------
  // Every project MUST expose a `latest` version key. The docs router
  // (getDefaultVersion, getBranchForVersion, getVersionUrl) treats
  // 'latest' as the canonical default; a project missing it would
  // render an undefined branch and 404 its own home page.
  // -----------------------------------------------------------------
  it.each(projectEntries)('%s: has a "latest" version entry', (_key, project) => {
    expect(project.versions.latest).toBeDefined()
  })

  // -----------------------------------------------------------------
  // The `latest` entry must be the isDefault=true entry. The dropdown
  // pre-selects the isDefault version; if it drifts off `latest`, the
  // user lands on an older version by default.
  // -----------------------------------------------------------------
  it.each(projectEntries)('%s: latest.isDefault is true', (_key, project) => {
    expect(project.versions.latest.isDefault).toBe(true)
  })

  // -----------------------------------------------------------------
  // The `latest` label must end with " (Latest)". Both the version
  // dropdown and the version badge parse this suffix to render the
  // "Latest" tag; a missing suffix removes the tag site-wide for that
  // project without any other symptom.
  // -----------------------------------------------------------------
  it.each(projectEntries)(
    '%s: latest.label ends with " (Latest)"',
    (_key, project) => {
      expect(project.versions.latest.label.endsWith(' (Latest)')).toBe(true)
    },
  )

  // -----------------------------------------------------------------
  // Exactly ONE version per project has isDefault=true. Two defaults
  // makes the dropdown selection non-deterministic (first-wins depends
  // on Object.entries iteration order); zero defaults means no version
  // is pre-selected.
  // -----------------------------------------------------------------
  it.each(projectEntries)(
    '%s: exactly one version has isDefault=true',
    (_key, project) => {
      const defaults = Object.values(project.versions).filter(v => v.isDefault)
      expect(defaults).toHaveLength(1)
    },
  )

  // -----------------------------------------------------------------
  // `project.currentVersion` must appear inside `latest.label`. This
  // catches the class of bug where a release bump updates the label
  // but forgets `currentVersion` (or vice versa), which would ship a
  // "v0.30.0 (Latest)" dropdown while the badge and canonical URL
  // still say 0.29.0.
  // Loose substring match tolerates the optional "v" prefix used by
  // some projects (hive: currentVersion="v4", label="v4 (Latest)").
  // -----------------------------------------------------------------
  it.each(projectEntries)(
    '%s: currentVersion appears in latest.label',
    (_key, project) => {
      expect(project.versions.latest.label).toContain(project.currentVersion)
    },
  )

  // -----------------------------------------------------------------
  // basePath ↔ contentPath consistency. `contentPath` tells the docs
  // page loader where to read markdown from; `basePath` tells the
  // router where to serve it. If they disagree, URLs are served from
  // the wrong tree (or 404).
  //   - kubestellar has basePath="" and contentPath="docs/content".
  //   - Every other project has contentPath="docs/content/<basePath>".
  // -----------------------------------------------------------------
  it.each(projectEntries)(
    '%s: contentPath matches basePath convention',
    (_key, project) => {
      if (project.basePath === '') {
        expect(project.contentPath).toBe('docs/content')
      } else {
        expect(project.contentPath).toBe(`docs/content/${project.basePath}`)
      }
    },
  )

  // -----------------------------------------------------------------
  // Every version flagged as isDev must live on `main`. `isDev` is
  // what the badge uses to render the "dev" tag; a dev version that
  // actually points to a frozen release branch would show "dev" for
  // stable content, misleading contributors about what they can edit.
  // -----------------------------------------------------------------
  it.each(projectEntries)(
    '%s: every isDev version has branch="main"',
    (_key, project) => {
      const devs = Object.entries(project.versions).filter(([, v]) => v.isDev)
      for (const [, v] of devs) {
        expect(v.branch).toBe('main')
      }
    },
  )

  // -----------------------------------------------------------------
  // Every version's label must be a non-empty string, and every
  // branch must be a non-empty string. The dropdown, edit link, and
  // Netlify URL construction all silently produce broken output on
  // empty strings rather than throwing.
  // -----------------------------------------------------------------
  it.each(projectEntries)(
    '%s: every version has non-empty label and branch',
    (_key, project) => {
      for (const [key, v] of Object.entries(project.versions)) {
        expect(v.label, `${key}.label`).toMatch(/\S/)
        expect(v.branch, `${key}.branch`).toMatch(/\S/)
      }
    },
  )
})
