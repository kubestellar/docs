// Docs-navbar-specific types. DropdownType and GithubStats moved to
// src/components/navbar/types.ts and src/hooks/useGithubStats.ts
// respectively (docs#7146); the docs-navbar barrel now re-exports them
// straight from those canonical locations.

/** Result item rendered by the docs search command palette. */
export interface SearchResult {
  title: string;
  url: string;
  category: string;
  snippet: string;
  highlightedSnippet: string;
  matchType: string;
}
