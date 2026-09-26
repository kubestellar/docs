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
