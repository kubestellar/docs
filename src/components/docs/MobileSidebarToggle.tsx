"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useDocsMenu } from './DocsProvider';

interface MobileHeaderProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  filePath?: string;
  projectId?: string;
}

export function MobileHeader({ onToggleSidebar, pageTitle, filePath, projectId }: MobileHeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { dismissBanner } = useDocsMenu();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build breadcrumb from pathname: '/docs/console/features/dashboards' -> 'Docs > Console > Features > Dashboards'
  const getBreadcrumb = () => {
    // Special case for docs introduction page
    if (pathname === '/docs/introduction') return 'Docs > Guide';

    // Remove '/docs/' prefix and split into parts
    const match = pathname.match(/^\/docs\/(.+)$/);
    if (!match) return 'Docs';

    const parts = match[1]
      .split('/')
      .map(part =>
        // Convert kebab-case and underscores to title case
        part
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );

    return ['Docs', ...parts].join(' > ');
  };

  const handleToggle = () => {
    // Dismiss the banner when opening the sidebar on mobile
    dismissBanner();
    onToggleSidebar();
  };

  // Prevent hydration mismatch by not applying theme-specific styles until mounted
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <div className="lg:hidden">
      <button
        onClick={handleToggle}
        className="flex items-center py-3 focus:outline-none transition-colors w-full gap-3"
        aria-label="Open sidebar"
        style={{
          color: isHovered
            ? (isDark ? '#f3f4f6' : '#111827')
            : (isDark ? '#9ca3af' : '#6b7280'),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        suppressHydrationWarning
      >
        {/* Book icon + Hamburger icon container */}
        <div className="flex items-center gap-2">
          {/* Book icon */}
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>

          {/* Hamburger icon */}
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>

        <span className="text-sm font-medium flex-1 text-left truncate">
          {getBreadcrumb()}
        </span>

        {/* Chevron icon */}
        <svg
          className="w-5 h-5 rotate-90 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
