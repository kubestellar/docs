/**
 * Unit tests for scripts/check-aw-lock-drift.mjs — frontmatter hash
 * computation and lock-file hash extraction, which gate the
 * check-aw-lock-drift.yml CI workflow (kubestellar/docs#7423 stale-lock
 * class of failure). Prior to this file these pure functions had zero
 * test coverage.
 */
import { describe, it, expect } from "vitest";
import { computeFrontmatterHash, extractLockHash } from "./check-aw-lock-drift.mjs";

function withFrontmatter(frontmatter, body = "") {
  return `---\n${frontmatter}\n---\n${body}`;
}

describe("computeFrontmatterHash", () => {
  it("is deterministic for the same content", () => {
    const content = withFrontmatter("on: push", "echo hi");
    expect(computeFrontmatterHash(content)).toBe(computeFrontmatterHash(content));
  });

  it("changes when the frontmatter text changes", () => {
    const a = computeFrontmatterHash(withFrontmatter("on: push"));
    const b = computeFrontmatterHash(withFrontmatter("on: pull_request"));
    expect(a).not.toBe(b);
  });

  it("is stable across \\r\\n vs \\n line endings", () => {
    const lf = withFrontmatter("on: push", "echo hi");
    const crlf = lf.replace(/\n/g, "\r\n");
    expect(computeFrontmatterHash(crlf)).toBe(computeFrontmatterHash(lf));
  });

  it("folds in env./vars. template expressions from the body", () => {
    const base = withFrontmatter("on: push", "run: ${{ env.FOO }}");
    const changedExpr = withFrontmatter("on: push", "run: ${{ env.BAR }}");
    expect(computeFrontmatterHash(base)).not.toBe(computeFrontmatterHash(changedExpr));
  });

  it("ignores non env./vars. template expressions (e.g. secrets.*) in the body", () => {
    const withSecret = withFrontmatter("on: push", "run: ${{ secrets.TOKEN }}");
    const withoutSecret = withFrontmatter("on: push", "run: plain text");
    expect(computeFrontmatterHash(withSecret)).toBe(computeFrontmatterHash(withoutSecret));
  });

  it("dedupes and sorts repeated template expressions", () => {
    const content = withFrontmatter("on: push", "${{ env.B }} ${{ env.A }} ${{ env.A }}");
    // Order of occurrence must not matter.
    const reordered = withFrontmatter("on: push", "${{ env.A }} ${{ env.B }} ${{ env.A }}");
    expect(computeFrontmatterHash(content)).toBe(computeFrontmatterHash(reordered));
  });

  it("treats content with no frontmatter delimiter as frontmatter-less", () => {
    const noFrontmatter = "just a plain markdown file\nwith no frontmatter";
    // Must not throw, and must differ from a file that does have frontmatter.
    expect(() => computeFrontmatterHash(noFrontmatter)).not.toThrow();
    expect(computeFrontmatterHash(noFrontmatter)).not.toBe(
      computeFrontmatterHash(withFrontmatter("on: push"))
    );
  });

  it("throws when frontmatter is never closed", () => {
    const unclosed = "---\non: push\nno closing delimiter";
    expect(() => computeFrontmatterHash(unclosed)).toThrow(/frontmatter not properly closed/);
  });
});

describe("extractLockHash", () => {
  it("reads the hash from a gh-aw-metadata JSON comment", () => {
    const lock = `# gh-aw-metadata: {"frontmatter_hash":"abc123"}\nname: test\n`;
    expect(extractLockHash(lock)).toBe("abc123");
  });

  it("falls back to the legacy frontmatter-hash comment format", () => {
    const lock = `# frontmatter-hash: def456\nname: test\n`;
    expect(extractLockHash(lock)).toBe("def456");
  });

  it("prefers gh-aw-metadata over a legacy line when both are present", () => {
    const lock = `# gh-aw-metadata: {"frontmatter_hash":"new"}\n# frontmatter-hash: old\n`;
    expect(extractLockHash(lock)).toBe("new");
  });

  it("falls through to the legacy format when the metadata JSON is malformed", () => {
    const lock = `# gh-aw-metadata: {not valid json}\n# frontmatter-hash: fallback\n`;
    expect(extractLockHash(lock)).toBe("fallback");
  });

  it("falls through to the legacy format when metadata JSON has no frontmatter_hash key", () => {
    const lock = `# gh-aw-metadata: {"other_field":"x"}\n# frontmatter-hash: fallback2\n`;
    expect(extractLockHash(lock)).toBe("fallback2");
  });

  it("returns an empty string when no recognizable hash comment is present", () => {
    const lock = `name: test\non: push\n`;
    expect(extractLockHash(lock)).toBe("");
  });
});
