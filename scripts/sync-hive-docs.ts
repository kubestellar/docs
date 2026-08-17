import fs from "fs";
import path from "path";

const owner = "kubestellar";
const repo = "hive";
const branch = process.env.HIVE_DOCS_REF || "v4";
const docsRoot = path.join(process.cwd(), "docs", "content", "hive");
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/src/docs`;
const canonicalBase = `https://github.com/${owner}/${repo}/blob/${branch}/src/docs`;

const files: Array<{ source: string; target?: string }> = [
  { source: "README.md", target: "readme.md" },
  { source: "architecture.md" },
  { source: "security-threat-model.md" },
  { source: "roadmap.md" },
  { source: "landscape.md" },
  { source: "adr/README.md", target: "adr/readme.md" },
  { source: "adr/0001-record-architecture-decisions.md" },
  { source: "adr/0002-mitm-proxy-network-enforcement.md" },
  { source: "adr/0003-acmm-autonomy-levels.md" },
  { source: "adr/0004-beads-work-ledger.md" },
  { source: "adr/0005-forge-abstraction.md" },
  { source: "adr/0006-planning-intelligence.md" },
  { source: "adr/0007-token-mint.md" },
  { source: "adr/0008-ioscan-untrusted-input.md" },
  { source: "adr/0009-trajectory-review.md" },
  { source: "adr/0010-escalation-circuit-breaker.md" },
  { source: "adr/0011-knowledge-graph.md" },
  { source: "adr/0012-skill-registry.md" },
  { source: "adr/0013-cel-triggers.md" },
  { source: "adr/0014-hub-spoke.md" },
];

function canonicalHeader(source: string): string {
  const canonical = `${canonicalBase}/${source}`;
  return `> **Synced from Hive.** This page is pulled from [kubestellar/hive@${branch}](${canonical}) during the docs build. Edit the canonical source in the Hive repository.\n\n`;
}

// ---------------------------------------------------------------------------
// Link rewriting
// ---------------------------------------------------------------------------
//
// The Hive markdown is authored for GitHub's file browser, where relative links
// like `[Architecture](architecture.md)` or `[bin index](../../bin/README.md)`
// resolve against the file's location in the `kubestellar/hive` repo. When those
// files are copied verbatim into this docs site they 404, because:
//
//   * The site serves each Hive page at a route WITHOUT the `.md` extension
//     (e.g. `docs/content/hive/architecture.md` -> `/docs/hive/architecture`),
//     and some pages render one level deep under a nav section
//     (e.g. `readme.md` -> `/docs/hive/overview/introduction`). A bare
//     `architecture.md` link therefore resolves against the wrong directory and
//     keeps a `.md` suffix that is not a valid route.
//   * Repo-relative escapes such as `../../bin/README.md` point outside the
//     synced docs tree entirely and have no site route at all.
//
// This pass fixes both cases GENERICALLY (no per-file hardcoding) so future
// version bumps (v5, v6, ...) and layout changes stay correct automatically:
//
//   Case 1 — the link resolves to a Hive doc that IS synced/published here:
//     rewrite it to the site-absolute, extension-less route `/docs/hive/<name>`.
//     A root-absolute path is used deliberately: it resolves correctly no matter
//     how deep the *current* page renders in the nav, so it cannot break if a
//     page later moves between nav sections.
//
//   Case 2 — the link escapes the synced tree, or points at a repo path that is
//     NOT synced (bin/README.md, deploy/README.md, AGENT-DEFINITION.md, etc.):
//     rewrite it to an absolute GitHub URL on the same branch the sync uses, by
//     resolving the `../` segments against the source file's real repo path
//     (`src/docs/<source>`) to recover the true repo path, then emitting
//     `https://github.com/<owner>/<repo>/blob/<branch>/<repo-path>`.
//
//   Absolute (`http(s)://`, `//`) links and pure in-page `#anchor` links are
//   left untouched.

// Repo path (relative to the hive repo root) of every source file the sync
// pulls, e.g. `src/docs/architecture.md`, `src/docs/adr/README.md`.
const syncedRepoPaths = new Set(files.map(f => `src/docs/${f.source}`));

// Map from a synced source's repo path -> its published site route (no `.md`).
// e.g. `src/docs/README.md` -> `/docs/hive/readme`,
//      `src/docs/adr/0001-...md` -> `/docs/hive/adr/0001-...`.
const repoPathToSiteRoute = new Map<string, string>();
for (const f of files) {
  const repoPath = `src/docs/${f.source}`;
  const target = f.target || f.source;
  const targetNoExt = target.replace(/\.mdx?$/i, "");
  repoPathToSiteRoute.set(repoPath, `/docs/hive/${targetNoExt}`);
}

// Basename -> site route, used only as a recovery fallback (see rewriteLinkTarget).
// `README.md` is intentionally excluded because it is ambiguous (root README vs
// adr/README); those are only ever matched by exact path.
const basenameToSiteRoute = new Map<string, string>();
for (const f of files) {
  const base = f.source.split("/").pop()!;
  if (base.toLowerCase() === "readme.md") continue;
  const target = f.target || f.source;
  basenameToSiteRoute.set(base, `/docs/hive/${target.replace(/\.mdx?$/i, "")}`);
}

