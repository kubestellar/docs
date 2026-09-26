import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import {
  ASSET_EXT,
  isExternalOrAnchor,
  navAliasEntries,
  navEntryRoute,
  navSourcesFor,
  normRoute,
  parseNavStructure,
  resolveInternalLink,
  slugify,
  type NavAliasEntry,
} from "./check-internal-links-helpers";
import { PROJECTS } from "../src/config/versions/lookup";
import { GENERAL_SECTIONS } from "../src/lib/nav";

/**
 * Coverage for scripts/check-internal-links-helpers.ts.
 *
 * The helpers module hosts the nav.yaml → route derivation and link-resolution rules that the internal-
 * link CI check relies on. Any regression here silently makes the checker
 * either permissive (invents nav routes that don't exist) or over-strict
 * (misses real nav routes, reports valid links as broken).
 */

describe("slugify", () => {
  it("lowercases input", () => {
    expect(slugify("HelloWorld")).toBe("helloworld");
  });

  it("collapses runs of non-alphanumerics to a single dash", () => {
    expect(slugify("Getting  Started!")).toBe("getting-started");
    expect(slugify("A___B..C")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("--Contributing to Docs--")).toBe("contributing-to-docs");
    expect(slugify("!!!Overview!!!")).toBe("overview");
  });

  it("returns an empty string for input with no alphanumerics", () => {
    expect(slugify("---")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("preserves already-slugified strings", () => {
    expect(slugify("kubestellar-mcp")).toBe("kubestellar-mcp");
  });
});

describe("normRoute", () => {
  it("strips a single trailing slash", () => {
    expect(normRoute("/docs/hive/")).toBe("/docs/hive");
  });

  it("strips multiple trailing slashes", () => {
    expect(normRoute("/docs/hive///")).toBe("/docs/hive");
  });

  it("preserves the root '/' route", () => {
    expect(normRoute("/")).toBe("/");
    expect(normRoute("////")).toBe("/");
  });

  it("leaves a route without a trailing slash unchanged", () => {
    expect(normRoute("/docs/hive/overview")).toBe("/docs/hive/overview");
  });
});

describe("isExternalOrAnchor", () => {
  it("treats the empty string as skippable", () => {
    expect(isExternalOrAnchor("")).toBe(true);
  });

  it("skips URIs with an explicit scheme", () => {
    expect(isExternalOrAnchor("http://example.com")).toBe(true);
    expect(isExternalOrAnchor("https://example.com")).toBe(true);
    expect(isExternalOrAnchor("mailto:x@example.com")).toBe(true);
    expect(isExternalOrAnchor("ftp://example.com/")).toBe(true);
  });

  it("skips scheme-relative URLs", () => {
    expect(isExternalOrAnchor("//cdn.example.com/x.js")).toBe(true);
  });

  it("skips pure in-page fragment identifiers", () => {
    expect(isExternalOrAnchor("#section")).toBe(true);
  });

  it("does NOT skip site-relative or relative doc links", () => {
    expect(isExternalOrAnchor("/docs/hive")).toBe(false);
    expect(isExternalOrAnchor("../getting-started.md")).toBe(false);
    expect(isExternalOrAnchor("overview.md")).toBe(false);
  });
});

describe("ASSET_EXT", () => {
  it("matches common image, video, and font extensions (case-insensitive)", () => {
    for (const ext of [
      "logo.png",
      "logo.JPG",
      "diagram.svg",
      "cover.WebP",
      "spec.pdf",
      "demo.mp4",
      "bundle.js",
      "styles.css",
      "font.woff2",
    ]) {
      expect(ASSET_EXT.test(ext)).toBe(true);
    }
  });

  it("does NOT match .md or .mdx doc routes", () => {
    expect(ASSET_EXT.test("overview.md")).toBe(false);
    expect(ASSET_EXT.test("overview.mdx")).toBe(false);
  });

  it("does NOT match extensionless paths", () => {
    expect(ASSET_EXT.test("/docs/hive/overview")).toBe(false);
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

describe("navEntryRoute", () => {
  const base: NavAliasEntry = {
    navName: "HIVE",
    base: "docs/hive",
    sectionSlug: "",
    slug: "overview",
    title: "Overview",
    file: "overview.md",
  };

  it("emits a section-scoped route when sectionSlug is set", () => {
    expect(navEntryRoute({ ...base, sectionSlug: "ops" })).toBe(
      "/docs/hive/ops/overview",
    );
  });

  it("emits a bare route when sectionSlug is empty", () => {
    expect(navEntryRoute(base)).toBe("/docs/hive/overview");
  });
});

describe("resolveInternalLink", () => {
  it("returns null for external, anchor, or empty links", () => {
    expect(resolveInternalLink("", "/docs/hive/overview")).toBeNull();
    expect(
      resolveInternalLink("https://example.com", "/docs/hive/overview"),
    ).toBeNull();
    expect(resolveInternalLink("#section", "/docs/hive/overview")).toBeNull();
  });

  it("returns null for asset extensions", () => {
    expect(
      resolveInternalLink("./diagram.png", "/docs/hive/overview"),
    ).toBeNull();
    expect(
      resolveInternalLink("/img/logo.svg", "/docs/hive/overview"),
    ).toBeNull();
  });

  it("returns null when only a query or fragment remains after stripping", () => {
    // "?x=1" -> pathPart becomes "" -> return null
    expect(resolveInternalLink("?x=1", "/docs/hive/overview")).toBeNull();
  });

  it("resolves relative links against baseRoute's directory", () => {
    expect(
      resolveInternalLink("getting-started.md", "/docs/hive/overview"),
    ).toBe("/docs/hive/getting-started");
  });

  it("resolves parent-relative links", () => {
    expect(
      resolveInternalLink("../console/overview.md", "/docs/hive/overview"),
    ).toBe("/docs/console/overview");
  });

  it("keeps absolute-path links intact (no join)", () => {
    expect(
      resolveInternalLink("/docs/hive/other.md", "/docs/console/overview"),
    ).toBe("/docs/hive/other");
  });

  it("strips a ?query suffix before resolving", () => {
    expect(
      resolveInternalLink("target.md?foo=bar", "/docs/hive/overview"),
    ).toBe("/docs/hive/target");
  });

  it("strips a #fragment suffix before resolving", () => {
    expect(
      resolveInternalLink("target.md#anchor", "/docs/hive/overview"),
    ).toBe("/docs/hive/target");
  });

  it("strips a .mdx extension too", () => {
    expect(
      resolveInternalLink("tutorial.mdx", "/docs/hive/guides/overview"),
    ).toBe("/docs/hive/guides/tutorial");
  });

  it("leaves extensionless internal links alone (no double-strip)", () => {
    expect(
      resolveInternalLink("./target", "/docs/hive/overview"),
    ).toBe("/docs/hive/target");
  });
});
