#!/usr/bin/env node

/**
 * Generates leaderboard data by fetching contributor activity from GitHub.
 *
 * Uses the REST API (/repos/{repo}/issues) to bulk-fetch all issues and PRs
 * per repo, then groups by author and scores locally. This avoids the GitHub
 * Search API's strict rate limit (30 req/min) that caused contributors to
 * get 0 points when the script hit 403 errors mid-run.
 *
 * REST API rate limit: 5,000 req/hr (vs Search API: 30 req/min).
 *
 * Replicates the scoring logic from the KubeStellar Console backend
 * (pkg/api/handlers/rewards.go) so that results are consistent.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-leaderboard.mjs
 *
 * Output: public/data/leaderboard.json
 */

import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Point values (mirrors rewards.go) ─────────────────────────────────
const POINTS_BUG_ISSUE = 300;
const POINTS_FEATURE_ISSUE = 100;
const POINTS_OTHER_ISSUE = 50;
const POINTS_PR_OPENED = 200;
const POINTS_PR_MERGED = 500;

// ── Repos to scan ─────────────────────────────────────────────────────
const REPOS = [
  "kubestellar/kubestellar",
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
  "kubestellar/docs",
];

// ── Contributor levels ────────────────────────────────────────────────
const CONTRIBUTOR_LEVELS = [
  { rank: 1, name: "Observer", minCoins: 0 },
  { rank: 2, name: "Explorer", minCoins: 500 },
  { rank: 3, name: "Navigator", minCoins: 2000 },
  { rank: 4, name: "Pilot", minCoins: 5000 },
  { rank: 5, name: "Commander", minCoins: 15000 },
  { rank: 6, name: "Captain", minCoins: 50000 },
  { rank: 7, name: "Admiral", minCoins: 150000 },
  { rank: 8, name: "Legend", minCoins: 500000 },
];

// ── GitHub API constants ──────────────────────────────────────────────
/** Current-year start in ISO-8601 (matches console rewards scope) */
const YEAR_START = `${new Date().getFullYear()}-01-01T00:00:00Z`;
/** Items per page for REST API pagination */
const REST_PER_PAGE = 100;
/** Maximum pages to fetch per repo (100 items/page = 10,000 items max) */
const REST_MAX_PAGES = 100;
/** Delay between REST API pages to be a good citizen (ms) */
const REST_PAGE_DELAY_MS = 100;
const API_BASE = "https://api.github.com";

// ── Bot/service accounts to exclude from the leaderboard ──────────────
const EXCLUDED_LOGINS = new Set([
  "web-flow",
  "dependabot[bot]",
  "github-actions[bot]",
  "netlify[bot]",
]);

// ── Helpers ───────────────────────────────────────────────────────────

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const defaultHeaders = {
  Accept: "application/vnd.github.v3+json",
  Authorization: `Bearer ${TOKEN}`,
};

async function ghFetch(url) {
  const res = await fetch(url, { headers: defaultHeaders });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Label classification ──────────────────────────────────────────────
const BUG_LABELS = new Set(["bug", "kind/bug", "type/bug"]);
const FEATURE_LABELS = new Set([
  "enhancement",
  "feature",
  "kind/feature",
  "type/feature",
]);

function classifyIssueLabels(labels) {
  for (const label of labels) {
    if (BUG_LABELS.has(label.name))
      return { type: "issue_bug", points: POINTS_BUG_ISSUE };
    if (FEATURE_LABELS.has(label.name))
      return { type: "issue_feature", points: POINTS_FEATURE_ISSUE };
  }
  return { type: "issue_other", points: POINTS_OTHER_ISSUE };
}

function getLevelForPoints(totalPoints) {
  let level = CONTRIBUTOR_LEVELS[0];
  for (let i = CONTRIBUTOR_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= CONTRIBUTOR_LEVELS[i].minCoins) {
      level = CONTRIBUTOR_LEVELS[i];
      break;
    }
  }
  return level;
}

