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
          className="group p-2 rounded-md hover:font-bold transition-all"
          style={{ color: 'var(--foreground)' }}
        >
          <div className="relative w-5 h-5">
            <Moon 
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 group-hover:rotate-45 ${
                isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
              }`}
            />
            <Sun 
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 group-hover:rotate-45 ${
                !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
              }`}
            />
          </div>
        </button>

        {/* Expand Sidebar Icon */}
        <button
          onClick={onCollapse}
          title="Expand sidebar"
          className="p-2 rounded-md hover:font-bold transition-all"
          style={{ color: 'var(--foreground)' }}
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Full variant - horizontal layout with text
  if (!mounted) {
    return (
      <div
        className="shrink-0 sticky bottom-0 z-10 bg-white dark:bg-(--color-dark-bg) flex items-center gap-2 py-4 px-4"
        style={{
          borderTop: resolvedTheme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb',
          boxShadow: '0 -1px 6px 0 rgba(0,0,0,0.07)',
        }}
      >
        <div className="h-7 w-full" />
      </div>
    );
  }

  return (
    <div
      className="shrink-0 sticky bottom-0 z-10 bg-white dark:bg-(--color-dark-bg) flex items-center gap-2 py-4 px-4"
      style={{
        borderTop: resolvedTheme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb',
        boxShadow: '0 -1px 6px 0 rgba(0,0,0,0.07)',
      }}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title="Change theme"
        className="group cursor-pointer h-7 rounded-md px-2 space-x-3 text-sm font-thin transition-all hover:font-bold flex items-center gap-2 flex-1"
        style={{ color: 'var(--foreground)' }}
      >
        <div className="relative w-5 h-5">
          <Moon 
            className={`absolute inset-0 w-5 h-5 transition-all duration-300 group-hover:rotate-45 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          />
          <Sun 
            className={`absolute inset-0 w-5 h-5 transition-all duration-300 group-hover:rotate-45 ${
              !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
            }`}
          />
        </div>
        <span>{isDark ? 'Dark' : 'Light'}</span>
      </button>

      {/* Collapse Sidebar Button */}
      <button
        onClick={onCollapse}
        className="transition-all cursor-pointer rounded-md p-2 hover:font-bold"
        style={{ color: 'var(--foreground)' }}
        title="Collapse sidebar"
        type="button"
      >
        <PanelRightOpenIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
