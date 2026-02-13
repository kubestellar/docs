# KubeStellar Documentation Developer Guide

Welcome! This guide explains how the documentation system works and how to contribute effectively.

## Architecture

This site is built with **Next.js 15** and **Nextra 4**. It uses a hybrid approach:

- **Unified Content**: Almost all documentation resides in `docs/content/`.
- **Dynamic Routing**: The `src/app/docs/[...slug]` route dynamically renders Markdown/MDX files from the content folder.
- **Navigation**: Sidebar structure is defined statically in `src/app/docs/page-map.ts`.

## How to Add a Page

1. **Add the File**: Create a `.md` or `.mdx` file in `docs/content/` (or a subfolder).
2. **Update Navigation**: Add an entry to the `NAV_STRUCTURE` array in [page-map.ts](src/app/docs/page-map.ts).
   ```typescript
   { 'My New Page': 'path/to/file.md' }
   ```

## Images and Assets

- Images should be placed in `docs/content/images/` or a subfolder within the project (e.g., `docs/content/console/images/`).
- **Pathing Rule**: Use the standardized `/docs-images/` prefix in your MDX/Markdown.
  - Good: `![Logo](/docs-images/logo.png)`
  - Next.js will automatically rewrite this to the correct local API for serving images from the content folder.

## Internationalization (i18n)

- UI strings are located in `messages/*.json`.
- **Sidebar Titles**: We are currently migrating sidebar titles to use `next-intl`. Use the translation keys defined in the JSON files.

## Maintenance Commands

- `npm run dev`: Start local development server.
- `npm run build`: Run production build (verifies MDX integrity).
- `npm run lint`: Check for code and accessibility issues.

## Common Issues

### Build Failure: `localStorage is not defined`
The build runs on the server. If a dependency uses `localStorage`, it will break. We have a mock in `next.config.ts`, but try to keep client-side code inside `useEffect` or behind a client-check.

### Link Resolution
The dynamic router tries to resolve relative links. If a link breaks, check that the file path in [page-map.ts](src/app/docs/page-map.ts) exactly matches the file on disk.
