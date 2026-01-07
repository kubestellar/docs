"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';

interface MenuItem {
  name: string;
  route?: string;
  title?: string;
  children?: MenuItem[];
  frontMatter?: any;
  kind?: string;
}

interface DocsSidebarProps {
  pageMap: MenuItem[];
}

export function DocsSidebar({ pageMap }: DocsSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Auto-expand the active category
  useEffect(() => {
    const newCollapsed = new Set<string>();
    
    function checkActive(items: MenuItem[], parentKey: string = ''): boolean {
      for (const item of items) {
        const itemKey = parentKey ? `${parentKey}-${item.name}` : item.name;
        const isActive = item.route && pathname === item.route;
        
        if (isActive && parentKey) {
          // Don't collapse parent of active item
          return true;
        }
        
        if (item.children) {
          const childActive = checkActive(item.children, itemKey);
          if (!childActive) {
            newCollapsed.add(itemKey);
          } else if (parentKey) {
            return true;
          }
        } else if (!isActive) {
          newCollapsed.add(itemKey);
        }
      }
      return false;
    }
    
    checkActive(pageMap);
    setCollapsed(newCollapsed);
  }, [pathname, pageMap]);

  const toggleCollapse = (itemKey: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
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
      <div key={itemKey} className="relative space-y-1">
        <div className="flex items-center group relative">
          {/* Vertical line for nested items */}
          {depth > 0 && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
              style={{ left: `${(depth - 1) * 16 + 20}px` }}
            />
          )}
          
          {/* Folder or Page */}
          {hasChildren ? (
            // Folder - clickable to toggle
            <button
              onClick={() => toggleCollapse(itemKey)}
              className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left w-full relative z-10"
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <span className="truncate">{displayTitle}</span>
              <span className="ml-auto shrink-0">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </span>
            </button>
          ) : (
            // Page - clickable link with icon
            <Link
              href={item.route || '#'}
              className={`
                flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors relative z-10
                ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{displayTitle}</span>
            </Link>
          )}
        </div>

        {/* Render children */}
        {hasChildren && !isCollapsed && (
          <div className="relative space-y-1">
            {/* Vertical line connecting children */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
              style={{ left: `${depth * 16 + 20}px` }}
            />
            {item.children!.map(child => renderMenuItem(child, depth + 1, itemKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="p-4 w-full space-y-2">
      {pageMap.map(item => renderMenuItem(item))}
    </nav>
  );
}
