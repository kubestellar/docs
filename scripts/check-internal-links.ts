/**
 * Broken internal-link checker for the docs content.
 *
 * WHY: Hive (and other) docs are synced/authored as markdown. A rename, a bad
 * sync, or a version bump can leave a relative link pointing at a route that no
 * longer exists — shipping a 404. `scripts/sync-hive-docs.ts` rewrites Hive
 * links at sync time, but nothing catches a regression at PR time. This script
 * resolves every INTERNAL markdown link under `docs/content/**` against the set
 * of routes the site actually serves and fails if any does not resolve.
 *
 * Scope: INTERNAL links only (relative paths and root-absolute `/docs/...`
 * paths). External links (`http(s)://`, `mailto:`, protocol-relative `//`) and
 * pure in-page `#anchor` links are intentionally ignored to keep the check
 * deterministic and free of network flakiness.
 *
 * Route model (must match src/app/docs/[...slug]/page.tsx + page-map.ts):
 *   1. Every `docs/content/<rel>.md(x)` file is served at `/docs/<rel>`
 *      (generateStaticParams strips the extension). This is the flat/direct
 *      route set.
 *   2. buildPageMap() adds nav routes whose slug derives from the nav title
 *      (e.g. hive `readme.md` -> `/docs/hive/overview/introduction`).
 * A link is valid if it resolves to a route in EITHER set.
 */
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const contentRoot = path.join(process.cwd(), "docs", "content");

// --- Build the set of valid routes -----------------------------------------

const validRoutes = new Set<string>();

// (1) Flat/direct routes: one per markdown file under docs/content/**.
function collectFlatRoutes(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      collectFlatRoutes(full);
    } else if (/\.mdx?$/i.test(entry.name)) {
      const rel = path
        .relative(contentRoot, full)
        .replace(/\\/g, "/")
        .replace(/\.mdx?$/i, "");
      validRoutes.add(`/docs/${rel}`);
    }
  }
}
collectFlatRoutes(contentRoot);

// (2) Nav-alias routes. Some pages are ALSO served under a nav-section path
// whose slug derives from the nav title (e.g. hive `readme.md` is aliased at
// `/docs/hive/overview/introduction`). We derive these from the same page-map
// source the site uses, WITHOUT importing it directly (page-map.ts pulls in
// nextra's bundler-only `normalizePageMap` export, which does not resolve under
// a plain Node/tsx run). Instead we parse the NAV_STRUCTURE_* tables out of
// page-map.ts and replicate its title->slug rule. This keeps the checker a
// zero-heavy-dependency, deterministic gate.
const pageMapSrc = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "docs", "page-map.ts"),
  "utf8"
);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Map a NAV_STRUCTURE_<X> variable name to its docs base path.
const projectForNav: Record<string, string> = {
  A2A: "docs/a2a",
  MULTI_PLUGIN: "docs/multi-plugin",
  KUBEFLEX: "docs/kubeflex",
  KUBESTELLAR_MCP: "docs/kubestellar-mcp",
  CONSOLE: "docs/console",
  HIVE: "docs/hive",
  KUBESTELLAR: "docs",
};

// Walk each `{ title: value }` object literal in a NAV_STRUCTURE block and, when
// value is a `'file.md'` string that exists on disk, register the nav-slug route
// under the current section path. Nested arrays extend the section path.
function collectNavAliases(block: string, base: string, sectionSlug: string) {
  // Top-level category titles form the first path segment.
  // We handle both category `{ title: 'X', items: [...] }` and inner
  // `{ 'Title': 'file.md' }` / `{ 'Title': [ ... ] }` entries.
  const titleFileRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+\.mdx?)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = titleFileRe.exec(block))) {
    const title = m[1];
    const file = m[2];
    if (file.startsWith("http") || file.startsWith("/")) continue;
    const fileAbs = path.join(contentRoot, base.replace(/^docs\/?/, ""), file);
    if (!fs.existsSync(fileAbs) && base !== "docs") {
      // Kubestellar nav references live under docs/content directly.
      const alt = path.join(contentRoot, file);
      if (!fs.existsSync(alt)) continue;
    }
    const slug = slugify(title);
    if (sectionSlug) validRoutes.add(`/${base}/${sectionSlug}/${slug}`);
    validRoutes.add(`/${base}/${slug}`);
  }
}