// ── Bulk fetch all issues+PRs for a repo via REST API ─────────────────
/**
 * Fetches ALL issues and PRs for a repo using the REST API.
 * The /repos/{owner}/{repo}/issues endpoint returns both issues and PRs
 * (PRs have a `pull_request` field). state=all includes open+closed.
 *
 * This uses the REST API (5,000 req/hr) instead of the Search API
 * (30 req/min), avoiding rate limit failures on large contributor lists.
 */
async function fetchAllItems(repo) {
  const allItems = [];

  for (let page = 1; page <= REST_MAX_PAGES; page++) {
    const url = `${API_BASE}/repos/${repo}/issues?state=all&per_page=${REST_PER_PAGE}&page=${page}&sort=created&direction=desc&since=${YEAR_START}`;

    if (page > 1) await delay(REST_PAGE_DELAY_MS);

    const items = await ghFetch(url);
    allItems.push(...items);

    // Stop when we get fewer items than a full page (last page)
    if (items.length < REST_PER_PAGE) break;
  }

  return allItems;
}

// ── Score all contributors from bulk data ─────────────────────────────
/**
 * Groups items by author login and computes scores.
 * Each item is either an issue (no pull_request field) or a PR.
 */
function scoreAllContributors(allItems) {
  /** Map of login -> { avatarUrl, totalPoints, breakdown } */
  const contributors = new Map();

  for (const item of allItems) {
    const login = item.user?.login;
    if (!login || item.user?.type !== "User") continue;
    if (EXCLUDED_LOGINS.has(login)) continue;
    if (item.created_at < YEAR_START) continue;

    if (!contributors.has(login)) {
      contributors.set(login, {
        avatarUrl: item.user.avatar_url,
        totalPoints: 0,
        breakdown: {
          bug_issues: 0,
          feature_issues: 0,
          other_issues: 0,
          prs_opened: 0,
          prs_merged: 0,
        },
      });
    }

    const entry = contributors.get(login);

    if (item.pull_request) {
      // It's a PR — score pr_opened always
      entry.totalPoints += POINTS_PR_OPENED;
      entry.breakdown.prs_opened++;

      // pr_merged if merged_at is set
      if (item.pull_request.merged_at) {
        entry.totalPoints += POINTS_PR_MERGED;
        entry.breakdown.prs_merged++;
      }
    } else {
      // It's an issue — classify by labels
      const { type, points } = classifyIssueLabels(item.labels || []);
      entry.totalPoints += points;
      if (type === "issue_bug") entry.breakdown.bug_issues++;
      else if (type === "issue_feature") entry.breakdown.feature_issues++;
      else entry.breakdown.other_issues++;
    }
  }

  return contributors;
}

// ── Bonus points from [bonus] issues ─────────────────────────────────
/**
 * Fetches bonus point awards from GitHub issues.
 *
 * Format: Issue title must match `[bonus] @username +N reason`
 * Only issues created by BONUS_AUTHORIZED_USER and labeled "bonus-points"
 * are honored. Both open and closed issues count (permanent award).
 *
 * Example: "[bonus] @rishi-jat +1000 video challenge submission"
 */
const BONUS_AUTHORIZED_USER = "clubanderson";
const BONUS_LABEL = "bonus-points";
const BONUS_REPO = "kubestellar/console";
const BONUS_TITLE_REGEX = /^\[bonus\]\s+@(\S+)\s+\+(\d+)\s*(.*)/i;

