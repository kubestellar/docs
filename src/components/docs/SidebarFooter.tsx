"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, PanelRightOpenIcon } from 'lucide-react';

interface SidebarFooterProps {
  onCollapse: () => void;
}

export function SidebarFooter({ onCollapse }: SidebarFooterProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="shrink-0 sticky bottom-0 z-10 bg-white dark:bg-(--color-dark-bg) border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 py-4 px-4">
        <div className="h-7 w-full" />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="shrink-0 sticky bottom-0 z-10 bg-white dark:bg-(--color-dark-bg) border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 py-4 px-4">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title="Change theme"
        className="cursor-pointer h-7 rounded-md px-2 space-x-3 text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 flex-1"
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
        className="transition cursor-pointer rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Collapse sidebar"
        type="button"
      >
        <PanelRightOpenIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
