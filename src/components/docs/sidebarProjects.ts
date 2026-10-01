import type { ProjectId } from "@/config/versions/types";

/**
 * Sidebar presentation metadata for a project, keyed by {@link ProjectId}.
 *
 * `PROJECTS` in `src/config/versions/lookup.ts` carries the canonical registry
 * (id, basePath, versions, contentPath, …). The three fields below are the
 * sidebar-only presentation layer that was previously hard-coded inside
 * `DocsSidebar.tsx` as `PRIMARY_PROJECTS` / `LEGACY_PROJECTS` arrays, which
 * had no way to notice a new `ProjectId` member and already drifted from
 * `PROJECTS[id].name` for `console` (sidebar: "KubeStellar Console",
 * registry: "Console"). See kubestellar/docs#7174, mirrors #7172.
 */
export interface SidebarProjectPresentation {
  /** Label shown on the sidebar project row. */
  label: string;
  /** Landing route the sidebar project row links to. */
  landingPath: string;
  /** Which section of the chooser the project appears in. */
  tier: "primary" | "legacy";
}

/**
 * Single source of truth for sidebar presentation. The `Record<ProjectId, …>`
 * typing forces a compile error if a new `ProjectId` is added to the registry
 * without updating this map — closing the silent-drift path that #7172 closed
 * for the route handlers / sitemap.
 */
export const SIDEBAR_PROJECT_PRESENTATION: Record<
  ProjectId,
  SidebarProjectPresentation
> = {
  console: {
    label: "KubeStellar Console",
    landingPath: "/docs/console/readme",
    tier: "primary",
  },
  "kubestellar-mcp": {
    label: "KubeStellar MCP",
    landingPath: "/docs/kubestellar-mcp/overview/intro",
    tier: "primary",
  },
  kubestellar: {
    label: "KubeStellar",
    landingPath: "/docs/readme",
    tier: "legacy",
  },
  a2a: {
    label: "A2A",
    landingPath: "/docs/a2a/intro",
    tier: "legacy",
  },
  kubeflex: {
    label: "KubeFlex",
    landingPath: "/docs/kubeflex/readme",
    tier: "legacy",
  },
  "multi-plugin": {
    label: "Multi Plugin",
    landingPath: "/docs/multi-plugin/overview/introduction",
    tier: "legacy",
  },
};

/**
 * Row shape consumed by `DocsSidebar.tsx` — kept identical to the previous
 * inline `PRIMARY_PROJECTS` / `LEGACY_PROJECTS` entries to make the diff a
 * pure extraction. The `id` is a `string` literal rather than `ProjectId`
 * because that is what the component uses for comparison with `pageMap` keys
 * built from URL path segments.
 */
export interface SidebarProjectRow {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

/**
 * Project display order within each tier. Order is intentional — the first
 * entry in `PRIMARY_PROJECTS` is the default landing project in the sidebar.
 */
const PROJECT_ORDER: readonly ProjectId[] = [
  "console",
  "kubestellar-mcp",
  "kubestellar",
  "a2a",
  "kubeflex",
  "multi-plugin",
];

function projectsForTier(
  tier: SidebarProjectPresentation["tier"],
): readonly SidebarProjectRow[] {
  return PROJECT_ORDER.filter(
    (id) => SIDEBAR_PROJECT_PRESENTATION[id].tier === tier,
  ).map((id) => ({
    id,
    label: SIDEBAR_PROJECT_PRESENTATION[id].label,
    href: SIDEBAR_PROJECT_PRESENTATION[id].landingPath,
  }));
}

/** Projects shown in the primary section of the sidebar. */
export const PRIMARY_PROJECTS: readonly SidebarProjectRow[] =
  projectsForTier("primary");

/** Projects shown collapsed under the "legacy" group in the sidebar. */
export const LEGACY_PROJECTS: readonly SidebarProjectRow[] =
  projectsForTier("legacy");

/** All projects, in display order (primary first, then legacy). */
export const ALL_PROJECTS: readonly SidebarProjectRow[] = [
  ...PRIMARY_PROJECTS,
  ...LEGACY_PROJECTS,
];
