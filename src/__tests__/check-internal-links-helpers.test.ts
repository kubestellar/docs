/**
 * Unit tests for scripts/check-internal-links-helpers.ts.
 *
 * These are the pure helpers behind `npm run check-links`. Together they
 * decide which markdown link targets are validated against the docs route
 * table and how nav titles map to URL slugs. A regression here can either
 * silently accept broken links (bad) or reject valid ones (worse — blocks
 * every PR touching content).
 */
import { describe, it, expect } from "vitest";
import {
  slugify,
  normRoute,
  isExternalOrAnchor,
  ASSET_EXT,
  resolveInternalLink,
} from "../../scripts/check-internal-links-helpers.ts";

// ─────────────────────────────────────────────────────────────────────────
// slugify — must match the rule buildPageMap() uses on NAV_STRUCTURE_* titles
// ─────────────────────────────────────────────────────────────────────────
describe("slugify", () => {
  it("lowercases ASCII", () => {
    expect(slugify("Overview")).toBe("overview");
    expect(slugify("INTRODUCTION")).toBe("introduction");
  });

  it("collapses spaces to a single dash", () => {
    expect(slugify("Getting Started")).toBe("getting-started");
    expect(slugify("A  B   C")).toBe("a-b-c");
  });

  it("replaces punctuation with a single dash", () => {
    expect(slugify("Kubestellar/MCP")).toBe("kubestellar-mcp");
    expect(slugify("What's New?")).toBe("what-s-new");
    expect(slugify("v1.2.3 release")).toBe("v1-2-3-release");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("!Hello!")).toBe("hello");
    expect(slugify("   spaced   ")).toBe("spaced");
    expect(slugify("--dash--")).toBe("dash");
  });

  it("returns empty string for input with no alphanumerics", () => {
    expect(slugify("---")).toBe("");
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("preserves digits", () => {
    expect(slugify("v0.9.10")).toBe("v0-9-10");
    expect(slugify("2026 Roadmap")).toBe("2026-roadmap");
  });

  it("is idempotent on already-slugified input", () => {
    const s = slugify("Some Nav Title");
    expect(slugify(s)).toBe(s);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// normRoute — used before every route set membership check
// ─────────────────────────────────────────────────────────────────────────
describe("normRoute", () => {
  it("drops a single trailing slash", () => {
    expect(normRoute("/docs/hive/")).toBe("/docs/hive");
  });

  it("drops multiple trailing slashes", () => {
    expect(normRoute("/docs/hive///")).toBe("/docs/hive");
  });

  it("leaves paths without a trailing slash unchanged", () => {
    expect(normRoute("/docs/hive")).toBe("/docs/hive");
    expect(normRoute("/docs")).toBe("/docs");
  });

  it("preserves the root path as '/'", () => {
    expect(normRoute("/")).toBe("/");
    expect(normRoute("//")).toBe("/");
    expect(normRoute("///")).toBe("/");
  });

  it("does not touch internal slashes", () => {
    expect(normRoute("/a/b/c")).toBe("/a/b/c");
    expect(normRoute("/a//b/c/")).toBe("/a//b/c");
  });

  it("is idempotent", () => {
    const inputs = ["/docs/hive/", "/", "/a/b/c", "/x/"];
    for (const i of inputs) expect(normRoute(normRoute(i))).toBe(normRoute(i));
  });
});

// ─────────────────────────────────────────────────────────────────────────
// isExternalOrAnchor — gate for what counts as an internal link
// ─────────────────────────────────────────────────────────────────────────
describe("isExternalOrAnchor", () => {
  it("treats the empty string as out of scope", () => {
    expect(isExternalOrAnchor("")).toBe(true);
  });

  it("recognises http, https, mailto and other schemes", () => {
    expect(isExternalOrAnchor("http://example.com")).toBe(true);
    expect(isExternalOrAnchor("https://example.com/path")).toBe(true);
    expect(isExternalOrAnchor("mailto:foo@bar.com")).toBe(true);
    expect(isExternalOrAnchor("ftp://host/file")).toBe(true);
    expect(isExternalOrAnchor("HTTP://EXAMPLE.COM")).toBe(true);
  });

  it("recognises protocol-relative URLs", () => {
    expect(isExternalOrAnchor("//cdn.example.com/lib.js")).toBe(true);
  });

  it("recognises pure in-page anchors", () => {
    expect(isExternalOrAnchor("#section")).toBe(true);
    expect(isExternalOrAnchor("#")).toBe(true);
  });

  it("treats relative paths as internal", () => {
    expect(isExternalOrAnchor("./other")).toBe(false);
    expect(isExternalOrAnchor("../up")).toBe(false);
    expect(isExternalOrAnchor("sibling.md")).toBe(false);
  });

  it("treats root-absolute paths as internal", () => {
    expect(isExternalOrAnchor("/docs/hive")).toBe(false);
    expect(isExternalOrAnchor("/docs/hive/overview.md")).toBe(false);
  });

  it("does NOT match bare paths containing a colon later", () => {
    // A colon can legally appear inside a filename; only a leading scheme
    // (letter followed by scheme chars then ':') marks it external.
    expect(isExternalOrAnchor("./file:name.md")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// ASSET_EXT — file extensions the checker must skip
// ─────────────────────────────────────────────────────────────────────────
describe("ASSET_EXT", () => {
  it("matches common image formats", () => {
    for (const ext of ["png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico"]) {
      expect(ASSET_EXT.test(`foo.${ext}`)).toBe(true);
    }
  });

  it("matches document, video and archive formats", () => {
    for (const ext of ["pdf", "mp4", "webm", "mov", "zip", "gz", "tgz"]) {
      expect(ASSET_EXT.test(`foo.${ext}`)).toBe(true);
    }
  });

  it("matches web asset formats", () => {
    for (const ext of ["css", "js", "woff", "woff2", "ttf", "eot"]) {
      expect(ASSET_EXT.test(`foo.${ext}`)).toBe(true);
    }
  });

  it("is case-insensitive", () => {
    expect(ASSET_EXT.test("Foo.PNG")).toBe(true);
    expect(ASSET_EXT.test("bar.SVG")).toBe(true);
  });

  it("does NOT match markdown extensions", () => {
    expect(ASSET_EXT.test("foo.md")).toBe(false);
    expect(ASSET_EXT.test("foo.mdx")).toBe(false);
  });

  it("does NOT match paths without a recognised extension", () => {
    expect(ASSET_EXT.test("foo")).toBe(false);
    expect(ASSET_EXT.test("foo.html")).toBe(false);
    expect(ASSET_EXT.test("foo.txt")).toBe(false);
  });

  it("only matches at end of string", () => {
    // trailing chars after the extension should defeat the match
    expect(ASSET_EXT.test("foo.png?raw=1")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// resolveInternalLink — the composed transformation that produces the route
// the checker actually looks up in the valid-route set.
// ─────────────────────────────────────────────────────────────────────────
describe("resolveInternalLink", () => {
  const base = "/docs/hive/overview";

  it("returns null for out-of-scope links", () => {
    expect(resolveInternalLink("", base)).toBeNull();
    expect(resolveInternalLink("http://x.com", base)).toBeNull();
    expect(resolveInternalLink("mailto:a@b", base)).toBeNull();
    expect(resolveInternalLink("//cdn/x.js", base)).toBeNull();
    expect(resolveInternalLink("#anchor", base)).toBeNull();
  });

  it("returns null for asset extensions", () => {
    expect(resolveInternalLink("images/foo.png", base)).toBeNull();
    expect(resolveInternalLink("./diagram.svg", base)).toBeNull();
    expect(resolveInternalLink("/docs/hive/architecture.pdf", base)).toBeNull();
  });

  it("returns null when only a query or fragment remains", () => {
    expect(resolveInternalLink("?foo=1", base)).toBeNull();
    // '#anchor' already handled by isExternalOrAnchor
  });

  it("resolves a bare filename against the containing page's directory", () => {
    expect(resolveInternalLink("intro.md", base)).toBe("/docs/hive/intro");
    expect(resolveInternalLink("intro.mdx", base)).toBe("/docs/hive/intro");
  });

  it("resolves './' relative links", () => {
    expect(resolveInternalLink("./intro.md", base)).toBe("/docs/hive/intro");
  });

  it("resolves '../' up-level links", () => {
    expect(resolveInternalLink("../other/page.md", base)).toBe(
      "/docs/other/page",
    );
  });

  it("keeps root-absolute paths unchanged (aside from stripping .md/.mdx)", () => {
    expect(resolveInternalLink("/docs/console/overview.md", base)).toBe(
      "/docs/console/overview",
    );
    expect(resolveInternalLink("/docs/console/overview", base)).toBe(
      "/docs/console/overview",
    );
  });

  it("strips query strings and fragments before resolving", () => {
    expect(resolveInternalLink("intro.md?v=1", base)).toBe("/docs/hive/intro");
    expect(resolveInternalLink("intro.md#section", base)).toBe(
      "/docs/hive/intro",
    );
    expect(resolveInternalLink("/docs/x?v=1#top", base)).toBe("/docs/x");
  });

  it("normalises redundant path segments via path.posix.normalize", () => {
    expect(resolveInternalLink("./sub/../intro.md", base)).toBe(
      "/docs/hive/intro",
    );
    expect(resolveInternalLink("sub/./intro.md", base)).toBe(
      "/docs/hive/sub/intro",
    );
  });

  it("strips .md or .mdx suffix regardless of resolution path", () => {
    expect(resolveInternalLink("../other/page.mdx", base)).toBe(
      "/docs/other/page",
    );
    expect(resolveInternalLink("/docs/a/b.md", base)).toBe("/docs/a/b");
  });

  it("produces different results for different base pages (relative resolution)", () => {
    const a = resolveInternalLink("intro.md", "/docs/hive/overview");
    const b = resolveInternalLink("intro.md", "/docs/console/overview");
    expect(a).toBe("/docs/hive/intro");
    expect(b).toBe("/docs/console/intro");
  });
});
