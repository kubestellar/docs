import type { VersionInfo } from "../types"

// KubeStellar versions (existing)
export const KUBESTELLAR_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.30.0 (Latest)",
    branch: "docs/0.30.0",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
    isDev: true,
  },
  "0.29.0": {
    label: "v0.29.0",
    branch: "docs/0.29.0",
    isDefault: false,
  },
  "0.28.0": {
    label: "v0.28.0",
    branch: "docs/0.28.0",
    isDefault: false,
  },
  "0.27.2": {
    label: "v0.27.2",
    branch: "docs/0.27.2",
    isDefault: false,
  },
  "0.27.1": {
    label: "v0.27.1",
    branch: "docs/0.27.1",
    isDefault: false,
  },
  "0.27.0": {
    label: "v0.27.0",
    branch: "docs/0.27.0",
    isDefault: false,
  },
  "0.26.0": {
    label: "v0.26.0",
    branch: "docs/0.26.0",
    isDefault: false,
  },
  "0.25.1": {
    label: "v0.25.1",
    branch: "docs/0.25.1",
    isDefault: false,
  },
  "0.25.0": {
    label: "v0.25.0",
    branch: "docs/0.25.0",
    isDefault: false,
  },
  "0.24.0": {
    label: "v0.24.0",
    branch: "docs/0.24.0",
    isDefault: false,
  },
  "0.23.1": {
    label: "v0.23.1",
    branch: "docs/0.23.1",
    isDefault: false,
  },
  "0.23.0": {
    label: "v0.23.0",
    branch: "docs/0.23.0",
    isDefault: false,
  },
  "0.22.0": {
    label: "v0.22.0",
    branch: "docs/0.22.0",
    isDefault: false,
  },
  "0.21.2": {
    label: "v0.21.2",
    branch: "docs/0.21.2",
    isDefault: false,
  },
  "0.21.1": {
    label: "v0.21.1",
    branch: "docs/0.21.1",
    isDefault: false,
  },
  "0.21.0": {
    label: "v0.21.0",
    branch: "docs/0.21.0",
    isDefault: false,
  },
  legacy: {
    label: "Older Versions",
    branch: "legacy",
    isDefault: false,
    externalUrl: "https://kubestellar.github.io/kubestellar",
  },
}
