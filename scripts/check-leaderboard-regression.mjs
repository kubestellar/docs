#!/usr/bin/env node

/**
 * Regression guard for leaderboard.json.
 *
 * Compares the newly generated public/data/leaderboard.json against the
 * previously committed version (git show HEAD:public/data/leaderboard.json).
 * Fails with exit code 1 if any existing contributor lost more than
 * REGRESSION_THRESHOLD_PCT of their points, which indicates a scoring bug
 * (e.g. a filter change silently dropping contributions).
 *
 * New contributors (not in the previous snapshot) and contributors who
 * gained points are always allowed through.
 *
 * Set LEADERBOARD_FORCE=1 to bypass the check — use this when an intentional
 * scoring-scope change (e.g. switching from all-time to current-year) is
 * expected to lower scores.
 *
 * Usage (called by generate-leaderboard.yml after generation):
 *   node scripts/check-leaderboard-regression.mjs
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Maximum allowed point drop as a fraction (0.10 = 10%) */
const REGRESSION_THRESHOLD_PCT = 0.10;

/** Minimum point total to bother checking — ignore micro-contributors */
const MIN_POINTS_TO_CHECK = 500;

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEADERBOARD_PATH = join(__dirname, "..", "public", "data", "leaderboard.json");

function loadNew() {
  try {
    return JSON.parse(readFileSync(LEADERBOARD_PATH, "utf-8"));
  } catch (err) {
    console.error("Failed to read new leaderboard.json:", err.message);
    process.exit(1);
  }
}

function loadPrevious() {
  try {
    const raw = execSync("git show HEAD:public/data/leaderboard.json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(raw);
  } catch {
    // No previous commit yet (first run) — nothing to compare against
    return null;
  }
}

function main() {
  if (process.env.LEADERBOARD_FORCE === "1") {
    console.log("LEADERBOARD_FORCE=1 — skipping regression check.");
    process.exit(0);
  }

  const newData = loadNew();
  const prevData = loadPrevious();

  if (!prevData) {
    console.log("No previous leaderboard snapshot found — skipping regression check.");
    process.exit(0);
  }

  // Build lookup maps: login -> total_points
  const prevMap = new Map(prevData.entries.map((e) => [e.login, e.total_points]));
  const newMap = new Map(newData.entries.map((e) => [e.login, e.total_points]));

  const regressions = [];

  for (const [login, prevPts] of prevMap) {
    if (prevPts < MIN_POINTS_TO_CHECK) continue;

    const newPts = newMap.get(login) ?? 0;
    const drop = prevPts - newPts;
    const dropPct = drop / prevPts;

    if (dropPct > REGRESSION_THRESHOLD_PCT) {
      regressions.push({ login, prevPts, newPts, drop, dropPct });
    }
  }

  if (regressions.length === 0) {
    console.log(
      `Regression check passed — ${newMap.size} contributors, no significant point drops.`
    );

    // Print a summary of notable changes for the run log
    const gained = [];
    const lost = [];
    for (const [login, newPts] of newMap) {
      const prevPts = prevMap.get(login) ?? 0;
      const delta = newPts - prevPts;
      if (delta > 1000) gained.push({ login, delta });
      if (delta < -100 && Math.abs(delta) / (prevPts || 1) < REGRESSION_THRESHOLD_PCT) {
        lost.push({ login, delta });
      }
    }
    if (gained.length > 0) {
      console.log("\nTop gainers:");
      gained.sort((a, b) => b.delta - a.delta).slice(0, 5).forEach((e) =>
        console.log(`  ${e.login}: +${e.delta.toLocaleString()} pts`)
      );
    }
    if (lost.length > 0) {
      console.log("\nMinor drops (within threshold):");
      lost.forEach((e) =>
        console.log(`  ${e.login}: ${e.delta.toLocaleString()} pts`)
      );
    }
    process.exit(0);
  }

  // Report regressions
  console.error("\n❌ LEADERBOARD REGRESSION DETECTED\n");
  console.error(
    `${regressions.length} contributor(s) lost more than ${REGRESSION_THRESHOLD_PCT * 100}% of their points:\n`
  );
  for (const r of regressions.sort((a, b) => b.drop - a.drop)) {
    console.error(
      `  ${r.login}: ${r.prevPts.toLocaleString()} → ${r.newPts.toLocaleString()} pts` +
        ` (−${r.drop.toLocaleString()}, −${(r.dropPct * 100).toFixed(1)}%)`
    );
  }
  console.error(
    "\nThis usually means a scoring bug (e.g. a filter change dropping contributions)."
  );
  console.error(
    "If this drop is intentional (e.g. scope change), re-run with LEADERBOARD_FORCE=1."
  );
  console.error("\nLeaderboard data has NOT been committed.");
  process.exit(1);
}

main();
