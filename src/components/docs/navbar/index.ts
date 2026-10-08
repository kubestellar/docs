// Barrel for the docs navbar sub-package. After docs#7143..#7146 unified
// the marketing and docs dropdowns onto src/components/navbar/, only the
// docs-specific pieces (SearchCommandPalette + useDocsSearch + SearchResult)
// still live in this directory; the rest are re-exported directly from
// @/components/navbar/ so existing docs-navbar imports keep working without
// a per-component pass-through stub.
export { LinkedinIcon } from "@/components/navbar/icons";
export type { DropdownType } from "@/components/navbar/types";
export type { GithubStats } from "@/hooks/useGithubStats";
export type { SearchResult } from "./types";
export { getNavClasses } from "@/components/navbar/styles";
export { useGithubStats } from "@/hooks/useGithubStats";
export { useDocsSearch } from "./useDocsSearch";
export { default as ContributeDropdown } from "@/components/navbar/ContributeDropdown";
export { default as CommunityDropdown } from "@/components/navbar/CommunityDropdown";
export { default as GithubDropdown } from "@/components/navbar/GithubDropdown";
export { default as SearchCommandPalette } from "./SearchCommandPalette";
export { default as MobileMenu } from "@/components/navbar/MobileMenu";