// Extract each `const NAV_STRUCTURE_<X> ... = [ ... ]` block and its category
// section slugs, then register aliases. This mirrors buildPageMap closely enough
// to avoid false positives on nav-style links; if a link's flat route already
// exists (case 1) we never even consult these.
const navBlockRe = /const NAV_STRUCTURE_([A-Z_]+)[^=]*=\s*(\[[\s\S]*?\n\])/g;
let nav: RegExpExecArray | null;
while ((nav = navBlockRe.exec(pageMapSrc))) {
  const name = nav[1];
  const base = projectForNav[name];
  if (!base) continue;
  const block = nav[2];
  // Category titles: `{ title: 'Overview', items: [ ... ] }`.
  const catRe = /title:\s*['"]([^'"]+)['"]/g;
  let c: RegExpExecArray | null;
  const sections: string[] = [];
  while ((c = catRe.exec(block))) sections.push(slugify(c[1]));
  // Register aliases under every section slug (over-approximation is safe: it
  // only ever ADDS valid routes, never rejects a real one).
  for (const s of sections) collectNavAliases(block, base, s);
  collectNavAliases(block, base, "");
}

// Normalize a route for comparison: drop trailing slash (except root).
function normRoute(r: string): string {
  const noSlash = r.replace(/\/+$/, "");
  return noSlash === "" ? "/" : noSlash;
}
const validNormalized = new Set([...validRoutes].map(normRoute));

// --- Extract and resolve links ---------------------------------------------

type Broken = { file: string; link: string; resolved: string };
const broken: Broken[] = [];
let linksChecked = 0;

// Route at which a given content file is served (its flat/direct route).
function fileRoute(fileAbs: string): string {
  const rel = path
    .relative(contentRoot, fileAbs)
    .replace(/\\/g, "/")
    .replace(/\.mdx?$/i, "");
  return `/docs/${rel}`;
}

const INLINE_LINK = /\]\(\s*([^)\s]+)(?:\s+[^)]*)?\)/g;
const REF_LINK = /^\s*\[[^\]]+\]:\s*(\S+)/gm;

// Asset extensions are served by the `/docs-images/*` rewrite (see
// rewriteImagePaths in the docs page), not by the docs route table, so relative
// image/asset links must NOT be validated against routes here.
const ASSET_EXT =
  /\.(png|jpe?g|gif|svg|webp|avif|ico|pdf|mp4|webm|mov|zip|gz|tgz|css|js|woff2?|ttf|eot)$/i;

function isExternalOrAnchor(target: string): boolean {
  if (target === "") return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return true; // http:, mailto:, etc.
  if (target.startsWith("//")) return true; // protocol-relative
  if (target.startsWith("#")) return true; // in-page anchor
  return false;
}

function checkFile(fileAbs: string) {
  const content = fs.readFileSync(fileAbs, "utf8");
  const fileRel = path.relative(process.cwd(), fileAbs).replace(/\\/g, "/");
  const baseRoute = fileRoute(fileAbs);
  const baseDir = path.posix.dirname(baseRoute);

  const targets: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = INLINE_LINK.exec(content))) targets.push(m[1]);
  while ((m = REF_LINK.exec(content))) targets.push(m[1]);

  for (const raw of targets) {
    if (isExternalOrAnchor(raw)) continue;
    // Strip #fragment / ?query before resolving to a route.
    const pathPart = raw.replace(/[?#].*$/, "");
    if (pathPart === "") continue; // pure fragment/query on the current page.
    if (ASSET_EXT.test(pathPart)) continue; // image/asset, not a doc route.

    linksChecked++;
    // Resolve to an absolute site route.
    let resolved: string;
    if (pathPart.startsWith("/")) {
      resolved = pathPart;
    } else {
      resolved = path.posix.normalize(path.posix.join(baseDir, pathPart));
    }
    // A `.md`/`.mdx` suffix is never part of a valid route; strip it so a
    // (discouraged) `foo.md` link is still checked against the real route.
    resolved = resolved.replace(/\.mdx?$/i, "");

    if (!validNormalized.has(normRoute(resolved))) {
      broken.push({ file: fileRel, link: raw, resolved });
    }
  }
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      walk(full);
    } else if (/\.mdx?$/i.test(entry.name)) {
      checkFile(full);
    }
  }
}

function main() {
  walk(contentRoot);

  console.log(
    `Checked ${linksChecked} internal links across docs/content against ${validNormalized.size} routes.`
  );

  if (broken.length > 0) {
    console.error(`\n❌ Found ${broken.length} broken internal link(s):\n`);
    for (const b of broken) {
      console.error(
        `  ${b.file}\n    link: ${b.link}\n    resolves to (no route): ${b.resolved}`
      );
    }
    console.error(
      "\nInternal links must resolve to a real docs route. For links to files " +
        "outside the synced docs tree, use an absolute GitHub URL instead."
    );
    process.exit(1);
  }

  console.log("✅ No broken internal links.");
}

// Run only when executed directly (allows importing for tests).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
