import { describe, it, expect } from "vitest";
import { rewriteLinkTarget, rewriteLinks } from "./sync-hive-docs";

// The source file being synced, expressed as its real repo path. Links inside
// the content are resolved relative to this file's directory.
const README = "v2/docs/README.md";
const ADR_README = "v2/docs/adr/README.md";

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
    // v2/docs/ + ../../bin/README.md = bin/README.md at the repo root.
    expect(rewriteLinkTarget("../../bin/README.md", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/bin/README.md"
    );
  });

  it("resolves a single `../` escape into the sibling repo directory", () => {
    // v2/docs/ + ../deploy/README.md = v2/deploy/README.md.
    expect(rewriteLinkTarget("../deploy/README.md", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/v2/deploy/README.md"
    );
  });

  it("sends an in-tree-but-UNSYNCED doc to GitHub (not synced by the script)", () => {
    // manual-provisioning.md is not in the sync allow-list -> GitHub blob URL.
    expect(rewriteLinkTarget("manual-provisioning.md", README)).toBe(
      "https://github.com/kubestellar/hive/blob/v4/v2/docs/manual-provisioning.md"
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
