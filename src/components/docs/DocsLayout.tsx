"use client";

import { ReactNode } from 'react';
import { TableOfContents } from './TableOfContents';
import { MobileTOC } from './MobileTOC';
import { MobileHeader } from './MobileSidebarToggle';
import { useDocsMenu } from './DocsProvider';
import type { ProjectId } from '@/config/versions';
import { DocsSourceActions } from '@/components/docs/DocsSourceActions';

interface TOCItem {
  id: string;
  value: string;
  depth: number;
}

interface Metadata {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface DocsLayoutProps {
  children: ReactNode;
  toc?: TOCItem[];
  metadata?: Metadata;
  filePath?: string;
  projectId?: ProjectId;
}

export function DocsLayout({ children, toc, metadata, filePath, projectId }: DocsLayoutProps) {
  const { toggleMenu } = useDocsMenu();

  return (
    <>
      {/* Main content area */}
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {/* Page header with edit button */}
          <div className="flex items-center justify-between mb-4">
            {/* Mobile Header with Sidebar Toggle - Only visible on mobile/tablet */}
            <div className="flex-1">
              <MobileHeader onToggleSidebar={toggleMenu} />
            </div>

            {/* Edit page icon - top right */}
            {filePath && projectId && (
              <div className="shrink-0 ml-2">
                <DocsSourceActions
                  filePath={filePath}
                  projectId={projectId}
                  pageTitle={metadata?.title ?? 'Documentation'}
                />
              </div>
            )}
          </div>

          {/* Mobile TOC Accordion - Only visible on mobile/tablet */}
          <MobileTOC toc={toc} />

          {/* Article content */}
          <article
            className="
              prose
              prose-lg
              prose-slate
              dark:prose-invert
              mx-auto
              max-w-none
              prose-headings:scroll-mt-24
              prose-p:leading-8
              prose-li:leading-8
            "
          >
            {children}
          </article>
        </div>
      </main>

      {/* Table of Contents - Right sidebar on desktop */}
      <TableOfContents toc={toc} />
    </>
  );
}
