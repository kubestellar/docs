export type DropdownType = "contribute" | "community" | "language" | "github" | null;

export interface GithubStats {
  stars: string;
  forks: string;
  watchers: string;
}

export interface SearchResult {
  title: string;
  url: string;
  category: string;
  snippet: string;
  highlightedSnippet: string;
  matchType: string;
}
