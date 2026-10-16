/**
 * Unit tests for scripts/generate-shared-config-helpers.ts — the pure
 * versions/projects transformation, editBaseUrls derivation, and
 * preserve-existing-fields merge logic used by
 * scripts/generate-shared-config.ts (the prebuild step that generates
 * public/config/shared.json).
 *
 * Filed under kubestellar/docs#7428.
 */
import { describe, it, expect } from "vitest"
import type { ProjectConfig } from "../src/config/versions/types"
import {
  buildVersionsAndProjects,
  deriveEditBaseUrls,
  mergeSharedConfig,
  parseExistingSharedConfig,
} from "./generate-shared-config-helpers"

function makeProject(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    id: "kubestellar",
    name: "KubeStellar",
    basePath: "",
    currentVersion: "latest",
    contentPath: "docs/content",
    navPath: "docs/content/nav.yaml",
    versions: {
      latest: { label: "Latest", branch: "main", isDefault: true },
    },
    pathPrefixes: [],
    ...overrides,
  } as ProjectConfig
}

describe("buildVersionsAndProjects", () => {
  it("builds versions and projects maps keyed by project id", () => {
    const { versions, projects } = buildVersionsAndProjects({
      kubestellar: makeProject(),
    })

    expect(projects.kubestellar).toEqual({
      name: "KubeStellar",
      basePath: "",
      currentVersion: "latest",
    })
    expect(versions.kubestellar.latest).toEqual({
      label: "Latest",
      branch: "main",
      isDefault: true,
    })
  })

  it("omits externalUrl and isDev when not set on the version", () => {
    const { versions } = buildVersionsAndProjects({ kubestellar: makeProject() })
    expect(versions.kubestellar.latest).not.toHaveProperty("externalUrl")
    expect(versions.kubestellar.latest).not.toHaveProperty("isDev")
  })

  it("includes externalUrl and isDev when present on the version", () => {
    const { versions } = buildVersionsAndProjects({
      kubestellar: makeProject({
        versions: {
          "0.28.0": {
            label: "0.28.0",
            branch: "docs/0.28.0",
            isDefault: false,
            externalUrl: "https://older.example.com",
            isDev: true,
          },
        },
      }),
    })

    expect(versions.kubestellar["0.28.0"]).toEqual({
      label: "0.28.0",
      branch: "docs/0.28.0",
      isDefault: false,
      externalUrl: "https://older.example.com",
      isDev: true,
    })
  })

  it("handles multiple projects independently", () => {
    const { versions, projects } = buildVersionsAndProjects({
      kubestellar: makeProject(),
      a2a: makeProject({ id: "a2a", name: "A2A", basePath: "a2a" }),
    })

    expect(Object.keys(projects).sort()).toEqual(["a2a", "kubestellar"])
    expect(Object.keys(versions).sort()).toEqual(["a2a", "kubestellar"])
    expect(projects.a2a.basePath).toBe("a2a")
  })

  it("returns empty maps for an empty PROJECTS object", () => {
    const { versions, projects } = buildVersionsAndProjects({})
    expect(versions).toEqual({})
    expect(projects).toEqual({})
  })
})

describe("deriveEditBaseUrls", () => {
  it("derives the kubestellar edit URL from the latest branch", () => {
    const result = deriveEditBaseUrls(undefined, "main")
    expect(result.kubestellar).toBe("https://github.com/kubestellar/docs/edit/main/docs/content")
  })

  it("uses the given branch, not a hardcoded default", () => {
    const result = deriveEditBaseUrls(undefined, "docs/0.28.0")
    expect(result.kubestellar).toBe("https://github.com/kubestellar/docs/edit/docs/0.28.0/docs/content")
  })

  it("preserves existing hand-maintained edit URLs for other projects", () => {
    const result = deriveEditBaseUrls({ "external-repo": "https://github.com/other/repo/edit/main" }, "main")
    expect(result["external-repo"]).toBe("https://github.com/other/repo/edit/main")
    expect(result.kubestellar).toBe("https://github.com/kubestellar/docs/edit/main/docs/content")
  })

  it("falls back to whatever already exists when there is no branch to derive from", () => {
    const result = deriveEditBaseUrls({ kubestellar: "https://stale.example.com" }, undefined)
    expect(result.kubestellar).toBe("https://stale.example.com")
  })

  it("returns an empty object when there is nothing existing and nothing to derive", () => {
    expect(deriveEditBaseUrls(undefined, undefined)).toEqual({})
  })
})

describe("parseExistingSharedConfig", () => {
  it("returns an empty object when the file doesn't exist yet (undefined input)", () => {
    expect(parseExistingSharedConfig(undefined)).toEqual({})
  })

  it("returns an empty object for an empty string", () => {
    expect(parseExistingSharedConfig("")).toEqual({})
  })

  it("parses existing JSON content", () => {
    const result = parseExistingSharedConfig('{"surveyUrl":"https://example.com/survey"}')
    expect(result.surveyUrl).toBe("https://example.com/survey")
  })

  it("throws on malformed JSON rather than silently discarding it", () => {
    expect(() => parseExistingSharedConfig("{not json")).toThrow()
  })
})

describe("mergeSharedConfig", () => {
  const versions = { kubestellar: { latest: { label: "Latest", branch: "main", isDefault: true } } }
  const projects = { kubestellar: { name: "KubeStellar", basePath: "", currentVersion: "latest" } }
  const editBaseUrls = { kubestellar: "https://github.com/kubestellar/docs/edit/main/docs/content" }
  const now = new Date("2026-01-01T00:00:00.000Z")

  it("preserves surveyUrl and relatedProjects from the existing config", () => {
    const result = mergeSharedConfig(
      { surveyUrl: "https://example.com/survey", relatedProjects: [{ name: "foo" }] },
      versions,
      projects,
      editBaseUrls,
      now,
    )
    expect(result.surveyUrl).toBe("https://example.com/survey")
    expect(result.relatedProjects).toEqual([{ name: "foo" }])
  })

  it("defaults relatedProjects to an empty array when absent from the existing config", () => {
    const result = mergeSharedConfig({}, versions, projects, editBaseUrls, now)
    expect(result.relatedProjects).toEqual([])
  })

  it("leaves surveyUrl undefined when absent from the existing config (never invents one)", () => {
    const result = mergeSharedConfig({}, versions, projects, editBaseUrls, now)
    expect(result.surveyUrl).toBeUndefined()
  })

  it("always writes the freshly computed versions, projects, and editBaseUrls", () => {
    const result = mergeSharedConfig(
      { versions: { stale: {} }, projects: { stale: {} } } as never,
      versions,
      projects,
      editBaseUrls,
      now,
    )
    expect(result.versions).toBe(versions)
    expect(result.projects).toBe(projects)
    expect(result.editBaseUrls).toBe(editBaseUrls)
  })

  it("stamps updatedAt with the injected clock", () => {
    const result = mergeSharedConfig({}, versions, projects, editBaseUrls, now)
    expect(result.updatedAt).toBe("2026-01-01T00:00:00.000Z")
  })
})
