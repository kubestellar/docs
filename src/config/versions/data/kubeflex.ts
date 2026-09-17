import type { VersionInfo } from "../types"

// kubeflex versions
export const KUBEFLEX_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.9.3 (Latest)",
    branch: "docs/kubeflex/0.9.3",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
    isDev: true,
  },
  "0.8.0": {
    label: "v0.8.0",
    branch: "docs/kubeflex/0.8.0",
    isDefault: false,
  },
  "0.7.0": {
    label: "v0.7.0",
    branch: "docs/kubeflex/0.7.0",
    isDefault: false,
  },
}
