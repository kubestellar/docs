/**
 * Shared types for the docs table-of-contents components (`DocsLayout`,
 * `TableOfContents`, `MobileTOC`), which previously each redeclared this
 * identical shape independently.
 */
export interface TOCItem {
  id: string;
  value: string;
  depth: number;
}
