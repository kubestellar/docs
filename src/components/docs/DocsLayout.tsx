"use client";

import { ReactNode } from 'react';
import { DocsSidebar } from './DocsSidebar';
import { TableOfContents } from './TableOfContents';
import { ThemeToggle } from './ThemeToggle';
import { useDocsMenu } from './DocsProvider';

interface DocsLayoutProps {
  children: ReactNode;
  pageMap: any[];
  toc?: any[];
  metadata?: any;
}

export function DocsLayout({ children, pageMap, toc, metadata }: DocsLayoutProps) {
  const { menuOpen, toggleMenu } = useDocsMenu();

  return (
    <div className="flex flex-1 relative">
      {/* Sidebar - Self-contained with all logic */}
      <DocsSidebar pageMap={pageMap} />

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Main content area */}
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Article content */}
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </article>
        </div>
      </main>

      {/* Table of Contents - Right sidebar on desktop */}
      <TableOfContents toc={toc} />
    </div>
  );
}
