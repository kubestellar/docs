"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useDocsMenu } from './DocsProvider';
import { SidebarFooter } from './SidebarFooter';

interface MenuItem {
  name: string;
  route?: string;
  title?: string;
  children?: MenuItem[];
  frontMatter?: Record<string, unknown>;
  kind?: string;
  theme?: { collapsed?: boolean };
}

interface DocsSidebarProps {
  pageMap: MenuItem[];
  className?: string;
  projectId?: string;
}

// General sections that appear in every project's pageMap — show once at bottom
const GENERAL_SECTION_NAMES = ['Contributing', 'Community', 'News'];

// Project display order and labels — each with a landing href for navigation links
const PRIMARY_PROJECTS = [
  { id: 'console', label: 'KubeStellar Console', href: '/docs/console/overview/introduction' },
  { id: 'kubestellar-mcp', label: 'KubeStellar MCP', href: '/docs/kubestellar-mcp/overview/introduction' },
] as const;

const LEGACY_PROJECTS = [
  { id: 'kubestellar', label: 'KubeStellar', href: '/docs/what-is-kubestellar/overview' },
  { id: 'a2a', label: 'A2A', href: '/docs/a2a/overview/introduction' },
  { id: 'kubeflex', label: 'KubeFlex', href: '/docs/kubeflex/overview/introduction' },
  { id: 'multi-plugin', label: 'Multi Plugin', href: '/docs/multi-plugin/overview/introduction' },
] as const;

// Key prefix for project-level collapse state (avoids collision with nav item keys)
const PROJECT_KEY_PREFIX = '__project_';
const LEGACY_GROUP_KEY = '__legacy';

function getProjectItems(items: MenuItem[]): MenuItem[] {
  return items.filter(item => !GENERAL_SECTION_NAMES.includes(item.name || item.title || ''));
}

function getGeneralSections(items: MenuItem[]): MenuItem[] {
  return items.filter(item => GENERAL_SECTION_NAMES.includes(item.name || item.title || ''));
}

