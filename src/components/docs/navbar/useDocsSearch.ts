import { useState, useRef, useEffect } from "react";
import { gtagEvent } from "@/components/GoogleAnalytics";
import type { SearchResult } from "./types";

/**
 * Encapsulates the docs search command palette: query state, debounced API
 * calls, keyboard shortcuts (Cmd/Ctrl+K to open, Escape to close, arrow keys
 * plus Enter to navigate results) and analytics tracking.
 *
 * @param onEscapeWhenClosed - called when Escape is pressed while the
 * palette is already closed, letting the caller close other UI (e.g. an
 * open nav dropdown) instead.
 */
export function useDocsSearch(onEscapeWhenClosed?: () => void) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIndex(0);
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // Bounded click signal: category/matchType are fixed small sets from the
  // search API response, and position is a numeric index — never the raw
  // query or result title/content, to avoid unbounded label values.
  const trackSearchResultClick = (result: SearchResult, index: number) => {
    gtagEvent("docs_search_result_click", {
      category: result.category,
      match_type: result.matchType,
      position: index,
    });
  };

  const performSearchAPI = async (query: string) => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      setSearchResults(data.results || []);
      // Bounded usage signal: only numeric lengths/counts, never the raw
      // query text, to avoid leaking search content or unbounded label values.
      gtagEvent("docs_search", {
        query_length: query.length,
        result_count: data.results?.length ?? 0,
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const performSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedIndex(0);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce search API calls (300ms delay)
    debounceRef.current = setTimeout(() => {
      performSearchAPI(query);
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSearchOpen) {
          closeSearch();
        } else {
          onEscapeWhenClosed?.();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isSearchOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (isSearchOpen && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter" && searchResults[selectedIndex]) {
          e.preventDefault();
          const result = searchResults[selectedIndex];
          trackSearchResultClick(result, selectedIndex);
          window.location.href = result.url;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchOpen, searchResults, selectedIndex]);

  return {
    isSearchOpen,
    searchQuery,
    searchResults,
    selectedIndex,
    isSearching,
    searchInputRef,
    commandPaletteRef,
    setSelectedIndex,
    openSearch,
    closeSearch,
    performSearch,
    trackSearchResultClick,
  };
}
