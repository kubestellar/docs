import { describe, it, expect } from "vitest";
import { rewriteLinkTarget, rewriteLinks } from "./sync-hive-docs";

// The source file being synced, expressed as its real repo path. Links inside
// the content are resolved relative to this file's directory.
const README = "src/docs/README.md";
const ADR_README = "src/docs/adr/README.md";

describe("rewriteLinkTarget — Case 1: in-tree synced docs -> site route", () => {
  it("rewrites a bare sibling link to the synced flat route", () => {
    // architecture.md is synced -> /docs/hive/architecture (extension stripped).
    expect(rewriteLinkTarget("architecture.md", README)).toBe(
      "/docs/hive/architecture"
    );
  });

  it("rewrites a site-adjusted `../` link back to the internal route (recovery)", () => {
    // Hive source hand-edited to `../architecture.md` still resolves internally.
    expect(rewriteLinkTarget("../architecture.md", README)).toBe(
      "/docs/hive/architecture"
    );
  });

  it("rewrites a synced ADR sibling from adr/README.md to its adr/ route", () => {
    expect(
      rewriteLinkTarget("0001-record-architecture-decisions.md", ADR_README)
    ).toBe("/docs/hive/adr/0001-record-architecture-decisions");
  });

  it("preserves an #anchor on an in-tree link", () => {
    expect(rewriteLinkTarget("architecture.md#the-governor-loop", README)).toBe(
      "/docs/hive/architecture#the-governor-loop"
    );
  });
});

describe("rewriteLinkTarget — Case 2: escapes / unsynced -> absolute GitHub URL", () => {
  it("resolves `../../` escape to the repo-root path on the sync branch", () => {
    // src/docs/ + ../../bin/README.md = bin/README.md at the repo root.
    expect(rewriteLinkTarget("../../bin/README.md", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/bin/README.md"
    );
  });

  it("resolves a single `../` escape into the sibling repo directory", () => {
    // src/docs/ + ../deploy/README.md = src/deploy/README.md.
    expect(rewriteLinkTarget("../deploy/README.md", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/src/deploy/README.md"
    );
  });

  it("sends an in-tree-but-UNSYNCED doc to GitHub (not synced by the script)", () => {
    // env-vars.md exists in hive src/docs but is not on the sync allow-list,
    // so links to it resolve to a GitHub blob URL rather than a site route.
    expect(rewriteLinkTarget("env-vars.md", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/src/docs/env-vars.md"
    );
  });

  it("routes manual-provisioning.md internally now that it is synced", () => {
    // manual-provisioning.md was migrated onto the sync manifest, so its
    // basename resolves to the internal site route (Case 1b recovery) instead
    // of a GitHub blob URL.
    expect(rewriteLinkTarget("manual-provisioning.md", README)).toBe(
      "/docs/hive/manual-provisioning"
    );
  });

  it("handles a JSON (non-markdown) escape target", () => {
    expect(rewriteLinkTarget("../../dashboard/openapi.json", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/dashboard/openapi.json"
    );
  });
});

describe("rewriteLinkTarget — left untouched", () => {
  it("leaves absolute http(s) URLs alone", () => {
    const url = "https://hive.kubestellar.io";
    expect(rewriteLinkTarget(url, README)).toBe(url);
  });

  it("leaves an already-rewritten GitHub blob URL alone (idempotent)", () => {
    const url = "https://github.com/kubestellar/hive/blob/v4/bin/README.md";
    expect(rewriteLinkTarget(url, README)).toBe(url);
  });

  it("leaves an already-rewritten internal site route alone (idempotent)", () => {
    expect(rewriteLinkTarget("/docs/hive/architecture", README)).toBe(
      "/docs/hive/architecture"
    );
  });

  it("leaves mailto: and pure #anchors alone", () => {
    expect(rewriteLinkTarget("mailto:x@example.com", README)).toBe(
      "mailto:x@example.com"
    );
    expect(rewriteLinkTarget("#section", README)).toBe("#section");
  });
});

describe("rewriteLinks — over full markdown content", () => {
  it("rewrites inline links and preserves link text and titles", () => {
    const md =
      'See [Architecture](architecture.md) and [bin](../../bin/README.md "index").';
    const out = rewriteLinks(md, README);
    expect(out).toContain("[Architecture](/docs/hive/architecture)");
    expect(out).toContain(
      '[bin](https://github.com/kubestellar/hive/blob/v4/bin/README.md "index")'
    );
  });

  it("is idempotent — running twice yields identical output", () => {
    const md =
      "- [A](architecture.md)\n- [B](../../bin/README.md)\n- [C](https://x.io)\n";
    const once = rewriteLinks(md, README);
    const twice = rewriteLinks(once, README);
    expect(twice).toBe(once);
  });

  it("rewrites reference-style link definitions", () => {
    const md = "Text [arch].\n\n[arch]: architecture.md\n";
    const out = rewriteLinks(md, README);
    expect(out).toContain("[arch]: /docs/hive/architecture");
  });
});

// ─── Sync-root drift guard ───────────────────────────────────────────
//
// The `rewriteLinkTarget` fixtures in Case 2 (and every source-path fixture
// in this file) assume the hive-side sync root is `src/docs/`. That root is
// currently spelled out in two module-scope constants in
// `scripts/sync-hive-docs.ts` (`rawBase`, `canonicalBase`). If either is
// migrated to a different root without also updating this test file's
// fixtures, half the Case-2 URLs go wrong at once — exactly the drift
// tracked in kubestellar/docs#6626 (`v2/docs/` residue that outlived the
// migration to `src/docs/`).
//
// The guard below reads the production source and asserts that (a) the
// current `src/docs` root still appears in it and (b) no stale `v2/docs`
// prefix is left behind. A future migration will fail this test loudly and
// force the same PR to update the Case-2 fixtures.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

describe("sync-hive-docs.ts — sync-root prefix drift guard", () => {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SOURCE = readFileSync(join(HERE, "sync-hive-docs.ts"), "utf8");

  it("still spells the hive-side sync root as `src/docs`", () => {
    // If this fails, the sync root moved. Fix the Case-2 fixtures above
    // (all four `src/docs/…` / `src/deploy/…` strings) to match, then
    // update the expectation here.
    expect(SOURCE).toMatch(/branch\}\/src\/docs/);
    expect(SOURCE).toMatch(/`src\/docs\/\$\{f\.source\}`/);
  });

  it("does not leak the old `v2/docs` prefix", () => {
    // Historical value; catches the specific regression pattern from
    // kubestellar/docs#6626 (test-side stragglers after the sync-root
    // migration). Widen if a legitimate reason to reference `v2/docs`
    // ever returns.
    expect(SOURCE).not.toContain("v2/docs");
  });
});