async function fetchBonusPoints() {
  /** Map of login -> { points, reasons[] } */
  const bonuses = new Map();

  try {
    const url = `${API_BASE}/repos/${BONUS_REPO}/issues?labels=${BONUS_LABEL}&state=all&per_page=${REST_PER_PAGE}&creator=${BONUS_AUTHORIZED_USER}`;
    const issues = await ghFetch(url);

    for (const issue of issues) {
      // Verify creator (belt-and-suspenders — API already filters by creator)
      if (issue.user?.login !== BONUS_AUTHORIZED_USER) continue;

      const match = issue.title.match(BONUS_TITLE_REGEX);
      if (!match) {
        console.warn(`  Skipping malformed bonus issue #${issue.number}: "${issue.title}"`);
        continue;
      }

      const [, login, pointsStr, reason] = match;
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points <= 0) continue;

      if (!bonuses.has(login)) {
        bonuses.set(login, { points: 0, reasons: [] });
      }
      const entry = bonuses.get(login);
      entry.points += points;
      entry.reasons.push(`#${issue.number}: +${points} ${reason.trim() || "(no reason)"}`);
    }
  } catch (err) {
    console.warn(`  Warning: failed to fetch bonus issues: ${err.message}`);
  }

  return bonuses;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching all issues and PRs from repos (bulk REST API)...\n");

  // 1. Bulk-fetch all items from each repo
  const allItems = [];

  for (const repo of REPOS) {
    try {
      const items = await fetchAllItems(repo);
      allItems.push(...items);
      /** Count of pure issues (no pull_request field) */
      const issueCount = items.filter((i) => !i.pull_request).length;
      /** Count of PRs (has pull_request field) */
      const prCount = items.filter((i) => i.pull_request).length;
      console.log(
        `  ${repo}: ${items.length} items (${issueCount} issues, ${prCount} PRs)`
      );
    } catch (err) {
      console.warn(`  Warning: failed to fetch ${repo}: ${err.message}`);
    }
  }

  console.log(`\nTotal items fetched: ${allItems.length}`);

  // 2. Score all contributors from the bulk data (no additional API calls)
  console.log("Scoring contributors from fetched data...\n");
  const contributorMap = scoreAllContributors(allItems);

  // 2b. Fetch and apply bonus points from [bonus] issues
  console.log("Fetching bonus point awards...");
  const bonusMap = await fetchBonusPoints();
  for (const [login, bonus] of bonusMap) {
    if (contributorMap.has(login)) {
      contributorMap.get(login).totalPoints += bonus.points;
    } else {
      // Bonus for someone not yet on the board — add them
      contributorMap.set(login, {
        avatarUrl: `https://github.com/${login}.png`,
        totalPoints: bonus.points,
        breakdown: { bug_issues: 0, feature_issues: 0, other_issues: 0, prs_opened: 0, prs_merged: 0 },
      });
    }
    for (const reason of bonus.reasons) {
      console.log(`  ${login}: ${reason}`);
    }
  }
  if (bonusMap.size === 0) console.log("  No bonus awards found.");
  console.log("");

  // 3. Build sorted entries
  const entries = [];
  for (const [login, data] of contributorMap) {
    const level = getLevelForPoints(data.totalPoints);
    const bonus = bonusMap.get(login);
    entries.push({
      login,
      avatar_url: data.avatarUrl,
      total_points: data.totalPoints,
      level: level.name,
      level_rank: level.rank,
      breakdown: data.breakdown,
      ...(bonus ? { bonus_points: bonus.points } : {}),
    });
  }

  // Sort by points descending, then alphabetically
  entries.sort((a, b) => {
    if (a.total_points !== b.total_points) return b.total_points - a.total_points;
    return a.login.localeCompare(b.login);
  });

  // Assign ranks
  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  // 4. Write output
  let gitHash = "";
  try {
    gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    // Not in a git repo — ignore
  }

  const output = {
    generated_at: new Date().toISOString(),
    git_hash: gitHash,
    entries,
  };

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, "..", "public", "data", "leaderboard.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`Done! Wrote ${entries.length} contributors to ${outPath}`);
  console.log(`\nTop 10:`);
  for (const e of entries.slice(0, 10)) {
    console.log(
      `  #${e.rank} ${e.login}: ${e.total_points} pts (${e.level})`
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
