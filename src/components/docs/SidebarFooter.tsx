"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, PanelRightOpenIcon, PanelLeftOpen } from 'lucide-react';

interface SidebarFooterProps {
  onCollapse: () => void;
  variant?: 'full' | 'slim';
}

export function SidebarFooter({ onCollapse, variant = 'full' }: SidebarFooterProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  // Slim variant - icon-only vertical layout
  if (variant === 'slim') {
    if (!mounted) {
      return (
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 py-4 min-w-16">
          <div className="w-5 h-5" />
          <div className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="shrink-0 sticky border-t border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 py-4 min-w-16">
        {/* Theme Toggle Icon */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title="Change theme"
          className="p-2 rounded-md text-gray-600 dark:text-gray-600 hover:text-white dark:hover:text-white hover:bg-gray-100  dark:hover:bg-transparent transition-colors"
        >
          <div className="relative w-5 h-5">
            <Moon 
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
              }`}
            />
            <Sun 
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
              }`}
            />
          </div>
        </button>

        {/* Expand Sidebar Icon */}
        <button
          onClick={onCollapse}
          title="Expand sidebar"
          className="p-2 rounded-md text-gray-600 dark:text-gray-600 hover:text-white dark:hover:text-white hover:bg-gray-100  dark:hover:bg-transparent transition-colors"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Full variant - horizontal layout with text
  if (!mounted) {
    return (
      <div className="shrink-0 sticky bottom-0 z-10 bg-white dark:bg-(--color-dark-bg) border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 py-4 px-4">
        <div className="h-7 w-full" />
      </div>
    );
  }

  return (
    <div className="shrink-0 sticky bottom-0 z-10 bg-white dark:bg-(--color-dark-bg) border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 py-4 px-4">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title="Change theme"
        className="cursor-pointer h-7 rounded-md px-2 space-x-3 text-sm font-medium transition-colors text-gray-600 dark:text-gray-600 hover:text-white dark:hover:text-white hover:bg-gray-100  dark:hover:bg-transparent flex items-center gap-2 flex-1"
      >
        <div className="relative w-5 h-5">
          <Moon 
            className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          />
          <Sun 
            className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
              !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
            }`}
          />
        </div>
        <span>{isDark ? 'Dark' : 'Light'}</span>
      </button>

      {/* Collapse Sidebar Button */}
      <button
        onClick={onCollapse}
        className="transition cursor-pointer rounded-md p-2 text-gray-600 dark:text-gray-600 hover:text-white dark:hover:text-white hover:bg-gray-100  dark:hover:bg-transparent"
        title="Collapse sidebar"
        type="button"
      >
        <PanelRightOpenIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
