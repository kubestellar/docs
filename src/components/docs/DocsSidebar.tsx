"use client";

import { useState, useEffect, useRef } from 'react';
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
  const navRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [maxHeight, setMaxHeight] = useState<string>('auto');

  // Calculate max height accounting for footer
  useEffect(() => {
    const calculateHeight = () => {
      if (navRef.current) {
        const parent = navRef.current.parentElement;
        if (parent) {
          const parentHeight = parent.clientHeight;
          // Find the footer element (next sibling of parent or last child of grandparent)
          const footer = parent.nextElementSibling;
          const footerHeight = footer ? footer.clientHeight : 0;
          const availableHeight = parentHeight - footerHeight;
          setMaxHeight(`${availableHeight}px`);
        }
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    // Use MutationObserver to recalculate if footer size changes
    const observer = new MutationObserver(calculateHeight);
    if (navRef.current?.parentElement?.parentElement) {
      observer.observe(navRef.current.parentElement.parentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
      observer.disconnect();
    };
  }, []);

  // Auto-expand only the folders that contain the active page
  useEffect(() => {
    const newCollapsed = new Set<string>();
    const pathToActive = new Set<string>();
    
    // Find the path to the active item
    function findActivePath(items: MenuItem[], parentKey: string = ''): boolean {
      for (const item of items) {
        const itemKey = parentKey ? `${parentKey}-${item.name}` : item.name;
        const isActive = item.route && pathname === item.route;
        
        if (isActive) {
          // Found the active item, don't collapse any parent in the path
          return true;
        }
        
        if (item.children) {
          const childActive = findActivePath(item.children, itemKey);
          if (childActive) {
            // This folder contains the active item, keep it expanded
            pathToActive.add(itemKey);
            return true;
          }
        }
      }
      return false;
    }
    
    // Collapse all folders except those in the active path
    function collapseAll(items: MenuItem[], parentKey: string = '') {
      for (const item of items) {
        const itemKey = parentKey ? `${parentKey}-${item.name}` : item.name;
        const hasChildren = item.children && item.children.length > 0;
        
        if (hasChildren) {
          // Collapse this folder if it's not in the path to active item
          if (!pathToActive.has(itemKey)) {
            newCollapsed.add(itemKey);
          }
          // Recursively check children
          if (item.children) {
            collapseAll(item.children, itemKey);
          }
        }
      }
    }
    
    findActivePath(pageMap);
    collapseAll(pageMap);
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
              className="flex-1 flex items-start gap-2 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left w-full relative z-10"
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <span className="flex-1 wrap-break-word">{displayTitle}</span>
              <span className="ml-auto shrink-0 mt-0.5">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                )}
              </span>
            </button>
          ) : (
            // Page - clickable link with icon
            <Link
              href={item.route || '#'}
              className={`
                flex-1 flex items-start gap-2 px-3 py-2 text-sm rounded-lg transition-colors relative z-10
                ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <FileText className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 wrap-break-word">{displayTitle}</span>
            </Link>
          )}
        </div>

        {/* Render children */}
        {hasChildren && (
          <div 
            className={`
              relative space-y-1 overflow-hidden transition-all duration-300 ease-in-out
              ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-500 opacity-100'}
            `}
          >
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
    <nav 
      ref={navRef}
      className="p-4 pb-6 w-full space-y-2" 
      style={{ maxHeight }}
    >
      {pageMap.map(item => renderMenuItem(item))}
    </nav>
  );
}
