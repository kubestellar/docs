"use client";

import type { RefObject } from "react";
import type { SearchResult } from "./types";

interface SearchCommandPaletteProps {
  isDark: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  isSearching: boolean;
  searchResults: SearchResult[];
  selectedIndex: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  commandPaletteRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onResultClick: (result: SearchResult, index: number) => void;
}

/** Cmd/Ctrl+K search command palette overlay for the docs navbar. */
export default function SearchCommandPalette({
  isDark,
  isSearchOpen,
  searchQuery,
  isSearching,
  searchResults,
  selectedIndex,
  searchInputRef,
  commandPaletteRef,
  onQueryChange,
  onClose,
  onSelectIndex,
  onResultClick,
}: SearchCommandPaletteProps) {
  if (!isSearchOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div
          ref={commandPaletteRef}
          className={`rounded-lg shadow-2xl border ${
            isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-gray-200"
          }`}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-700">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search documentation..."
              className={`flex-1 bg-transparent outline-none text-base ${
                isDark ? "text-gray-100 placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
              }`}
              autoFocus
            />
            <kbd className={`text-xs px-2 py-1 rounded ${isDark ? "bg-neutral-800 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
              ESC
            </kbd>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchQuery.trim() === "" ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Search for any word or phrase in the documentation...
                </p>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  Try &quot;kubectl&quot;, &quot;cluster&quot;, &quot;workload&quot;, or &quot;installation&quot;
                </p>
              </div>
            ) : isSearching ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-3"></div>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Searching documentation...
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  No results found for &quot;{searchQuery}&quot;
                </p>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  Try different keywords or check spelling
                </p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <a
                    key={index}
                    href={result.url}
                    className={`block px-4 py-3 transition-colors border-l-2 ${
                      index === selectedIndex
                        ? isDark
                          ? "bg-neutral-800 border-blue-500"
                          : "bg-gray-100 border-blue-600"
                        : isDark
                          ? "hover:bg-neutral-800 border-transparent"
                          : "hover:bg-gray-50 border-transparent"
                    }`}
                    onMouseEnter={() => onSelectIndex(index)}
                    onClick={() => onResultClick(result, index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded flex-shrink-0 ${isDark ? "bg-neutral-700" : "bg-gray-200"}`}>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`font-medium text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                            {result.title}
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${isDark ? "bg-neutral-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                            {result.category}
                          </span>
                        </div>
                        <div
                          className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}
                          dangerouslySetInnerHTML={{
                            __html: result.highlightedSnippet.replace(
                              /<mark>/g,
                              `<mark style="background-color: ${isDark ? "#fbbf24" : "#fef08a"}; color: ${isDark ? "#000" : "#000"}; padding: 2px 4px; border-radius: 2px; font-weight: 500;">`
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {searchResults.length > 0 && (
            <div className={`flex items-center justify-between px-4 py-2 text-xs border-t ${
              isDark ? "border-neutral-700 text-gray-500" : "border-gray-200 text-gray-600"
            }`}>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-neutral-800" : "bg-gray-100"}`}>↑</kbd>
                  <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-neutral-800" : "bg-gray-100"}`}>↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-neutral-800" : "bg-gray-100"}`}>↵</kbd>
                  to select
                </span>
              </div>
              <span>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
