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
import { existsSync } from "node:fs";
import {
  slugify,
  normRoute,
  isExternalOrAnchor,
  ASSET_EXT,
  resolveInternalLink,
  navAliasEntries,
  navEntryRoute,
  navSourcesFor,
  parseNavStructure,
  type NavAliasEntry,
} from "../../scripts/check-internal-links-helpers";
import { PROJECTS } from "../config/versions/lookup";
import { GENERAL_SECTIONS } from "../lib/nav";

// ─────────────────────────────────────────────────────────────────────────
// slugify — must match the rule buildPageMap() uses on nav.yaml titles
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
// navSourcesFor — derives the nav.yaml list from PROJECTS + GENERAL_SECTIONS
// (kubestellar/docs#7080). A regression here silently drops a project's nav
// aliases from the route table and mass-reports its links as broken.
// ─────────────────────────────────────────────────────────────────────────
describe("navSourcesFor", () => {
  const projects = {
    kubestellar: { id: "kubestellar", basePath: "", navPath: "docs/content/nav.yaml" },
    console: { id: "console", basePath: "console", navPath: "docs/content/console/nav.yaml" },
  };

  it("maps the root project (empty basePath) to bare 'docs'", () => {
    const [ks] = navSourcesFor(projects, []);
    expect(ks).toEqual({ name: "kubestellar", base: "docs", navPath: "docs/content/nav.yaml" });
  });

  it("maps every other project to docs/<basePath> and its own navPath", () => {
    const sources = navSourcesFor(projects, []);
    expect(sources[1]).toEqual({ name: "console", base: "docs/console", navPath: "docs/content/console/nav.yaml" });
  });

  it("appends one 'docs'-based source per general section, under <contentRoot>/<section>/nav.yaml", () => {
    const sources = navSourcesFor(projects, ["contributing", "news"]);
    expect(sources.slice(2)).toEqual([
      { name: "contributing", base: "docs", navPath: "docs/content/contributing/nav.yaml" },
      { name: "news", base: "docs", navPath: "docs/content/news/nav.yaml" },
    ]);
  });

  it("covers every real project and general section with an existing nav.yaml", () => {
    for (const s of navSourcesFor(PROJECTS, GENERAL_SECTIONS)) {
      expect(existsSync(s.navPath), `${s.name}: ${s.navPath}`).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// navAliasEntries / parseNavStructure — nav.yaml → nav-alias routes.
// These are the highest-impact tests in this file: a regression here
// silently makes the link checker either permissive (invents nav routes
// that don't exist) or over-strict (misses real nav routes and mass-
// reports valid links as broken).
// ─────────────────────────────────────────────────────────────────────────
const hive = { name: "hive", base: "docs/hive", navPath: "docs/content/hive/nav.yaml" };

describe("navAliasEntries", () => {
  it("returns an empty list for an empty nav", () => {
    expect(navAliasEntries(hive, [])).toEqual([]);
  });

  it("emits one entry per section slug PLUS one bare entry", () => {
    // Mirrors the main-script rule: register the route under every
    // section slug AND once with no section prefix.
    const entries = navAliasEntries(hive, [
      { title: "Overview", items: [{ Introduction: "readme.md" }] },
    ]);
    expect(entries).toEqual([
      { navName: "hive", base: "docs/hive", sectionSlug: "overview", slug: "introduction", title: "Introduction", file: "readme.md" },
      { navName: "hive", base: "docs/hive", sectionSlug: "", slug: "introduction", title: "Introduction", file: "readme.md" },
    ]);
    expect(new Set(entries.map(navEntryRoute))).toEqual(
      new Set(["/docs/hive/overview/introduction", "/docs/hive/introduction"]),
    );
  });

  it("emits an entry for every (section × entry) combination when a nav has multiple sections", () => {
    // The main script over-approximates by registering an entry under
    // EVERY section slug in the nav, not just the one it lexically
    // belongs to. That is deliberate (safe: only adds valid routes).
    // Locking that behavior in with a test protects against a "fix"
    // that changes it and mass-reports real links as broken.
    const routes = new Set(
      navAliasEntries(hive, [
        { title: "Overview", items: [{ Intro: "intro.md" }] },
        { title: "Guides", items: [] },
      ]).map(navEntryRoute),
    );
    expect(routes).toEqual(
      new Set(["/docs/hive/overview/intro", "/docs/hive/guides/intro", "/docs/hive/intro"]),
    );
  });

  it("descends into nested folders and emits their leaf pages", () => {
    const files = navAliasEntries(hive, [
      { title: "S", items: [{ Folder: [{ Leaf: "a/leaf.md" }, { Deeper: [{ Deep: "a/b/deep.md" }] }] }] },
    ]).map((e) => e.file);
    expect(new Set(files)).toEqual(new Set(["a/leaf.md", "a/b/deep.md"]));
  });

  it("skips entries whose file value is an http(s) URL", () => {
    const files = navAliasEntries(hive, [
      { title: "S", items: [{ External: "https://example.com/foo.md" }, { Real: "readme.md" }] },
    ]).map((e) => e.file);
    expect(new Set(files)).toEqual(new Set(["readme.md"]));
  });

  it("skips entries whose file value is a root-absolute path", () => {
    const files = navAliasEntries(hive, [
      { title: "S", items: [{ Root: "/other-project/readme.md" }, { Real: "readme.md" }] },
    ]).map((e) => e.file);
    expect(new Set(files)).toEqual(new Set(["readme.md"]));
  });

  it("accepts .md and .mdx file extensions but nothing else", () => {
    const files = navAliasEntries(hive, [
      { title: "S", items: [{ A: "a.md" }, { B: "b.mdx" }, { C: "c.txt" }, { D: "d" }] },
    ]).map((e) => e.file);
    expect(new Set(files)).toEqual(new Set(["a.md", "b.mdx"]));
  });

  it("ignores bare-string items (they have no title to alias from)", () => {
    expect(navAliasEntries(hive, [{ title: "S", items: ["readme.md"] }])).toEqual([]);
  });

  it("slugifies titles the same way slugify() does — punctuation collapses", () => {
    const [sectioned, bare] = navAliasEntries(hive, [
      { title: "Whats New", items: [{ "v1.2.3 release notes": "v1.md" }] },
    ]);
    expect(sectioned.sectionSlug).toBe("whats-new");
    expect(sectioned.slug).toBe("v1-2-3-release-notes");
    expect(bare.sectionSlug).toBe("");
    expect(navEntryRoute(sectioned)).toBe("/docs/hive/whats-new/v1-2-3-release-notes");
  });

  it("handles the root docs base (no sub-slug)", () => {
    const [entry] = navAliasEntries(
      { name: "kubestellar", base: "docs" },
      [{ title: "S", items: [{ "Getting Started": "getting-started.md" }] }],
    );
    expect(navEntryRoute(entry)).toBe("/docs/s/getting-started");
  });
});

describe("parseNavStructure", () => {
  it("parses YAML and yields the same entries as navAliasEntries", () => {
    const yaml = "- title: Overview\n  items:\n    - Introduction: readme.md\n";
    expect(parseNavStructure(hive, yaml).map(navEntryRoute)).toEqual([
      "/docs/hive/overview/introduction",
      "/docs/hive/introduction",
    ]);
  });

  it("rejects a malformed nav with a NavFileError naming the file", () => {
    expect(() => parseNavStructure(hive, "- title: X\n  items: nope\n")).toThrow(
      /Invalid sidebar nav file docs\/content\/hive\/nav\.yaml: .*"items" must be a list/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// navEntryRoute — trivial but pinned by contract with navAliasEntries.
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
