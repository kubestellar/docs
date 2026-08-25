/**
 * Pure helpers extracted from check-internal-links.ts.
 *
 * Keeping these in a side-effect-free module lets the vitest suite import them
 * without triggering the CLI script's top-level filesystem reads (contentRoot
 * walk, page-map.ts parse). The main script re-imports and reuses them.
 *
 * All helpers here are deterministic and only use path/string primitives.
 */
import path from "node:path";

/**
 * Convert a human-readable nav title into a URL slug.
 *
 * Mirrors the slug rule that buildPageMap() applies to NAV_STRUCTURE_* entries
 * in src/app/docs/page-map.ts, so nav-aliased routes come out the same on both
 * sides of the check.
 *
 * Rule: lowercase, collapse any run of non-[a-z0-9] to a single '-', then trim
 * leading/trailing dashes.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Normalize a route for set-membership comparison.
 *
 * The link checker registers valid routes with and without a trailing slash
 * inconsistently (nav aliases vs flat routes). Comparing normalized forms
 * avoids false-positive "broken" reports for links that only differ by a
 * trailing slash. Root '/' is preserved.
 */
export function normRoute(r: string): string {
  const noSlash = r.replace(/\/+$/, "");
  return noSlash === "" ? "/" : noSlash;
}

/**
 * Should the checker skip this link target entirely?
 *
 * Returns true for:
 *   - the empty string (defensive; usually a preceding `[]()`)
 *   - any URI with an explicit scheme (`http:`, `https:`, `mailto:`, `ftp:`, …)
 *   - protocol-relative URLs (`//host/path`)
 *   - pure in-page anchors (`#section`)
 *
 * These are intentionally out of scope — either external or handled by the
 * browser, and validating them would introduce network flakiness.
 */
export function isExternalOrAnchor(target: string): boolean {
  if (target === "") return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return true;
  if (target.startsWith("//")) return true;
  if (target.startsWith("#")) return true;
  return false;
}

/**
 * Extensions treated as assets rather than doc routes.
 *
 * Asset links are served by the `/docs-images/*` rewrite (see
 * rewriteImagePaths in the docs page), not by the docs route table, so they
 * must NOT be validated against the route set.
 */
export const ASSET_EXT =
  /\.(png|jpe?g|gif|svg|webp|avif|ico|pdf|mp4|webm|mov|zip|gz|tgz|css|js|woff2?|ttf|eot)$/i;

/**
 * Resolve a raw markdown link target to the absolute site route it should
 * point at, or `null` if the link is not a docs route (external, anchor,
 * asset, or pure query/fragment on the current page).
 *
 * @param raw       The link target exactly as it appears in markdown.
 * @param baseRoute The site route of the file containing the link, e.g.
 *                  '/docs/hive/overview'. Used to resolve relative targets.
 *
 * The returned route is stripped of any `.md`/`.mdx` suffix (never part of a
 * real route) and of any `?query` / `#fragment` suffix, but it is NOT
 * trailing-slash-normalized — call normRoute() before set lookup.
 */
export function resolveInternalLink(
  raw: string,
  baseRoute: string,
): string | null {
  if (isExternalOrAnchor(raw)) return null;

  const pathPart = raw.replace(/[?#].*$/, "");
  if (pathPart === "") return null;
  if (ASSET_EXT.test(pathPart)) return null;

  const baseDir = path.posix.dirname(baseRoute);
  let resolved: string;
  if (pathPart.startsWith("/")) {
    resolved = pathPart;
  } else {
    resolved = path.posix.normalize(path.posix.join(baseDir, pathPart));
  }
  return resolved.replace(/\.mdx?$/i, "");
}
