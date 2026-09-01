import { describe, expect, it } from "vitest";
import {
  ASSET_EXT,
  PROJECT_FOR_NAV,
  isExternalOrAnchor,
  navEntryRoute,
  normRoute,
  parseNavStructures,
  resolveInternalLink,
  slugify,
  type NavAliasEntry,
} from "./check-internal-links-helpers";

/**
 * Coverage for scripts/check-internal-links-helpers.ts.
 *
 * The helpers module is currently at 0% coverage even though it hosts the
 * regex-heavy parsing logic and link-resolution rules that the internal-
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

describe("PROJECT_FOR_NAV", () => {
  it("maps the default KUBESTELLAR nav to bare 'docs' (no project subpath)", () => {
    expect(PROJECT_FOR_NAV.KUBESTELLAR).toBe("docs");
  });

  it("maps each project nav to its base path", () => {
    expect(PROJECT_FOR_NAV.HIVE).toBe("docs/hive");
    expect(PROJECT_FOR_NAV.CONSOLE).toBe("docs/console");
    expect(PROJECT_FOR_NAV.KUBEFLEX).toBe("docs/kubeflex");
    expect(PROJECT_FOR_NAV.KUBESTELLAR_MCP).toBe("docs/kubestellar-mcp");
    expect(PROJECT_FOR_NAV.A2A).toBe("docs/a2a");
    expect(PROJECT_FOR_NAV.MULTI_PLUGIN).toBe("docs/multi-plugin");
  });
});

describe("parseNavStructures", () => {
  it("returns [] when the source has no NAV_STRUCTURE_ blocks", () => {
    expect(parseNavStructures("const foo = 1")).toEqual([]);
  });

  it("skips NAV_STRUCTURE_ blocks whose suffix is not in PROJECT_FOR_NAV", () => {
    const src = `
      const NAV_STRUCTURE_UNKNOWN: X = [
        { title: 'Overview', items: [{ 'Hello': 'hello.md' }] },
]
    `;
    expect(parseNavStructures(src)).toEqual([]);
  });

  it("extracts entries and emits one row per section plus one bare row", () => {
    const src = `
      const NAV_STRUCTURE_HIVE: X = [
        { title: 'Overview', items: [
            { 'Getting Started': 'getting-started.md' },
        ] },
]
    `;
    const entries = parseNavStructures(src);
    // One per section + one bare = 2 rows
    expect(entries).toHaveLength(2);
    const sectionRow = entries.find((e) => e.sectionSlug === "overview");
    const bareRow = entries.find((e) => e.sectionSlug === "");
    expect(sectionRow).toEqual<NavAliasEntry>({
      navName: "HIVE",
      base: "docs/hive",
      sectionSlug: "overview",
      slug: "getting-started",
      title: "Getting Started",
      file: "getting-started.md",
    });
    expect(bareRow).toEqual<NavAliasEntry>({
      navName: "HIVE",
      base: "docs/hive",
      sectionSlug: "",
      slug: "getting-started",
      title: "Getting Started",
      file: "getting-started.md",
    });
  });

  it("accepts both single- and double-quoted title/file pairs", () => {
    const src = `
      const NAV_STRUCTURE_HIVE: X = [
        { title: "Ops", items: [
            { "Deploy": "deploy.md" },
            { 'Rollback': 'rollback.md' },
        ] },
]
    `;
    const slugs = parseNavStructures(src)
      .map((e) => e.slug)
      .sort();
    expect(slugs).toEqual(["deploy", "deploy", "rollback", "rollback"]);
  });

  it("skips entries whose file value is an http URL or an absolute path", () => {
    const src = `
      const NAV_STRUCTURE_HIVE: X = [
        { title: 'Links', items: [
            { 'External': 'https://example.com/x.md' },
            { 'Absolute': '/other/place.md' },
            { 'Real': 'real.md' },
        ] },
]
    `;
    const files = parseNavStructures(src).map((e) => e.file);
    expect(files).not.toContain("https://example.com/x.md");
    expect(files).not.toContain("/other/place.md");
    expect(files.filter((f) => f === "real.md")).toHaveLength(2); // section + bare
  });

  it("supports .mdx entries", () => {
    const src = `
      const NAV_STRUCTURE_HIVE: X = [
        { title: 'Guides', items: [
            { 'Tutorial': 'tutorial.mdx' },
        ] },
]
    `;
    const entries = parseNavStructures(src);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].file).toBe("tutorial.mdx");
  });

  it("emits an entry per section for blocks with multiple sections", () => {
    const src = `
      const NAV_STRUCTURE_HIVE: X = [
        { title: 'Overview', items: [] },
        { title: 'Ops', items: [
            { 'Deploy': 'deploy.md' },
        ] },
]
    `;
    const entries = parseNavStructures(src);
    const sections = entries.map((e) => e.sectionSlug).sort();
    // 2 sections + 1 bare = 3 rows for the single 'deploy' entry
    expect(sections).toEqual(["", "ops", "overview"]);
  });

  it("honors a custom projectForNav override", () => {
    const src = `
      const NAV_STRUCTURE_HIVE: X = [
        { title: 'Overview', items: [{ 'A': 'a.md' }] },
]
    `;
    // Override with a *different* base to prove the override is respected.
    const custom = { HIVE: "docs/custom-hive" };
    const entries = parseNavStructures(src, custom);
    expect(entries.every((e) => e.base === "docs/custom-hive")).toBe(true);
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
