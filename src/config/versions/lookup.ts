import { NETLIFY_SITE_NAME, PRODUCTION_URL } from "./constants"
import type { ProjectConfig, ProjectId, VersionInfo } from "./types"
import { A2A_VERSIONS } from "./data/a2a"
import { CONSOLE_VERSIONS } from "./data/console"
import { KUBEFLEX_VERSIONS } from "./data/kubeflex"
import { KUBESTELLAR_MCP_VERSIONS } from "./data/kubestellar-mcp"
import { KUBESTELLAR_VERSIONS } from "./data/kubestellar"
import { MULTI_PLUGIN_VERSIONS } from "./data/multi-plugin"

// All projects configuration
export const PROJECTS: Record<ProjectId, ProjectConfig> = {
  kubestellar: {
    id: "kubestellar",
    name: "KubeStellar",
    basePath: "",
    currentVersion: "0.30.0",
    contentPath: "docs/content",
    versions: KUBESTELLAR_VERSIONS,
  },
  a2a: {
    id: "a2a",
    name: "A2A",
    basePath: "a2a",
    currentVersion: "0.1.0",
    contentPath: "docs/content/a2a",
    versions: A2A_VERSIONS,
  },
  kubeflex: {
    id: "kubeflex",
    name: "KubeFlex",
    basePath: "kubeflex",
    currentVersion: "0.9.3",
    contentPath: "docs/content/kubeflex",
    versions: KUBEFLEX_VERSIONS,
  },
  "multi-plugin": {
    id: "multi-plugin",
    name: "Multi Plugin",
    basePath: "multi-plugin",
    currentVersion: "0.1.0",
    contentPath: "docs/content/multi-plugin",
    versions: MULTI_PLUGIN_VERSIONS,
  },
  "kubestellar-mcp": {
    id: "kubestellar-mcp",
    name: "KubeStellar MCP",
    basePath: "kubestellar-mcp",
    currentVersion: "0.9.15",
    contentPath: "docs/content/kubestellar-mcp",
    versions: KUBESTELLAR_MCP_VERSIONS,
  },
  "console": {
    id: "console",
    name: "Console",
    basePath: "console",
    currentVersion: "0.3.41",
    contentPath: "docs/content/console",
    versions: CONSOLE_VERSIONS,
  },
}

// Get project from URL pathname
export function getProjectFromPath(pathname: string): ProjectConfig {
  if (pathname.startsWith("/docs/a2a")) {
    return PROJECTS.a2a
  }
  if (pathname.startsWith("/docs/kubeflex")) {
    return PROJECTS.kubeflex
  }
  if (pathname.startsWith("/docs/multi-plugin")) {
    return PROJECTS["multi-plugin"]
  }
  if (pathname.startsWith("/docs/kubestellar-mcp") || pathname.startsWith("/docs/related-projects/kubestellar-mcp")) {
    return PROJECTS["kubestellar-mcp"]
  }
  if (pathname.startsWith("/docs/console")) {
    return PROJECTS["console"]
  }
  return PROJECTS.kubestellar
}

// Get project by ID
export function getProject(projectId: ProjectId): ProjectConfig {
  return PROJECTS[projectId]
}

// Get all projects
export function getAllProjects(): ProjectConfig[] {
  return Object.values(PROJECTS)
}

// ============================================
// Backwards-compatible exports for KubeStellar
// ============================================

export const CURRENT_VERSION = PROJECTS.kubestellar.currentVersion
export const VERSIONS = KUBESTELLAR_VERSIONS

export type VersionKey = keyof typeof KUBESTELLAR_VERSIONS

export function getDefaultVersion(): VersionKey {
  return "latest"
}

export function getCurrentVersion(): string {
  return CURRENT_VERSION
}

export function getBranchForVersion(version: VersionKey): string {
  return KUBESTELLAR_VERSIONS[version]?.branch ?? "main"
}

export function getVersionFromBranch(branch: string): VersionKey | null {
  // Check if branch matches docs/{version} pattern
  const match = branch.match(/^docs\/(.+)$/)
  if (match) {
    const versionNum = match[1]
    // Find version entry with matching branch
    for (const [key, value] of Object.entries(KUBESTELLAR_VERSIONS)) {
      if (value.branch === branch || key === versionNum) {
        return key as VersionKey
      }
    }
  }

  // Check for main branch
  if (branch === "main" || branch === "master") {
    return "latest"
  }

  return null
}

export function getAllVersions(): Array<{ key: VersionKey } & VersionInfo> {
  return Object.entries(KUBESTELLAR_VERSIONS).map(([key, value]) => ({
    key: key as VersionKey,
    ...value,
  }))
}

// Helper to validate if a branch name follows version convention
export function isVersionBranch(branch: string): boolean {
  return branch === "main" || branch.startsWith("docs/")
}

// Get the URL for a specific version (project-aware)
export function getVersionUrl(
  versionKey: string,
  pathname: string = "/docs",
  projectId: ProjectId = "kubestellar"
): string {
  const project = PROJECTS[projectId]
  const version = project.versions[versionKey]

  if (!version) {
    return `${PRODUCTION_URL}${pathname}`
  }

  // If it has an external URL (like legacy), use that
  if ("externalUrl" in version && version.externalUrl) {
    return version.externalUrl
  }

  // Latest version uses production URL
  if (versionKey === "latest" || version.isDefault) {
    return `${PRODUCTION_URL}${pathname}`
  }

  // Other versions use Netlify branch deploys
  // Netlify converts branch names: docs/0.28.0 -> docs-0-28-0
  const branchSlug = version.branch.replace(/\//g, "-").replace(/\./g, "-")
  return `https://${branchSlug}--${NETLIFY_SITE_NAME}.netlify.app${pathname}`
}

// Get versions for a specific project
export function getProjectVersions(
  projectId: ProjectId
): Array<{ key: string } & VersionInfo> {
  const project = PROJECTS[projectId]
  return Object.entries(project.versions).map(([key, value]) => ({
    key,
    ...value,
  }))
}

// Check if a version has been migrated (branch exists)
export function isVersionMigrated(
  versionKey: string,
  projectId: ProjectId = "kubestellar"
): boolean {
  const project = PROJECTS[projectId]

  // Latest is always available
  if (versionKey === "latest") return true

  // Legacy links externally, so it's "available"
  if (versionKey === "legacy") return true

  // For other versions, assume they exist if in the versions list
  return versionKey in project.versions
}
