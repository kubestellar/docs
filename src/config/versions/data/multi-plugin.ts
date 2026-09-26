import type { VersionInfo } from "../types"

// multi-plugin versions
export const MULTI_PLUGIN_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.1.0 (Latest)",
    branch: "docs/multi-plugin/0.1.0",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
    isDev: true,
  },
}
