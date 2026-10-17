// Only re-export what src/app/docs/layout.tsx actually imports through this
// barrel. DocsProvider, useDocsMenu, DocsLayout, DocsSidebar,
// TableOfContents, ThemeToggle, and SidebarFooter have no importers via this
// barrel — every other consumer imports them directly from their own files
// (kubestellar/docs#7438).
export { default as DocsNavbar } from './DocsNavbar';
export { default as DocsFooter } from './DocsFooter';
export { DocsBanner } from './DocsBanner';
