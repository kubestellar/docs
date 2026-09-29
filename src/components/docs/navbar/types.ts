// Moved to src/components/navbar/types.ts (docs#7146) so the unified
// dropdown components have one canonical location for the type.
export type { DropdownType } from "@/components/navbar/types";

export type { GithubStats } from "@/hooks/useGithubStats";

export interface SearchResult {
  title: string;
  url: string;
  category: string;
  snippet: string;
  highlightedSnippet: string;
  matchType: string;
}
