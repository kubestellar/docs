/**
 * Pure page-map helpers and initial-collapse-state computation extracted
 * from src/components/docs/DocsSidebar.tsx so the active-path/collapse
 * logic can be unit-tested independently of React, next/navigation, and
 * the DOM measurements the component also performs.
 *
 * See src/__tests__/sidebarCollapseState.test.ts for the contract these
 * functions must uphold.
 */
import { ALL_PROJECTS, LEGACY_PROJECTS } from './sidebarProjects';

export interface MenuItem {
  name: string;
  route?: string;
  title?: string;
  children?: MenuItem[];
  frontMatter?: Record<string, unknown>;
  kind?: string;
  theme?: { collapsed?: boolean };
}

// General sections that appear in every project's pageMap — show once at bottom
export const GENERAL_SECTION_SLUGS = ['contributing', 'community', 'news'] as const;
const GENERAL_SECTION_NAMES = GENERAL_SECTION_SLUGS.map(
  (slug) => slug.charAt(0).toUpperCase() + slug.slice(1),
);

// Key prefix for project-level collapse state (avoids collision with nav item keys)
export const PROJECT_KEY_PREFIX = '__project_';
export const LEGACY_GROUP_KEY = '__legacy';
export const GENERAL_SECTION_PATH_REGEX = new RegExp(
  `^/docs/(${GENERAL_SECTION_SLUGS.join('|')})(/|$)`,
);

export function getGeneralSectionSlugFromPath(path: string): string | null {
  const match = path.match(GENERAL_SECTION_PATH_REGEX);
  return match?.[1] ?? null;
}

export function getProjectItems(items: MenuItem[]): MenuItem[] {
  return items.filter(item => !GENERAL_SECTION_NAMES.includes(item.name || item.title || ''));
}

export function getGeneralSections(items: MenuItem[]): MenuItem[] {
  return items.filter(item => GENERAL_SECTION_NAMES.includes(item.name || item.title || ''));
}

// Find the first navigable route in a menu item's children
export function getFirstChildRoute(item: MenuItem): string | undefined {
  if (!item.children) return undefined;
  for (const child of item.children) {
    if (child.kind === 'Meta' || child.kind === 'Separator') continue;
    if (child.route && child.route !== '#') return child.route;
    const nested = getFirstChildRoute(child);
    if (nested) return nested;
  }
  return undefined;
}

/**
 * Compute the sidebar's one-time initial collapse state: which project
 * sections, the legacy group, and which folders/general-sections should
 * start collapsed for a given pageMap/activeProject/currentPath.
 *
 * Mirrors the mount-only `useEffect` previously inlined in DocsSidebar —
 * pure function of its three inputs, no DOM/React dependency.
 */
export function computeInitialCollapsedState(
  pageMap: MenuItem[],
  projectId: string | undefined,
  currentPath: string,
): Set<string> {
  const initialCollapsed = new Set<string>();
  const pathToActive = new Set<string>();

  // Determine active project from pathname
  const activeProjectId = projectId || 'console';

  // Keep non-active project sections collapsed by default
  for (const proj of ALL_PROJECTS) {
    const isProjectLink = currentPath === '/docs/introduction' || proj.id !== activeProjectId;
    if (isProjectLink) {
      initialCollapsed.add(`${PROJECT_KEY_PREFIX}${proj.id}`);
    }
  }

  // Collapse legacy group if active project is not a legacy project
  const legacyIds = LEGACY_PROJECTS.map(p => p.id) as readonly string[];
  if (!legacyIds.includes(activeProjectId)) {
    initialCollapsed.add(LEGACY_GROUP_KEY);
  }

  // For the active project, find the path to the active page and collapse non-active folders
  const activeItems = getProjectItems(pageMap);
  const activeParentKey = `${PROJECT_KEY_PREFIX}${activeProjectId}`;

  function findActivePath(items: MenuItem[], parentKey: string): boolean {
    for (const item of items) {
      const itemKey = `${parentKey}-${item.name}`;
      if (item.route && currentPath === item.route) {
        return true;
      }
      if (item.children) {
        const childActive = findActivePath(item.children, itemKey);
        if (childActive) {
          pathToActive.add(itemKey);
          return true;
        }
      }
    }
    return false;
  }

  function collapseAll(items: MenuItem[], parentKey: string) {
    for (const item of items) {
      const itemKey = `${parentKey}-${item.name}`;
      const hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        const shouldStayExpanded = item.theme?.collapsed === false;
        if (!pathToActive.has(itemKey) && !shouldStayExpanded) {
          initialCollapsed.add(itemKey);
        }
        if (item.children) {
          collapseAll(item.children, itemKey);
        }
      }
    }
  }

  findActivePath(activeItems, activeParentKey);
  collapseAll(activeItems, activeParentKey);

  // Also handle general sections
  const generalSections = getGeneralSections(pageMap);
  const currentGeneralSectionSlug = getGeneralSectionSlugFromPath(currentPath);
  const isViewingGeneralSection = Boolean(currentGeneralSectionSlug);

  for (const section of generalSections) {
    const sectionKey = section.name;
    const sectionSlug = (section.name || section.title || '').toLowerCase();
    const isCurrent = isViewingGeneralSection && sectionSlug === currentGeneralSectionSlug;
    if (!isCurrent) {
      initialCollapsed.add(sectionKey);
    }
    if (isCurrent && section.children) {
      findActivePath(section.children, sectionKey);
      collapseAll(section.children, sectionKey);
    }
  }

  return initialCollapsed;
}
