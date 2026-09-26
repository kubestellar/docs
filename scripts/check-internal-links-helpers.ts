/**
 * Pure helpers extracted from check-internal-links.ts.
 *
 * Keeping these in a side-effect-free module lets the vitest suite import them
 * without triggering the CLI script's top-level filesystem reads (contentRoot
 * walk, nav.yaml reads). The main script re-imports and reuses them.
 *
 * All helpers here are deterministic and only use path/string primitives.
 */
import path from "node:path";
import {
  NAV_FILE_NAME,
  parseNavYaml,
  type NavItem,
  type NavSection,
} from "../src/lib/nav";

/**
 * Convert a human-readable nav title into a URL slug.
 *
 * Mirrors the slug rule that buildPageMap() applies to nav.yaml entries
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
 * One nav.yaml to derive nav-alias routes from: the docs base path its
 * entries route under (`docs` for the root KubeStellar project, `docs/<slug>`
 * for every other project and for the cross-project sections, which route
 * under plain `docs`) plus the repo-relative path of the YAML file.
 */
export interface NavSource {
  /** Diagnostic label, e.g. 'console' or 'contributing'. */
  name: string;
  /** Base path the entries route under, e.g. 'docs/console' or 'docs'. */
  base: string;
  /** Repo-relative path of the nav.yaml, e.g. 'docs/content/console/nav.yaml'. */
  navPath: string;
}

/**
 * Build the list of nav.yaml sources the checker reads, from the same
 * PROJECTS table and GENERAL_SECTIONS list the site uses. Data-driven so a
 * new project (or cross-project section) is covered the moment it exists,
 * with no parallel table to keep in sync (kubestellar/docs#7080).
 */
export function navSourcesFor(
  projects: Record<string, { id: string; basePath: string; navPath: string }>,
  generalSections: readonly string[],
  contentRoot = "docs/content",
): NavSource[] {
  const sources: NavSource[] = Object.values(projects).map((p) => ({
    name: p.id,
    base: p.basePath ? `docs/${p.basePath}` : "docs",
    navPath: p.navPath,
  }));
  for (const section of generalSections) {
    sources.push({
      name: section,
      base: "docs",
      navPath: `${contentRoot}/${section}/${NAV_FILE_NAME}`,
    });
  }
  return sources;
}

/**
 * One nav-alias entry extracted from a nav.yaml. Represents the
 * `Title: file.md` pairs that buildPageMap() maps to a nav-slug route on
 * the site.
 */
export interface NavAliasEntry {
  /** The NavSource name this entry came from, e.g. 'console'. */
  navName: string;
  /** Base path from the NavSource, e.g. 'docs/console'. */
  base: string;
  /**
   * The section slug this entry falls under, or "" if it is a
   * bare (top-level) entry. Sections are the slugified `title:` fields
   * of the top-level sections in the nav file.
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
 * Extract every nav-alias entry from one parsed nav file.
 *
 * Pure and side-effect-free so tests can feed synthetic nav data and assert
 * on the exact set of entries produced — critical because a regression here
 * silently makes the link checker permissive (invents nav routes that don't
 * exist) or over-strict (misses real nav routes and reports valid links as
 * broken).
 *
 * The function does NOT filter entries by file existence — callers decide
 * whether an entry is registered as a valid route.
 *
 * Rules (must mirror buildPageMap in src/app/docs/page-map.ts):
 *   - Each top-level `{ title, items }` section contributes a section slug
 *     (slugify(title)).
 *   - Every `Title: file.md(x)` pair anywhere in the file (including nested
 *     folders) is an entry; slugify(Title) is the slug.
 *   - Entries whose file starts with `http` or `/` are external and skipped;
 *     values without a .md/.mdx extension are not doc files and are skipped.
 *   - Every entry is emitted once per section slug in the file AND once
 *     with `sectionSlug: ""` (bare form), mirroring the two
 *     validRoutes.add() calls the main script makes. This deliberately
 *     over-approximates (an entry is registered under every section, not
 *     just its own) — safe, because it only ever adds routes that the
 *     flat route set would otherwise already accept.
 */
export function navAliasEntries(
  source: Pick<NavSource, "name" | "base">,
  sections: NavSection[],
): NavAliasEntry[] {
  const sectionSlugs = sections.map((s) => slugify(s.title));

  const entries: { title: string; file: string; slug: string }[] = [];
  const visit = (items: NavItem[]) => {
    for (const item of items) {
      if (typeof item === "string") continue;
      for (const [title, value] of Object.entries(item)) {
        if (Array.isArray(value)) {
          visit(value);
        } else if (typeof value === "string") {
          if (value.startsWith("http") || value.startsWith("/")) continue;
          if (!/\.mdx?$/i.test(value)) continue;
          entries.push({ title, file: value, slug: slugify(title) });
        }
      }
    }
  };
  for (const section of sections) visit(section.items);

  const results: NavAliasEntry[] = [];
  for (const { title, file, slug } of entries) {
    for (const sectionSlug of sectionSlugs) {
      results.push({ navName: source.name, base: source.base, sectionSlug, slug, title, file });
    }
    results.push({ navName: source.name, base: source.base, sectionSlug: "", slug, title, file });
  }
  return results;
}

/**
 * Parse nav YAML source text and extract its nav-alias entries. Thin wrapper
 * over parseNavYaml() (schema validation) + navAliasEntries().
 */
export function parseNavStructure(
  source: NavSource,
  yamlSource: string,
): NavAliasEntry[] {
  return navAliasEntries(source, parseNavYaml(source.navPath, yamlSource));
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
