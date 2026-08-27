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
import {
  slugify,
  normRoute,
  isExternalOrAnchor,
  ASSET_EXT,
  PROJECT_FOR_NAV,
  parseNavStructures,
  navEntryRoute,
} from "./check-internal-links-helpers";

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
// slugify, normRoute, isExternalOrAnchor and ASSET_EXT are imported from
// ./check-internal-links-helpers.ts (side-effect free, unit-tested).

// Extract every nav-alias entry, then filter to those whose target file
// actually exists on disk, and register both the sectioned and the bare
// form as valid routes. Splitting the pure parse (parseNavStructures)
// from this fs-touching registration keeps the parser unit-testable.
for (const entry of parseNavStructures(pageMapSrc, PROJECT_FOR_NAV)) {
  const fileAbs = path.join(
    contentRoot,
    entry.base.replace(/^docs\/?/, ""),
    entry.file,
  );
  if (!fs.existsSync(fileAbs) && entry.base !== "docs") {
    // Kubestellar nav references live under docs/content directly.
    const alt = path.join(contentRoot, entry.file);
    if (!fs.existsSync(alt)) continue;
  }
  validRoutes.add(navEntryRoute(entry));
}

// Normalize a route for comparison: use the shared helper.
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

// INLINE_LINK / REF_LINK regexes remain local (script-only).

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
