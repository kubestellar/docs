/**
 * Pure helpers extracted from generate-shared-config.ts.
 *
 * Keeping these side-effect-free (no fs/network access) lets the vitest
 * suite exercise the versions/projects transformation and the
 * preserve-existing-fields merge logic directly, without invoking the CLI
 * script's dynamic import of versions/index.ts or touching the filesystem.
 * The main script re-imports and reuses them.
 *
 * Filed under kubestellar/docs#7428.
 */
import type { ProjectConfig } from "../src/config/versions/types"

export type VersionEntry = {
  label: string
  branch: string
  isDefault: boolean
  externalUrl?: string
  isDev?: boolean
}

export interface ExistingSharedConfig {
  surveyUrl?: string
  relatedProjects?: unknown[]
  editBaseUrls?: Record<string, string>
  [key: string]: unknown
}

export type ProjectSummary = {
  name: string
  basePath: string
  currentVersion: string
}

/**
 * Build the `versions` and `projects` maps that shared.json exposes, from
 * the PROJECTS config (the single source of truth in src/config/versions/).
 */
export function buildVersionsAndProjects(
  projectsConfig: Record<string, ProjectConfig>,
): {
  versions: Record<string, Record<string, VersionEntry>>
  projects: Record<string, ProjectSummary>
} {
  const versions: Record<string, Record<string, VersionEntry>> = {}
  const projects: Record<string, ProjectSummary> = {}

  for (const [id, project] of Object.entries(projectsConfig)) {
    versions[id] = Object.fromEntries(
      Object.entries(project.versions).map(([key, v]) => {
        const entry: VersionEntry = {
          label: v.label,
          branch: v.branch,
          isDefault: v.isDefault,
        }
        if (v.externalUrl) entry.externalUrl = v.externalUrl
        if (v.isDev) entry.isDev = v.isDev
        return [key, entry]
      }),
    )

    projects[id] = {
      name: project.name,
      basePath: project.basePath,
      currentVersion: project.currentVersion,
    }
  }

  return { versions, projects }
}

/**
 * Derive editBaseUrls from the kubestellar project's `latest` branch,
 * falling back to whatever is already in shared.json (e.g. hand-maintained
 * URLs for external repos) when there is nothing to derive.
 */
export function deriveEditBaseUrls(
  existingEditBaseUrls: Record<string, string> | undefined,
  kubestellarLatestBranch: string | undefined,
): Record<string, string> {
  const editBaseUrls: Record<string, string> = { ...(existingEditBaseUrls ?? {}) }
  if (kubestellarLatestBranch) {
    editBaseUrls.kubestellar = `https://github.com/kubestellar/docs/edit/${kubestellarLatestBranch}/docs/content`
  }
  return editBaseUrls
}

/**
 * Assemble the final shared.json payload, preserving hand-maintained fields
 * (surveyUrl, relatedProjects) from the existing file so this script never
 * overwrites content it doesn't own. `now` is injected for deterministic
 * testing of `updatedAt`.
 */
export function mergeSharedConfig(
  existing: ExistingSharedConfig,
  versions: Record<string, Record<string, VersionEntry>>,
  projects: Record<string, ProjectSummary>,
  editBaseUrls: Record<string, string>,
  now: Date = new Date(),
): Record<string, unknown> {
  return {
    surveyUrl: existing.surveyUrl,
    versions,
    projects,
    relatedProjects: existing.relatedProjects ?? [],
    editBaseUrls,
    updatedAt: now.toISOString(),
  }
}

/** Parse an existing shared.json file's contents; returns {} for empty/missing input. */
export function parseExistingSharedConfig(raw: string | undefined): ExistingSharedConfig {
  if (!raw) return {}
  return JSON.parse(raw) as ExistingSharedConfig
}
