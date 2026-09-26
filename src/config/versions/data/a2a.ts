import type { VersionInfo } from "../types"

// a2a versions
export const A2A_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.1.0 (Latest)",
    branch: "docs/a2a/0.1.0",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
    isDev: true,
  },
}
