#!/usr/bin/env node

/**
 * Regression guard for leaderboard.json.
 *
 * Takes the top 3 contributors from the NEW leaderboard and checks that
 * none of them lost more than REGRESSION_THRESHOLD_PCT of their points
 * compared to the previously committed snapshot. Checking the top 3 is
 * sufficient — a scoring bug severe enough to matter will always affect
 * high-volume contributors most.
 *
 * Set LEADERBOARD_FORCE=1 to bypass — use when an intentional scope change
 * (e.g. switching from all-time to current-year) is expected to lower scores.
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

/** Number of top contributors to check */
const TOP_N = 3;

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
    console.log("No previous leaderboard snapshot — skipping regression check.");
    process.exit(0);
  }

  const prevMap = new Map(prevData.entries.map((e) => [e.login, e.total_points]));

  // Check the current top N from the newly generated data
  const sentinels = newData.entries.slice(0, TOP_N);
  console.log(`Checking top ${TOP_N} contributors for regressions:\n`);

  const regressions = [];

  for (const entry of sentinels) {
    const { login, total_points: newPts } = entry;
    const prevPts = prevMap.get(login);

    if (!prevPts) {
      console.log(`  ✓  ${login}: new to top ${TOP_N} — skipping`);
      continue;
    }

    const drop = prevPts - newPts;
    const dropPct = drop / prevPts;
    const status = dropPct > REGRESSION_THRESHOLD_PCT ? "❌" : drop > 0 ? "⚠️ " : "✓ ";

    console.log(
      `  ${status} ${login}: ${prevPts.toLocaleString()} → ${newPts.toLocaleString()} pts` +
        (drop !== 0 ? ` (${drop > 0 ? "−" : "+"}${Math.abs(drop).toLocaleString()}, ${(dropPct * 100).toFixed(1)}%)` : "")
    );

    if (dropPct > REGRESSION_THRESHOLD_PCT) {
      regressions.push({ login, prevPts, newPts, drop, dropPct });
    }
  }

  if (regressions.length === 0) {
    console.log("\nRegression check passed.");
    process.exit(0);
  }

  console.error("\n❌ LEADERBOARD REGRESSION DETECTED\n");
  for (const r of regressions) {
    console.error(
      `  ${r.login}: ${r.prevPts.toLocaleString()} → ${r.newPts.toLocaleString()} pts` +
        ` (−${r.drop.toLocaleString()}, −${(r.dropPct * 100).toFixed(1)}%)`
    );
  }
  console.error("\nScoring bug likely (filter change, missing repo, API truncation).");
  console.error("If intentional, re-run the workflow with force=true.");
  console.error("\nLeaderboard data has NOT been committed.");
  process.exit(1);
}

main();
