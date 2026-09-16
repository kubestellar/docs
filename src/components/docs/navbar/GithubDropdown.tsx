"use client";

import type { DropdownType, GithubStats } from "./types";

interface GithubDropdownProps {
  isDark: boolean;
  openDropdown: DropdownType;
  githubStats: GithubStats;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDropdownMouseEnter: () => void;
}

/** Desktop GitHub stats dropdown (star/fork/watch counts + issue link). */
export default function GithubDropdown({
  isDark,
  openDropdown,
  githubStats,
  onMouseEnter,
  onMouseLeave,
  onDropdownMouseEnter,
}: GithubDropdownProps) {
  const isOpen = openDropdown === "github";

  return (
    <div
      className="relative hidden lg:flex  "
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`text-sm transition-colors p-1.5 rounded-md flex items-center gap-1 cursor-pointer ${
          isDark
            ? "text-gray-300 hover:text-gray-100 hover:bg-neutral-800"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        }`}
        aria-label="GitHub"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onMouseEnter={onDropdownMouseEnter}
      >
        <a
          href="https://github.com/kubestellar/docs"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-44 rounded-md shadow-xl py-1 border z-50 ${
            isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
          }`}
          onMouseEnter={onDropdownMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <a
            href="https://github.com/kubestellar/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              isDark ? "text-gray-300 hover:bg-neutral-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
              </svg>
              Star
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"}`}>
              {githubStats.stars}
            </span>
          </a>
          <a
            href="https://github.com/kubestellar/docs/fork"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              isDark ? "text-gray-300 hover:bg-neutral-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              </svg>
              Fork
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"}`}>
              {githubStats.forks}
            </span>
          </a>
          <a
            href="https://github.com/kubestellar/docs/watchers"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              isDark ? "text-gray-300 hover:bg-neutral-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2C5.454 2 1.73 5.11.458 9.09a1.5 1.5 0 000 1.82C1.73 14.89 5.454 18 10 18s8.27-3.11 9.542-7.09a1.5 1.5 0 000-1.82C18.27 5.11 14.546 2 10 2zm0 14c-3.866 0-7.09-2.61-8.13-6C2.91 6.61 6.134 4 10 4s7.09 2.61 8.13 6c-1.04 3.39-4.264 6-8.13 6zm0-8a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
              Watch
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"}`}>
              {githubStats.watchers}
            </span>
          </a>
          <a
            href="https://github.com/kubestellar/docs/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              isDark ? "text-gray-300 hover:bg-neutral-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z" />
                <path d="M8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
              Create Issue
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
