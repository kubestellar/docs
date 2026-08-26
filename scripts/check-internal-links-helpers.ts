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
 * Map from a NAV_STRUCTURE_<X> variable name to the docs base path its
 * entries live under. Exported so the main script and its tests share
 * one source of truth (drift here would silently break nav-alias
 * resolution).
 */
export const PROJECT_FOR_NAV: Record<string, string> = {
  A2A: "docs/a2a",
  MULTI_PLUGIN: "docs/multi-plugin",
  KUBEFLEX: "docs/kubeflex",
  KUBESTELLAR_MCP: "docs/kubestellar-mcp",
  CONSOLE: "docs/console",
  HIVE: "docs/hive",
  KUBESTELLAR: "docs",
};

/**
 * One nav-alias entry extracted from a page-map.ts NAV_STRUCTURE_* block.
 * Represents the `{ 'Title': 'file.md' }` pairs that buildPageMap() maps
 * to a nav-slug route on the site.
 */
export interface NavAliasEntry {
  /** The uppercase NAV_STRUCTURE_<name> suffix, e.g. 'HIVE'. */
  navName: string;
  /** Base path resolved via PROJECT_FOR_NAV, e.g. 'docs/hive'. */
  base: string;
  /**
   * The section slug this entry falls under, or "" if it is a
   * bare (top-level) entry. Sections are the slugified `title:` fields
   * of category objects in the NAV_STRUCTURE block.
   */
  sectionSlug: string;
  /** The slug derived from the entry's title (via slugify()). */
  slug: string;
  /** The raw title, before slugification (kept for diagnostics). */
  title: string;
  /** The `.md`/`.mdx` file referenced by the entry, e.g. 'readme.md'. */
  file: string;
}

/**
 * Extract every nav-alias entry from a page-map.ts source string.
 *
 * This is the untangled version of the top-level regex loop that
 * check-internal-links.ts runs at startup. Keeping it pure and side-
 * effect-free lets tests feed synthetic page-map source and assert on
 * the exact set of entries produced — critical because a regex
 * regression here silently makes the link checker permissive
 * (invents nav routes that don't exist) or over-strict (misses real
 * nav routes and reports valid links as broken).
 *
 * The function does NOT filter entries by file existence — callers
 * decide whether an entry is registered as a valid route. That
 * separation makes both halves independently testable.
 *
 * Parsing rules (must mirror buildPageMap in src/app/docs/page-map.ts):
 *   - Each `const NAV_STRUCTURE_<NAME> ... = [ ... ]` block is one nav.
 *   - Category objects `{ title: 'X', items: [...] }` contribute section
 *     slugs; slugify(X) is used as the section prefix.
 *   - `{ 'Title': 'file.md' }` (or "double quoted") pairs inside a nav
 *     block are entries; slugify('Title') is the slug.
 *   - Entries whose file starts with `http` or `/` are external and
 *     skipped.
 *   - Every entry is emitted once per section slug in the block AND
 *     once with `sectionSlug: ""` (bare form), mirroring the two
 *     validRoutes.add() calls the main script makes.
 */
export function parseNavStructures(
  pageMapSrc: string,
  projectForNav: Record<string, string> = PROJECT_FOR_NAV,
): NavAliasEntry[] {
  const results: NavAliasEntry[] = [];
  const navBlockRe = /const NAV_STRUCTURE_([A-Z_]+)[^=]*=\s*(\[[\s\S]*?\n\])/g;
  let nav: RegExpExecArray | null;
  while ((nav = navBlockRe.exec(pageMapSrc))) {
    const navName = nav[1];
    const base = projectForNav[navName];
    if (!base) continue;
    const block = nav[2];

    // Category section slugs come from `title:` bareword fields on
    // category objects. These are slugified and used as path prefixes.
    const sections: string[] = [];
    const catRe = /title:\s*['"]([^'"]+)['"]/g;
    let c: RegExpExecArray | null;
    while ((c = catRe.exec(block))) sections.push(slugify(c[1]));

    // Entry pairs are `'Title': 'file.md'` or `"Title": "file.md"`.
    const titleFileRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+\.mdx?)['"]/g;
    const entries: { title: string; file: string; slug: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = titleFileRe.exec(block))) {
      const title = m[1];
      const file = m[2];
      if (file.startsWith("http") || file.startsWith("/")) continue;
      entries.push({ title, file, slug: slugify(title) });
    }

    // Emit each entry once per section prefix and once bare, matching
    // the two `validRoutes.add(...)` calls the main script makes.
    for (const { title, file, slug } of entries) {
      for (const sectionSlug of sections) {
        results.push({ navName, base, sectionSlug, slug, title, file });
      }
      results.push({ navName, base, sectionSlug: "", slug, title, file });
    }
  }
  return results;
}

/**
 * Turn a nav-alias entry into the site route it registers.
 *
 * Kept as a tiny helper so the main script and tests both produce the
 * exact same route string for a given entry, and so a future change to
 * the route shape only has to be made in one place.
 */
export function navEntryRoute(e: NavAliasEntry): string {
  return e.sectionSlug
    ? `/${e.base}/${e.sectionSlug}/${e.slug}`
    : `/${e.base}/${e.slug}`;
}

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
