// Project identifiers
export type ProjectId = "kubestellar" | "a2a" | "kubeflex" | "multi-plugin" | "kubestellar-mcp" | "console"

// Version info structure
export interface VersionInfo {
  label: string
  branch: string
  isDefault: boolean
  externalUrl?: string
  isDev?: boolean // marks development/unreleased versions
}

// Project configuration
export interface ProjectConfig {
  id: ProjectId
  name: string
  basePath: string // '' for kubestellar, 'a2a' for a2a, etc.
  currentVersion: string
  contentPath: string
  /**
   * Repo-relative path of the YAML file that defines this project's sidebar
   * navigation (loaded by src/app/docs/page-map.ts). Entries in that file are
   * paths relative to `contentPath`. Mandatory, like contentPath/basePath, so
   * adding a ProjectId without a nav fails to compile. See kubestellar/docs#7080.
   */
  navPath: string
  versions: Record<string, VersionInfo>
  /**
   * URL path prefixes that route to this project via `getProjectFromPath`.
   * Include the canonical `/docs/<basePath>` mount plus any aliases (e.g.
   * kubestellar-mcp is also mounted at `/docs/related-projects/kubestellar-mcp`).
   * Empty for the `kubestellar` fallback: it is returned whenever no other
   * project's prefixes match.
   */
  pathPrefixes: readonly string[]
}
