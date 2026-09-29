export type DropdownType = "contribute" | "community" | "language" | "github" | null;

export type { GithubStats } from "@/hooks/useGithubStats";

export interface SearchResult {
  title: string;
  url: string;
  category: string;
  snippet: string;
  highlightedSnippet: string;
  matchType: string;
}
