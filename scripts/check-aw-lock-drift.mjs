#!/usr/bin/env node

/**
 * Fails when a gh-aw workflow source (.github/workflows/<name>.md) has
 * frontmatter that no longer matches the frontmatter_hash recorded in its
 * compiled <name>.lock.yml. A stale lock file makes every run fail activation
 * with E009 CONFIG_HASH_MISMATCH (kubestellar/docs#7423).
 *
 * The hash is recomputed the way gh-aw does (frontmatter_hash_pure.cjs):
 * sha256 of canonical JSON of {"frontmatter-text", "template-expressions"}.
 * Hash comparison only; the gh aw extension is not required.
 *
 * Usage:
 *   node scripts/check-aw-lock-drift.mjs
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = join(__dirname, "..", ".github", "workflows");

function extractFrontmatterAndBody(content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  if (lines[0].trim() !== "---") return { frontmatter: "", body: lines.join("\n") };
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) throw new Error("frontmatter not properly closed");
  return {
    frontmatter: lines.slice(1, end).join("\n"),
    body: lines.slice(end + 1).join("\n"),
  };
}

function relevantExpressions(body) {
  const found = new Set();
  for (const m of body.matchAll(/\$\{\{([^}]+)\}\}/g)) {
    const inner = m[1].trim();
    if (inner.includes("env.") || inner.includes("vars.")) found.add(m[0]);
  }
  return [...found].sort();
}

// Keys sorted, compact JSON: matches gh-aw's marshalSorted for this shape.
function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function computeFrontmatterHash(mdContent) {
  const { frontmatter, body } = extractFrontmatterAndBody(mdContent);
  const canonical = { "frontmatter-text": frontmatter.trim() };
  const expressions = relevantExpressions(body);
  if (expressions.length > 0) canonical["template-expressions"] = expressions;
  return createHash("sha256").update(canonicalJSON(canonical), "utf8").digest("hex");
}

export function extractLockHash(lockContent) {
  for (const line of lockContent.split("\n")) {
    const meta = line.match(/^#\s*gh-aw-metadata:\s*(\{.+\})/);
    if (meta) {
      try {
        const h = JSON.parse(meta[1]).frontmatter_hash;
        if (h) return h;
      } catch {
        // fall through to legacy format
      }
    }
    if (line.startsWith("# frontmatter-hash: ")) return line.slice(20).trim();
  }
  return "";
}

function main() {
  const stale = [];
  let checked = 0;

  for (const file of readdirSync(WORKFLOWS_DIR).sort()) {
    if (!file.endsWith(".md")) continue;
    const name = file.slice(0, -3);
    const lockFile = `${name}.lock.yml`;
    if (!existsSync(join(WORKFLOWS_DIR, lockFile))) continue;

    const recorded = extractLockHash(readFileSync(join(WORKFLOWS_DIR, lockFile), "utf8"));
    if (!recorded) {
      console.log(`skip  ${lockFile}: no frontmatter_hash recorded`);
      continue;
    }
    checked++;
    const actual = computeFrontmatterHash(readFileSync(join(WORKFLOWS_DIR, file), "utf8"));
    if (actual === recorded) {
      console.log(`ok    ${file} matches ${lockFile}`);
    } else {
      stale.push({ file, lockFile, recorded, actual });
    }
  }

  for (const s of stale) {
    console.error(
      `::error file=.github/workflows/${s.lockFile}::${s.lockFile} is stale: frontmatter of ${s.file} changed ` +
        `(lock ${s.recorded.slice(0, 12)}..., source ${s.actual.slice(0, 12)}...). ` +
        `Run \`gh aw compile ${s.file.slice(0, -3)}\` and commit the regenerated ${s.lockFile}. ` +
        `A stale lock fails every run with E009 CONFIG_HASH_MISMATCH.`
    );
  }
  if (stale.length > 0) process.exit(1);
  console.log(`${checked} gh-aw workflow(s) in sync with their lock files`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
