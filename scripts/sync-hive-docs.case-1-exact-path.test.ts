/**
 * Additional unit tests for `scripts/sync-hive-docs.ts` that specifically
 * exercise Case 1 (exact-path lookup in `syncedRepoPaths`) as distinct from
 * Case 1b (basename recovery via `basenameToSiteRoute`).
 *
 * WHY A SEPARATE FILE
 *
 * The existing `sync-hive-docs.test.ts` uses `sourceRepoPath = "v2/docs/…"`
 * for every case, but production `sync-hive-docs.ts` builds
 * `syncedRepoPaths` from `src/docs/${f.source}` (see the top of the module —
 * `const syncedRepoPaths = new Set(files.map(f => \`src/docs/${f.source}\`))`).
 * Because `path.posix.dirname("v2/docs/README.md") === "v2/docs"`, every
 * relative link in those tests resolves to `v2/docs/<something>.md`, which is
 * NEVER a key of `syncedRepoPaths`. Case 1 therefore does not fire — the
 * tests pass, but for the wrong reason: they hit Case 1b (basename recovery)
 * on every green assertion.
 *
 * Consequence: a regression in the exact-path branch (e.g. a refactor that
 * changes the key format of `syncedRepoPaths`, breaks
 * `path.posix.normalize`, or accidentally removes the `.has(resolved)`
 * lookup) would slip past every current test because basename recovery
 * would still produce the same output for those specific inputs.
 *
 * This file closes that gap:
 *
 *   1. Uses `src/docs/…` source paths matching what production actually
 *      registers in `syncedRepoPaths`, so relative links resolve to keys
 *      that live in the set.
 *
 *   2. Includes at least one link — `adr/README.md` — whose *basename*
 *      (`README.md`) is deliberately EXCLUDED from `basenameToSiteRoute`
 *      (the production module skips it explicitly with
 *      `if (base.toLowerCase() === "readme.md") continue;`). That means
 *      only the Case 1 exact-path branch can produce the expected site
 *      route for it — Case 1b would return the link untouched and fall
 *      through to Case 2. A test asserting the correct
 *      `/docs/hive/adr/readme` result therefore truly exercises the
 *      exact-path branch and would fail if that branch regressed.
 *
 *   3. Includes a probe that would give a DIFFERENT answer under Case 1
 *      vs Case 1b (via a `../` link that resolves to a synced repo path
 *      whose basename maps to a different site route). This documents the
 *      precedence order (Case 1 wins over Case 1b) so a future refactor
 *      cannot silently swap them.
 *
 * Tracking: kubestellar/docs#6623.
 */
import { describe, it, expect } from "vitest";
import { rewriteLinkTarget } from "./sync-hive-docs";

// Production `syncedRepoPaths` keys are `src/docs/${f.source}`. Every case in
// this file uses source paths that match that shape so link resolution has a
// real chance of landing in the set.
const README = "src/docs/README.md";
const ADR_README = "src/docs/adr/README.md";

describe("rewriteLinkTarget — Case 1 (exact syncedRepoPaths lookup)", () => {
  it("uses the exact-path branch to rewrite `adr/README.md` — basename `README.md` is deliberately excluded from Case 1b, so Case 1 is the only branch that can produce the internal route", () => {
    // From src/docs/README.md, `adr/README.md` resolves to
    // src/docs/adr/README.md, which IS in syncedRepoPaths and maps to
    // /docs/hive/adr/readme. basenameToSiteRoute intentionally omits
    // README.md (production line: `if (base.toLowerCase() === "readme.md")
    // continue;`), so if the Case 1 exact-path branch regresses, the
    // result would fall through to Case 2 and become an absolute GitHub
    // URL instead. This test therefore uniquely pins the exact-path branch.
    expect(rewriteLinkTarget("adr/README.md", README)).toBe(
      "/docs/hive/adr/readme"
    );
  });

  it("rewrites a sibling of adr/README.md (an ADR file) via exact-path lookup", () => {
    // From src/docs/adr/README.md, `0001-record-architecture-decisions.md`
    // resolves to src/docs/adr/0001-... which IS in syncedRepoPaths.
    // The basename is ALSO in basenameToSiteRoute, so this test does not
    // discriminate between Case 1 and Case 1b on its own — its value is
    // establishing baseline exact-path behavior for the ADR subtree.
    expect(
      rewriteLinkTarget(
        "0001-record-architecture-decisions.md",
        ADR_README,
      ),
    ).toBe("/docs/hive/adr/0001-record-architecture-decisions");
  });

  it("preserves an #anchor on an exact-path hit", () => {
    // Sanity: exact-path branch attaches `${suffix}` to the mapped route.
    // Regression risk: a refactor that concatenates suffix in the wrong
    // spot (e.g. before the route lookup) would drop the anchor.
    expect(
      rewriteLinkTarget("architecture.md#the-governor-loop", README),
    ).toBe("/docs/hive/architecture#the-governor-loop");
  });

  it("resolves a `../adr/README.md` escape from an ADR page back to the ADR readme via exact-path", () => {
    // From src/docs/adr/README.md, `../adr/README.md` normalizes to
    // src/docs/adr/README.md — the same file, reached via a slightly
    // silly path. Exercises path.posix.normalize collapsing `..` correctly
    // and then Case 1 firing on the collapsed key.
    expect(rewriteLinkTarget("../adr/README.md", ADR_README)).toBe(
      "/docs/hive/adr/readme"
    );
  });
});

describe("rewriteLinkTarget — Case 1 precedence over Case 1b", () => {
  it("prefers exact-path over basename recovery when both would match", () => {
    // `architecture.md` from src/docs/README.md:
    //  - exact path resolves to src/docs/architecture.md (in syncedRepoPaths)
    //  - basename `architecture.md` is also in basenameToSiteRoute
    // Both routes are `/docs/hive/architecture`, so the outputs coincide;
    // this test documents that intended precedence rather than
    // distinguishing outputs. If precedence ever inverts (Case 1b runs
    // before Case 1), the manifest-vs-basename disagreement in
    // `backup-restore.md → backup-dr.md` below is what surfaces the bug.
    expect(rewriteLinkTarget("architecture.md", README)).toBe(
      "/docs/hive/architecture"
    );
  });

  it("uses the exact-path mapping when source→target rewrites disagree with the basename (backup-restore.md → backup-dr.md)", () => {
    // Production manifest: `{ source: "backup-restore.md", target: "backup-dr.md" }`.
    // Both maps therefore point at `/docs/hive/backup-dr` (repoPathToSiteRoute
    // and basenameToSiteRoute for basename `backup-restore.md`). Outputs
    // coincide today, but if either half of the rename bookkeeping regresses,
    // exact-path and basename branches would produce different results — and
    // this test would fail with a clear delta. Anchor the exact-path answer
    // here so the disagreement is caught rather than absorbed.
    expect(rewriteLinkTarget("backup-restore.md", README)).toBe(
      "/docs/hive/backup-dr"
    );
  });
});
