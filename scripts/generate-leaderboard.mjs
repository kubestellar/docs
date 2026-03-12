#!/usr/bin/env node

/**
 * Generates leaderboard data by fetching contributor activity from GitHub.
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
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Point values (mirrors rewards.go lines 23-31) ─────────────────────
const POINTS_BUG_ISSUE = 300;
const POINTS_FEATURE_ISSUE = 100;
const POINTS_OTHER_ISSUE = 50;
const POINTS_PR_OPENED = 200;
const POINTS_PR_MERGED = 500;

// ── Repos to scan (mirrors REWARDS_GITHUB_ORGS default in server.go:928) ──
const REPOS = [
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
];

// ── Contributor levels (mirrors rewards.go lines 138-147) ─────────────
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
const MAX_CONTRIBUTORS_PER_REPO = 50;
const SEARCH_PER_PAGE = 100;
const SEARCH_MAX_PAGES = 10;
const API_BASE = "https://api.github.com";
const SEARCH_RATE_LIMIT_DELAY_MS = 2500; // GitHub Search API: 30 req/min for authenticated

// ── Helpers ───────────────────────────────────────────────────────────

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github.v3+json",
  Authorization: `Bearer ${TOKEN}`,
};

async function ghFetch(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Delay to avoid hitting GitHub Search API rate limit (30 req/min). */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Bug / feature label sets (mirrors classifyIssue in rewards.go:386) ──
const BUG_LABELS = new Set(["bug", "kind/bug", "type/bug"]);
const FEATURE_LABELS = new Set([
  "enhancement",
  "feature",
  "kind/feature",
  "type/feature",
]);

function classifyIssueLabels(labels) {
  for (const label of labels) {
    if (BUG_LABELS.has(label.name)) return { type: "issue_bug", points: POINTS_BUG_ISSUE };
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

// ── Search API with pagination (mirrors searchItems in rewards.go:336) ──
async function searchItems(login, itemType) {
  const repoFilter = REPOS.map((r) => `repo:${r}`).join(" ");
  const query = `author:${login} ${repoFilter} type:${itemType}`;
  const allItems = [];

  for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
    const url = `${API_BASE}/search/issues?q=${encodeURIComponent(query)}&per_page=${SEARCH_PER_PAGE}&page=${page}&sort=created&order=desc`;

    await delay(SEARCH_RATE_LIMIT_DELAY_MS);
    const data = await ghFetch(url);
    allItems.push(...(data.items || []));

    if (allItems.length >= data.total_count || (data.items || []).length < SEARCH_PER_PAGE) {
      break;
    }
  }

  return allItems;
}

// ── Score a single contributor ────────────────────────────────────────
async function scoreContributor(login) {
  const breakdown = {
    bug_issues: 0,
    feature_issues: 0,
    other_issues: 0,
    prs_opened: 0,
    prs_merged: 0,
  };
  let totalPoints = 0;

  // Fetch issues
  try {
    const issues = await searchItems(login, "issue");
    for (const item of issues) {
      const { type, points } = classifyIssueLabels(item.labels || []);
      totalPoints += points;
      if (type === "issue_bug") breakdown.bug_issues++;
      else if (type === "issue_feature") breakdown.feature_issues++;
      else breakdown.other_issues++;
    }
  } catch (err) {
    console.warn(`  Warning: issue search failed for ${login}: ${err.message}`);
  }

  // Fetch PRs
  try {
    const prs = await searchItems(login, "pr");
    for (const item of prs) {
      // pr_opened always
      totalPoints += POINTS_PR_OPENED;
      breakdown.prs_opened++;

      // pr_merged if merged_at is set
      if (item.pull_request?.merged_at) {
        totalPoints += POINTS_PR_MERGED;
        breakdown.prs_merged++;
      }
    }
  } catch (err) {
    console.warn(`  Warning: PR search failed for ${login}: ${err.message}`);
  }

  return { totalPoints, breakdown };
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching contributors from repos...");

  // 1. Discover contributors from each repo
  const contributorMap = new Map(); // login -> avatar_url

  for (const repo of REPOS) {
    try {
      const url = `${API_BASE}/repos/${repo}/contributors?per_page=${MAX_CONTRIBUTORS_PER_REPO}`;
      const contributors = await ghFetch(url);
      for (const c of contributors) {
        if (c.type === "User" && !contributorMap.has(c.login)) {
          contributorMap.set(c.login, c.avatar_url);
        }
      }
      console.log(`  ${repo}: ${contributors.filter((c) => c.type === "User").length} contributors`);
    } catch (err) {
      console.warn(`  Warning: failed to fetch contributors for ${repo}: ${err.message}`);
    }
  }

  // 1b. Discover issue-only contributors via Search API.
  //     The /repos/{repo}/contributors endpoint only returns users with commits,
  //     so contributors who only filed issues (no PRs/commits) are missed.
  //     Paginate to avoid missing contributors beyond the first page.
  console.log("\nDiscovering issue-only contributors...");
  for (const repo of REPOS) {
    try {
      const query = `repo:${repo} type:issue`;
      let added = 0;

      for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
        const url = `${API_BASE}/search/issues?q=${encodeURIComponent(query)}&per_page=${SEARCH_PER_PAGE}&page=${page}&sort=created&order=desc`;
        await delay(SEARCH_RATE_LIMIT_DELAY_MS);
        const data = await ghFetch(url);
        const items = data.items || [];

        for (const item of items) {
          const login = item.user?.login;
          if (login && item.user?.type === "User" && !contributorMap.has(login)) {
            contributorMap.set(login, item.user.avatar_url);
            added++;
          }
        }

        // Stop when we've seen all results or this page was incomplete
        const totalSeen = (page - 1) * SEARCH_PER_PAGE + items.length;
        if (totalSeen >= data.total_count || items.length < SEARCH_PER_PAGE) {
          break;
        }
      }

      if (added > 0) {
        console.log(`  ${repo}: found ${added} issue-only contributors`);
      }
    } catch (err) {
      console.warn(`  Warning: issue search failed for ${repo}: ${err.message}`);
    }
  }

  console.log(`\nTotal unique contributors: ${contributorMap.size}`);
  console.log("Scoring contributors (this takes a while due to Search API rate limits)...\n");

  // 2. Score each contributor
  const entries = [];

  for (const [login, avatarUrl] of contributorMap) {
    try {
      console.log(`  Scoring ${login}...`);
      const { totalPoints, breakdown } = await scoreContributor(login);
      const level = getLevelForPoints(totalPoints);

      entries.push({
        login,
        avatar_url: avatarUrl,
        total_points: totalPoints,
        level: level.name,
        level_rank: level.rank,
        breakdown,
      });
    } catch (err) {
      console.warn(`  Warning: failed to score ${login}: ${err.message}`);
    }
  }

  // 3. Sort by points descending, then alphabetically
  entries.sort((a, b) => {
    if (a.total_points !== b.total_points) return b.total_points - a.total_points;
    return a.login.localeCompare(b.login);
  });

  // 4. Assign ranks
  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  // 5. Write output
  const output = {
    generated_at: new Date().toISOString(),
    entries,
  };

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, "..", "public", "data", "leaderboard.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`\nDone! Wrote ${entries.length} entries to ${outPath}`);
  console.log(`Top 5:`);
  for (const e of entries.slice(0, 5)) {
    console.log(`  #${e.rank} ${e.login}: ${e.total_points} pts (${e.level})`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