export function DocsSidebar({ pageMap, className, projectId }: DocsSidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const {
    sidebarCollapsed,
    toggleSidebar,
    menuOpen,
    toggleMenu,
    bannerDismissed,
    navCollapsed: collapsed,
    setNavCollapsed: setCollapsed,
    toggleNavCollapsed,
    navInitialized
  } = useDocsMenu();

  // Stable layout values - only recalculate on resize or banner change
  const [layoutValues, setLayoutValues] = useState({ top: '4rem', height: 'calc(100vh - 4rem)' });

  const calculateOffsets = () => {
    const navbar = document.querySelector('.nextra-nav-container') as HTMLElement | null;
    if (!navbar) return;

    const navbarBottomY = navbar.getBoundingClientRect().bottom;

    setLayoutValues({
      top: `${navbarBottomY}px`,
      height: `calc(100vh - ${navbarBottomY}px)`
    });
  };

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          calculateOffsets();
          ticking = false;
        });
      }
    };

    const LAYOUT_INIT_DELAY_MS = 300;
    const t = setTimeout(calculateOffsets, LAYOUT_INIT_DELAY_MS);

    window.addEventListener('resize', calculateOffsets);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', calculateOffsets);
      window.removeEventListener('scroll', onScroll);
    };
  }, [bannerDismissed]);

  // Store initial pathname for initialization
  const initialPathnameRef = useRef(pathname);

  // Initialize collapsed state once on mount
  useEffect(() => {
    if (navInitialized.current) return;
    navInitialized.current = true;

    const initialCollapsed = new Set<string>();
    const pathToActive = new Set<string>();
    const currentPath = initialPathnameRef.current;

    // Determine active project from pathname
    const activeProjectId = projectId || 'console';

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
    const isViewingGeneralSection = currentPath.includes('/contributing') || currentPath.includes('/community') || currentPath.includes('/news');

    for (const section of generalSections) {
      const sectionKey = section.name;
      const isCurrent = isViewingGeneralSection && currentPath.includes('/' + (section.name || '').toLowerCase());
      if (!isCurrent) {
        initialCollapsed.add(sectionKey);
      }
      if (isCurrent && section.children) {
        findActivePath(section.children, sectionKey);
        collapseAll(section.children, sectionKey);
      }
    }

    setCollapsed(initialCollapsed);
  }, [pageMap, projectId, navInitialized, setCollapsed]);

  const toggleCollapse = (itemKey: string) => {
    toggleNavCollapsed(itemKey);
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0, parentKey: string = '') => {
    const hasChildren = item.children && item.children.length > 0;
    const itemKey = parentKey ? `${parentKey}-${item.name}` : item.name;
    const isCollapsed = collapsed.has(itemKey);
    const isActive = item.route && pathname === item.route;
    const displayTitle = item.title || item.name;

    // Skip separator, meta items, and items without title/name
    if (item.kind === 'Separator' || item.kind === 'Meta' || !displayTitle || displayTitle.trim() === '') {
      return null;
    }

    // Skip index files and hidden items
    if (item.name === 'index' || item.name === '_meta' || item.route === '#') {
      return null;
    }

    return (
      <div key={itemKey} className="relative">
        <div className="flex items-center group relative">
          {/* Vertical line for nested items */}
          {depth > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700/50"
              style={{ left: `${(depth - 1) * 16 + 20}px` }}
            />
          )}

          {/* Folder or Page */}
          {hasChildren ? (
            <button
              onClick={() => toggleCollapse(itemKey)}
              className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-normal text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left w-full relative z-10"
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <span className="flex-1 truncate">{displayTitle}</span>
              <span className="ml-auto shrink-0">
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300 transition-transform duration-200" />
                )}
              </span>
            </button>
          ) : (
            <Link
              href={item.route || '#'}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-[13px] rounded-md transition-colors relative z-10 w-full
                ${
                  isActive
                    ? 'font-medium text-blue-600 dark:text-blue-100 bg-blue-50'
                    : 'font-normal text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <FileText
                className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-100' : 'text-gray-500 dark:text-gray-300'}`}
              />
              <span className="flex-1 truncate">{displayTitle}</span>
            </Link>
          )}
        </div>

        {/* Render children */}
        {hasChildren && (
          <div
            className={`
              relative overflow-hidden transition-all duration-300 ease-in-out
              ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
            `}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700/50"
              style={{ left: `${depth * 16 + 20}px` }}
            />
            {item.children!.map(child => renderMenuItem(child, depth + 1, itemKey))}
          </div>
        )}
      </div>
    );
  };

  // Render the active project's nav tree (full expandable tree from pageMap)
  const renderActiveProjectTree = (projId: string, label: string, depth: number = 0) => {
    const items = getProjectItems(pageMap);
    if (items.length === 0) return null;

    const sectionKey = `${PROJECT_KEY_PREFIX}${projId}`;
    const isExpanded = !collapsed.has(sectionKey);

    return (
      <div key={projId} className="relative">
        <button
          onClick={() => toggleCollapse(sectionKey)}
          className="flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-colors text-left w-full font-semibold text-blue-600 dark:text-blue-100 bg-blue-50"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <span className="flex-1 truncate">{label}</span>
          <span className="ml-auto shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
            )}
          </span>
        </button>

        <div
          className={`
            relative overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {items.map(item => renderMenuItem(item, depth + 1, sectionKey))}
        </div>
      </div>
    );
  };

  // Render a non-active project as a navigation link (no tree — loads on click)
  const renderProjectLink = (projId: string, label: string, href: string, depth: number = 0) => {
    return (
      <div key={projId} className="relative">
        <Link
          href={href}
          className="flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-colors text-left w-full font-medium text-gray-800 dark:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <span className="flex-1 truncate">{label}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
        </Link>
      </div>
    );
  };

  // Render a project — full tree if active, navigation link if not
  const renderProject = (proj: { id: string; label: string; href: string }, depth: number = 0) => {
    if (proj.id === projectId) {
      return renderActiveProjectTree(proj.id, proj.label, depth);
    }
    return renderProjectLink(proj.id, proj.label, proj.href, depth);
  };

  // Render the Legacy group with sub-projects
  const renderLegacyGroup = () => {
    const isExpanded = !collapsed.has(LEGACY_GROUP_KEY);
    const isActiveLegacy = LEGACY_PROJECTS.some(p => p.id === projectId);

    return (
      <div className="relative pt-1">
        <button
          onClick={() => toggleCollapse(LEGACY_GROUP_KEY)}
          className={`
            flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-colors text-left w-full font-semibold
            ${isActiveLegacy
              ? 'text-blue-600 dark:text-blue-100 bg-blue-50'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <span>Legacy Components</span>
          <span className="ml-auto shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        </button>

        <div
          className={`
            relative overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {LEGACY_PROJECTS.map(proj => renderProject(proj, 1))}
        </div>
      </div>
    );
  };

  // Render full sidebar (expanded state)
  const renderFullSidebar = () => {
    // General sections (Contributing, Community, News) from current project's pageMap
    const generalSections = getGeneralSections(pageMap);

    return (
      <>
        {/* Mobile close button - visible only on mobile */}
        <div className="lg:hidden flex items-center justify-end px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleMenu}
            className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <nav className="px-3 pt-6 pb-6 w-full">
            {/* Primary projects — active shows tree, others show link */}
            <div className="space-y-1">
              {PRIMARY_PROJECTS.map(proj => renderProject(proj))}
            </div>

            {/* Legacy group */}
            <div className="mt-4">
              {renderLegacyGroup()}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

            {/* General sections — Contributing, Community, News */}
            <div className="space-y-1">
              {generalSections.map(item => renderMenuItem(item))}
            </div>
          </nav>
        </div>
        <SidebarFooter onCollapse={toggleSidebar} isMobile={menuOpen} />
      </>
    );
  };

  // Render slim sidebar (collapsed state) - Desktop only
  const renderSlimSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1"></div>
      <SidebarFooter onCollapse={toggleSidebar} isMobile={menuOpen} variant="slim" />
    </div>
  );

  return (
    <aside
      ref={sidebarRef}
      data-sidebar="docs"
      className={`
        fixed lg:sticky left-0
        shadow-sm dark:shadow-none
        flex flex-col
        overflow-hidden
        transition-all duration-300 ease-in-out
        bg-white dark:bg-black
        border-r border-gray-200 dark:border-gray-800
        ${menuOpen ? 'translate-x-0 w-60 z-30' : '-translate-x-full w-0 lg:translate-x-0 z-20'}
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'}
        ${className || ''}
      `}
      style={{
        top: layoutValues.top,
        height: layoutValues.height,
        maxHeight: layoutValues.height,
        boxShadow: '1px 0 3px 0 rgba(0,0,0,0.04)',
        backgroundColor: 'var(--background)',
      }}
      suppressHydrationWarning
    >
      {/* Full Sidebar Content */}
      <div className={`
        flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        {renderFullSidebar()}
      </div>

      {/* Slim Sidebar Content - Desktop only */}
      <div className={`
        hidden lg:flex flex-col h-full absolute inset-0
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        {renderSlimSidebar()}
      </div>
    </aside>
  );
}
