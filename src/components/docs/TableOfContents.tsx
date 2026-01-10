"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface TOCItem {
  id: string;
  value: string;
  depth: number;
}

interface TableOfContentsProps {
  toc?: TOCItem[];
}

export function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!toc || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '0px 0px -80% 0px',
        threshold: 1.0,
      }
    );

    // Observe all heading elements
    toc.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [toc]);

  if (!toc || toc.length === 0) {
    return null;
  }

  return (
    <aside 
      className="hidden xl:block w-64 overflow-y-auto"
      style={{
        position: 'sticky',
        top: 'calc(var(--nextra-navbar-height, 4rem) + var(--nextra-banner-height, 0px))',
        height: 'calc(100vh - var(--nextra-navbar-height, 4rem) - var(--nextra-banner-height, 0px))',
        borderLeft: resolvedTheme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb',
      }}
    >
      <div className="p-4">
        <h3 
          className="text-sm font-semibold mb-4"
          style={{
            color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827',
          }}
        >
          On This Page
        </h3>
        <nav className="space-y-2">
          {toc.map((item) => {
            const isActive = activeId === item.id;
            const indent = (item.depth - 2) * 12; // depth 2 = h2, depth 3 = h3, etc.

            return (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="block py-1.5 text-sm transition-colors border-l-2"
                style={{
                  paddingLeft: `${indent + 12}px`,
                  borderColor: isActive 
                    ? (resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb')
                    : 'transparent',
                  color: isActive
                    ? (resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb')
                    : (resolvedTheme === 'dark' ? '#9ca3af' : '#374151'),
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827';
                    e.currentTarget.style.borderColor = resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = resolvedTheme === 'dark' ? '#9ca3af' : '#374151';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {item.value}
              </Link>
            );
          })}
        </nav>

        {/* Back to top link */}
        <div 
          className="mt-8 pt-4 border-t"
          style={{
            borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#e5e7eb',
          }}
        >
          <Link
            href="#"
            className="text-xs hover:underline"
            style={{
              color: resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb',
            }}
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            ↑ Back to top
          </Link>
        </div>
      </div>
    </aside>
  );
}
