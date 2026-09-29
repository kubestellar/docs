/**
 * Discriminates which single desktop dropdown (if any) is currently open in
 * the docs navbar's `openDropdown`-driven variant. Moved here from
 * `src/components/docs/navbar/types.ts` (docs#7146) so the unified
 * Community/Contribute/GithubDropdown components have one canonical home for
 * the type instead of importing it from the docs-only package.
 */
export type DropdownType =
  | "contribute"
  | "community"
  | "language"
  | "github"
  | null;
