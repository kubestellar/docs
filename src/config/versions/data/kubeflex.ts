import type { VersionInfo } from "../types"

// kubeflex versions
export const KUBEFLEX_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.9.5 (Latest)",
    branch: "docs/kubeflex/0.9.5",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
    isDev: true,
  },
  "0.9.4": {
    label: "v0.9.4",
    branch: "docs/kubeflex/0.9.4",
    isDefault: false,
  },
  "0.9.3": {
    label: "v0.9.3",
    branch: "docs/kubeflex/0.9.3",
    isDefault: false,
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
