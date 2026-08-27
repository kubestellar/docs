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
  PROJECT_FOR_NAV,
  parseNavStructures,
  navEntryRoute,
  type NavAliasEntry,
} from "../../scripts/check-internal-links-helpers";

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

// ─────────────────────────────────────────────────────────────────────────
// PROJECT_FOR_NAV — a regression here would silently break every nav
// alias for the affected project.
// ─────────────────────────────────────────────────────────────────────────
describe("PROJECT_FOR_NAV", () => {
  it("maps every documented project name to its docs base path", () => {
    expect(PROJECT_FOR_NAV).toEqual({
      A2A: "docs/a2a",
      MULTI_PLUGIN: "docs/multi-plugin",
      KUBEFLEX: "docs/kubeflex",
      KUBESTELLAR_MCP: "docs/kubestellar-mcp",
      CONSOLE: "docs/console",
      HIVE: "docs/hive",
      KUBESTELLAR: "docs",
    });
  });

  it("uses docs/<slug> for every non-kubestellar project", () => {
    // The root Kubestellar project lives at docs/ (no sub-slug); every
    // other project must be under docs/<slug>. This invariant is what
    // makes route registration deterministic — breaking it would move
    // nav aliases to the wrong path and mass-report broken links.
    for (const [name, base] of Object.entries(PROJECT_FOR_NAV)) {
      if (name === "KUBESTELLAR") {
        expect(base).toBe("docs");
      } else {
        expect(base.startsWith("docs/")).toBe(true);
        expect(base).not.toBe("docs");
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// parseNavStructures — the untangled NAV_STRUCTURE_* regex loop.
// These are the highest-impact tests in this file: a regex regression
// here silently makes the link checker either permissive (invents nav
// routes that don't exist) or over-strict (misses real nav routes and
// mass-reports valid links as broken).
// ─────────────────────────────────────────────────────────────────────────
describe("parseNavStructures", () => {
  it("returns an empty list on empty source", () => {
    expect(parseNavStructures("")).toEqual([]);
  });

  it("returns an empty list when no NAV_STRUCTURE_* declarations are present", () => {
    const src = "const something = { title: 'X' };\nexport default {};\n";
    expect(parseNavStructures(src)).toEqual([]);
  });

  it("skips NAV_STRUCTURE_* blocks whose name is not in projectForNav", () => {
    const src = `
      const NAV_STRUCTURE_UNKNOWN = [
        { 'Intro': 'intro.md' },
]
`;
    expect(parseNavStructures(src)).toEqual([]);
  });

  it("extracts a single bare entry from a HIVE block with no sections", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { 'Introduction': 'readme.md' },
]
`;
    const entries = parseNavStructures(src);
    // Bare-form only (no section).
    expect(entries).toEqual([
      {
        navName: "HIVE",
        base: "docs/hive",
        sectionSlug: "",
        slug: "introduction",
        title: "Introduction",
        file: "readme.md",
      },
    ]);
    expect(navEntryRoute(entries[0])).toBe("/docs/hive/introduction");
  });

  it("emits one entry per section slug PLUS one bare entry", () => {
    // Mirrors the main-script rule: register the route under every
    // section slug AND once with no section prefix.
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { title: 'Overview', items: [ { 'Introduction': 'readme.md' } ] },
]
`;
    const entries = parseNavStructures(src);
    expect(entries).toHaveLength(2);
    expect(new Set(entries.map(navEntryRoute))).toEqual(
      new Set(["/docs/hive/overview/introduction", "/docs/hive/introduction"]),
    );
  });

  it("emits an entry for every (section × entry) combination when a block has multiple sections", () => {
    // The main script over-approximates by registering an entry under
    // EVERY section slug in the block, not just the one it lexically
    // belongs to. That is deliberate (safe: only adds valid routes).
    // Locking that behavior in with a test protects against a "fix"
    // that changes it and mass-reports real links as broken.
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { title: 'Overview', items: [ { 'Intro': 'intro.md' } ] },
        { title: 'Guides', items: [] },
]
`;
    const routes = new Set(parseNavStructures(src).map(navEntryRoute));
    expect(routes).toEqual(
      new Set([
        "/docs/hive/overview/intro",
        "/docs/hive/guides/intro",
        "/docs/hive/intro",
      ]),
    );
  });

  it("skips entries whose file value is an http(s) URL", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { 'External': 'https://example.com/foo.md' },
        { 'Real': 'readme.md' },
]
`;
    const files = parseNavStructures(src).map(e => e.file);
    expect(files).toEqual(["readme.md"]);
  });

  it("skips entries whose file value is a root-absolute path", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { 'Root': '/other-project/readme.md' },
        { 'Real': 'readme.md' },
]
`;
    const files = parseNavStructures(src).map(e => e.file);
    expect(files).toEqual(["readme.md"]);
  });

  it("accepts both single- and double-quoted title:file pairs", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { 'Single': 'a.md' },
        { "Double": "b.md" },
]
`;
    const slugs = parseNavStructures(src).map(e => e.slug);
    expect(slugs).toEqual(["single", "double"]);
  });

  it("accepts .md and .mdx file extensions but nothing else", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { 'A': 'a.md' },
        { 'B': 'b.mdx' },
        { 'C': 'c.txt' },
        { 'D': 'd' },
]
`;
    const files = parseNavStructures(src).map(e => e.file);
    expect(files).toEqual(["a.md", "b.mdx"]);
  });

  it("slugifies titles the same way slugify() does — punctuation collapses", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
    { title: "Whats New", items: [ { 'v1.2.3 release notes': 'v1.md' } ] },
]
`;
    const [sectioned, bare] = parseNavStructures(src);
expect(sectioned.sectionSlug).toBe("whats-new");
    expect(sectioned.slug).toBe("v1-2-3-release-notes");
    expect(bare.sectionSlug).toBe("");
    expect(navEntryRoute(sectioned)).toBe(
  "/docs/hive/whats-new/v1-2-3-release-notes",
    );
  });

  it("independently parses multiple NAV_STRUCTURE_* blocks in one source", () => {
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { 'Intro': 'intro.md' },
]
      const NAV_STRUCTURE_CONSOLE = [
        { 'Home': 'home.md' },
]
`;
    const byNav = new Map<string, string[]>();
    for (const e of parseNavStructures(src)) {
      const list = byNav.get(e.navName) ?? [];
      list.push(navEntryRoute(e));
      byNav.set(e.navName, list);
    }
    expect(byNav.get("HIVE")).toEqual(["/docs/hive/intro"]);
    expect(byNav.get("CONSOLE")).toEqual(["/docs/console/home"]);
  });

  it("handles the KUBESTELLAR base (root docs path, no sub-slug)", () => {
    const src = `
      const NAV_STRUCTURE_KUBESTELLAR = [
        { 'Getting Started': 'getting-started.md' },
]
`;
    const entries = parseNavStructures(src);
    expect(navEntryRoute(entries[0])).toBe("/docs/getting-started");
  });

  it("supports an override of PROJECT_FOR_NAV for injection in tests", () => {
    const src = `
      const NAV_STRUCTURE_CUSTOM = [
        { 'X': 'x.md' },
]
`;
    const entries = parseNavStructures(src, { CUSTOM: "docs/injected" });
    expect(entries).toHaveLength(1);
    expect(entries[0].base).toBe("docs/injected");
    expect(navEntryRoute(entries[0])).toBe("/docs/injected/x");
  });

  it("does not confuse `title:` fields inside NAV_STRUCTURE with entry pairs", () => {
    // Regression guard: the entry-pair regex is quoted-key based, so
    // an unquoted `title: '...'` field must not be picked up as an
    // entry. If someone loosens the entry regex, we want this to fail.
    const src = `
      const NAV_STRUCTURE_HIVE = [
        { title: 'Overview', items: [] },
]
`;
    const entries = parseNavStructures(src);
    expect(entries).toEqual([]);
  });

  it("does not match a NAV_STRUCTURE reference that is not a declaration", () => {
    // Only `const NAV_STRUCTURE_<X>` declarations should be parsed —
    // uses/references to the same name in other positions must be
    // ignored so we don't double-count.
    const src = `
      const other = NAV_STRUCTURE_HIVE;
      export { NAV_STRUCTURE_HIVE };
    `;
    expect(parseNavStructures(src)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// navEntryRoute — trivial but pinned by contract with parseNavStructures.
// ─────────────────────────────────────────────────────────────────────────
describe("navEntryRoute", () => {
  const base: NavAliasEntry = {
    navName: "HIVE",
    base: "docs/hive",
    sectionSlug: "",
    slug: "intro",
    title: "Intro",
    file: "intro.md",
  };

  it("returns /<base>/<slug> when sectionSlug is empty", () => {
    expect(navEntryRoute(base)).toBe("/docs/hive/intro");
  });

  it("returns /<base>/<sectionSlug>/<slug> when sectionSlug is set", () => {
    expect(navEntryRoute({ ...base, sectionSlug: "overview" })).toBe(
      "/docs/hive/overview/intro",
    );
  });
});
