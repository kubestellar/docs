"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ChevronRight, ChevronDown, Moon, Sun, PanelLeftOpen } from 'lucide-react';
import { useSharedConfig } from '@/hooks/useSharedConfig';

// Production URL - all cross-project links go here
const PRODUCTION_URL = 'https://kubestellar.io';

// Generic fallback for related projects - uses safe URLs that won't break
// The actual project list is fetched from production config
const STATIC_RELATED_PROJECTS = [
  { title: 'Console', href: '/docs/console', description: 'AI-enabled multi-cluster management' },
  { title: 'Loading projects...', href: '/docs', description: 'Fetching from config' },
];

interface LegacyMenuItem {
  name: string;
  route?: string;
  children?: LegacyMenuItem[];
  kind?: string;
}

interface RelatedProjectsProps {
  variant?: 'full' | 'slim';
  onCollapse?: () => void;
  isMobile?: boolean;
  bannerActive?: boolean;
  projectId?: string;
  legacyPageMap?: LegacyMenuItem[];
}

export function RelatedProjects({ variant = 'full', onCollapse, bannerActive = false, legacyPageMap }: RelatedProjectsProps) {
  const [mounted, setMounted] = useState(false);
  const [isProduction, setIsProduction] = useState(true); // Default to true to match SSR
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const pathname = usePathname();
  const { config } = useSharedConfig();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Check if we're on production only after mount
    const checkProduction =
      window.location.hostname === 'kubestellar.io' ||
      window.location.hostname === 'www.kubestellar.io' ||
      window.location.hostname === 'localhost';
    setIsProduction(checkProduction);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  // Text colors based on theme
  const textColor = isDark ? '#e5e7eb' : '#374151'; // gray-200 : gray-700
  const mutedTextColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500

  // Get related projects from config or fallback
  const allProjects = config?.relatedProjects ?? STATIC_RELATED_PROJECTS;
  const activeProjects = allProjects.filter((p) => !('legacy' in p && p.legacy));
  const legacyProjects = allProjects.filter((p) => 'legacy' in p && p.legacy);
  const [legacyExpanded, setLegacyExpanded] = useState(false);

  // Slim variant - icon-only vertical layout
  if (variant === 'slim') {
    if (!mounted) {
      return (
        <div className="shrink-0 flex flex-col items-center gap-2 py-4 min-w-16">
          <div className="w-5 h-5" />
          <div className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div
        className="shrink-0 sticky flex flex-col items-center gap-2 py-4 min-w-16 border-t border-gray-200 dark:border-gray-700"
        suppressHydrationWarning
      >
        {/* Theme Toggle Icon */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title="Change theme"
          className="group p-2 rounded-md hover:font-bold transition-all"
          style={{ color: textColor }}
          suppressHydrationWarning
        >
          <div className="relative w-5 h-5">
            <Moon
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 group-hover:rotate-45 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                }`}
            />
            <Sun
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 group-hover:rotate-45 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                }`}
            />
          </div>
        </button>

        {/* Expand Sidebar Icon */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Expand sidebar"
            className="p-2 rounded-md hover:font-bold transition-all"
            style={{ color: textColor }}
            suppressHydrationWarning
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  // Determine current project from pathname
  // THIS HIGHLIGHTS THE ACTIVE PROJECT IN THE PROJECT LIST IN THE SIDEBAR
  const getCurrentProject = () => {
    if (pathname.startsWith('/docs/console')) return 'Console';
    if (pathname.startsWith('/docs/a2a')) return 'A2A';
    if (pathname.startsWith('/docs/kubeflex')) return 'KubeFlex';
    if (pathname.startsWith('/docs/multi-plugin')) return 'Multi Plugin';
    if (pathname.startsWith('/docs/kubestellar-mcp')) return 'KubeStellar MCP';
    return 'KubeStellar';
  };

  const currentProject = getCurrentProject();

  // Get the full URL for a project link
  // On branch deploys, use absolute URL to production for cross-project links
  const getProjectUrl = (href: string) => {
    if (isProduction) {
      return href;
    }
    return `${PRODUCTION_URL}${href}`;
  };

  return (
    <div className={`shrink-0 px-4 border-t border-gray-200 dark:border-gray-700 ${bannerActive ? 'py-1' : 'py-2'}`}>
      {/* Project links - always visible */}
      <div
        className={`${bannerActive ? 'space-y-0' : 'space-y-1 py-2'}`}
      >
        {activeProjects.map((project: { title: string; href: string; description?: string }) => {
          const isCurrentProject = project.title === currentProject;
          const projectUrl = getProjectUrl(project.href);
          const isHovered = hoveredProject === project.title;

          let bgColor: string | undefined;
          if (isCurrentProject) {
            bgColor = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 246, 255, 1)';
          } else if (isHovered) {
            bgColor = isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(243, 244, 246, 1)';
          } else {
            bgColor = undefined;
          }

          return (
            <a
              key={project.title}
              href={projectUrl}
              suppressHydrationWarning
              className={`block px-3 text-sm rounded-md transition-colors ${bannerActive ? 'py-0.5' : 'py-1.5'} ${isCurrentProject ? 'font-medium' : ''}`}
              style={{
                color: isCurrentProject
                  ? (isDark ? '#60a5fa' : '#2563eb')
                  : textColor,
                backgroundColor: bgColor,
              }}
              onMouseEnter={() => !isCurrentProject && setHoveredProject(project.title)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              {project.title}
            </a>
          );
        })}

        {/* Legacy section - collapsed by default */}
        {legacyProjects.length > 0 && (
          <div className={`${bannerActive ? 'mt-0' : 'mt-2'}`}>
            <button
              onClick={() => setLegacyExpanded(!legacyExpanded)}
              className="flex items-center w-full px-3 py-1 text-xs uppercase tracking-wider transition-colors"
              style={{ color: mutedTextColor }}
            >
              <span>Legacy</span>
              <span className="ml-auto">
                {legacyExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </span>
            </button>
            <div
              className={`
                overflow-hidden transition-all duration-200 ease-in-out
                ${legacyExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              {legacyProjects.map((project: { title: string; href: string; description?: string }) => {
                const isCurrentProject = project.title === currentProject;
                const projectUrl = getProjectUrl(project.href);
                const isHovered = hoveredProject === project.title;

                let bgColor: string | undefined;
                if (isCurrentProject) {
                  bgColor = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 246, 255, 1)';
                } else if (isHovered) {
                  bgColor = isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(243, 244, 246, 1)';
                } else {
                  bgColor = undefined;
                }

                return (
                  <div key={project.title}>
                    <a
                      href={projectUrl}
                      suppressHydrationWarning
                      className={`block px-3 text-sm rounded-md transition-colors ${bannerActive ? 'py-0.5' : 'py-1.5'} ${isCurrentProject ? 'font-medium' : ''}`}
                      style={{
                        color: isCurrentProject
                          ? (isDark ? '#60a5fa' : '#2563eb')
                          : mutedTextColor,
                        backgroundColor: bgColor,
                      }}
                      onMouseEnter={() => !isCurrentProject && setHoveredProject(project.title)}
                      onMouseLeave={() => setHoveredProject(null)}
                    >
                      {project.title}
                    </a>
                    {/* Render legacy project nav items inline */}
                    {isCurrentProject && legacyPageMap && legacyPageMap.length > 0 && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700/50 pl-2">
                        {legacyPageMap.map((item) => (
                          <a
                            key={item.name}
                            href={item.route || '#'}
                            className="block px-2 py-1 text-xs rounded transition-colors"
                            style={{ color: mutedTextColor }}
                          >
                            {item.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