// Split a link target into its path portion and a preserved `#fragment` /
// `?query` suffix so we only rewrite the path.
function splitSuffix(target: string): { pathPart: string; suffix: string } {
  const match = target.match(/^([^?#]*)([?#].*)?$/);
  return { pathPart: match?.[1] ?? target, suffix: match?.[2] ?? "" };
}

// Rewrite a single markdown link target that appears in `sourceRepoPath`'s
// content (sourceRepoPath is e.g. `src/docs/README.md`). Returns the original
// target unchanged when no rewrite applies.
function rewriteLinkTarget(target: string, sourceRepoPath: string): string {
  const trimmed = target.trim();

  // Leave absolute URLs, protocol-relative URLs, root-absolute site paths, and
  // pure in-page anchors alone. Skipping root-absolute `/...` paths also makes
  // the pass idempotent: already-rewritten `/docs/hive/...` links are untouched.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return target; // http:, https:, mailto:, etc.
  if (trimmed.startsWith("//")) return target;
  if (trimmed.startsWith("/")) return target; // root-absolute (e.g. /docs/hive/...)
  if (trimmed.startsWith("#")) return target;
  if (trimmed === "") return target;

  const { pathPart, suffix } = splitSuffix(trimmed);
  if (pathPart === "") return target; // e.g. a lone `?query` — nothing to resolve.

  // Resolve the (possibly `../`-laden) relative link against the directory of
  // the source file, yielding a repo-root-relative path.
  const sourceDir = path.posix.dirname(sourceRepoPath);
  const resolved = path.posix.normalize(path.posix.join(sourceDir, pathPart));

  // Case 1: the link points at a doc we actually sync/publish -> site route.
  if (syncedRepoPaths.has(resolved)) {
    const route = repoPathToSiteRoute.get(resolved)!;
    return `${route}${suffix}`;
  }

  // Case 1b (recovery): the resolved path is not itself synced, but its basename
  // uniquely matches a synced doc. This happens when the Hive source was already
  // hand-edited with SITE-relative links (e.g. `../architecture.md` written to
  // resolve at `/docs/hive/...` rather than in GitHub's file browser). Rather
  // than push such a link out to GitHub, keep it internal. This keeps the pass
  // correct whether the upstream source uses pristine GitHub-relative links
  // (matched by Case 1) or site-adjusted `../` links (matched here).
  const base = pathPart.split("/").pop() ?? "";
  if (basenameToSiteRoute.has(base)) {
    return `${basenameToSiteRoute.get(base)!}${suffix}`;
  }

  // Case 2: anything else that is a repo-relative path (in-tree-but-unsynced, or
  // an escape like `../../bin/README.md`) -> absolute GitHub URL on the branch.
  // `resolved` is already normalized relative to the repo root.
  return `https://github.com/${owner}/${repo}/blob/${branch}/${resolved}${suffix}`;
}

// Apply link rewriting to a file's markdown content. Handles inline links
// `[text](target)` and reference-style definitions `[id]: target`.
function rewriteLinks(content: string, sourceRepoPath: string): string {
  // Inline links: [text](target) and [text](target "title").
  // The target is everything up to the first unescaped space (before an optional
  // title) or the closing paren.
  let out = content.replace(
    /(\]\()(\s*)([^)\s]+)([^)]*)(\))/g,
    (_full, open, lead, targetRaw, rest, close) => {
      const rewritten = rewriteLinkTarget(targetRaw, sourceRepoPath);
      return `${open}${lead}${rewritten}${rest}${close}`;
    }
  );

  // Reference-style link definitions: `[id]: target` (optionally followed by a
  // title) at the start of a line.
  out = out.replace(
    /^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/gm,
    (_full, prefix, targetRaw, rest) => {
      const rewritten = rewriteLinkTarget(targetRaw, sourceRepoPath);
      return `${prefix}${rewritten}${rest}`;
    }
  );

  return out;
}

// Exported for unit testing (see scripts/sync-hive-docs.test.ts).
export { rewriteLinkTarget, rewriteLinks };

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
}

async function main() {
  for (const file of files) {
    const target = file.target || file.source;
    const sourceURL = `${rawBase}/${file.source}`;
    const targetPath = path.join(docsRoot, target);
    if (!targetPath.startsWith(docsRoot + path.sep)) {
      throw new Error(`refusing to write outside Hive docs root: ${target}`);
    }
    const content = await fetchText(sourceURL);
    // Rewrite GitHub-relative links so they resolve on the docs site.
    const rewritten = rewriteLinks(content, `src/docs/${file.source}`);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, canonicalHeader(file.source) + rewritten);
    console.log(`synced ${file.source} -> docs/content/hive/${target}`);
  }
}

// Only run the sync when this file is executed directly (not when imported by
// the test suite, which would otherwise trigger network fetches on import).
const isDirectRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  /sync-hive-docs\.ts$/.test(process.argv[1] ?? "");

if (isDirectRun) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
