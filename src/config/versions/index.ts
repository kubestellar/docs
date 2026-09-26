// Multi-project versions config
// Supports KubeStellar, a2a, and kubeflex with independent versioning
//
// Versioning Strategy:
// - Each project has its own version scheme
// - Branch naming convention:
//   - KubeStellar: main (latest), docs/{version} (e.g., docs/0.28.0)
//   - a2a: main (latest), docs/a2a/{version} (e.g., docs/a2a/0.1.0)
//   - kubeflex: main (latest), docs/kubeflex/{version} (e.g., docs/kubeflex/0.8.0)
// - The main branch always contains the latest version for all projects

export { NETLIFY_SITE_NAME, PRODUCTION_URL } from "./constants"

export type { ProjectId, VersionInfo, ProjectConfig } from "./types"

export {
  PROJECTS,
  getProjectFromPath,
  getProject,
  getAllProjects,
  CURRENT_VERSION,
  VERSIONS,
  getDefaultVersion,
  getCurrentVersion,
  getBranchForVersion,
  getVersionFromBranch,
  getAllVersions,
  isVersionBranch,
  getVersionUrl,
  getProjectVersions,
  isVersionMigrated,
} from "./lookup"
export type { VersionKey } from "./lookup"
