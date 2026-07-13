/**
 * Rewrites relative image paths in Markdown content to absolute /docs-images/ API paths.
 *
 * Relative paths like `images/foo.png` or `./images/foo.png` fail to load when the page
 * is served from a docs route because the browser resolves them against the page URL
 * instead of the filesystem location of the source file.  The /docs-images/* rewrite
 * rule in next.config.ts proxies these requests to /api/docs-image/* which serves
 * static assets from docs/content/.
 *
 * @param content  Raw Markdown/MDX source string.
 * @param baseDir  Directory of the source file relative to docs/content/ (e.g. "console"
 *                 or "kubestellar").  Pass an empty string when the file lives directly
 *                 under docs/content/.
 */
export function rewriteRelativeImagePaths(content: string, baseDir: string): string {
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt: string, src: string) => {
      const trimmed = src.trim()
      // Leave absolute URLs, absolute paths, data URIs, and anchor-only refs unchanged.
      if (
        trimmed.startsWith('/') ||
        /^https?:\/\//.test(trimmed) ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('#')
      ) {
        return match
      }
      const normalised = trimmed.replace(/^\.\//, '')
      const apiPath = baseDir ? `/docs-images/${baseDir}/${normalised}` : `/docs-images/${normalised}`
      return `![${alt}](${apiPath})`
    }
  )
}
