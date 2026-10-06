#!/usr/bin/env node

/**
 * Faster script to add repo_breakdown to existing contributor profiles.
 * This fetches contributor issues and groups them by repository.
 * Unlike the full generation script, it skips NLP clustering.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/add-repo-breakdown.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { categorizeIssuesByRepo, sortRepoBreakdown } from "./add-repo-breakdown-helpers.mjs";
import {
  API_BASE,
  REST_PER_PAGE,
  REST_MAX_PAGES,
  REST_PAGE_DELAY_MS,
  buildDefaultHeaders,
  ghFetch,
  delay,
} from "./lib/github-fetch.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPOS = [
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
  "kubestellar/docs",
];

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const defaultHeaders = buildDefaultHeaders(TOKEN);

async function fetchAllIssues(owner, repo, creator) {
  const items = [];
  for (let page = 1; page <= REST_MAX_PAGES; page++) {
    const url = `${API_BASE}/repos/${owner}/${repo}/issues?creator=${creator}&state=all&per_page=${REST_PER_PAGE}&page=${page}`;
    const data = await ghFetch(url, defaultHeaders);
    if (data.length === 0) break;
    
    for (const issue of data) {
      items.push({
        repo: `${owner}/${repo}`,
        is_pr: !!issue.pull_request,
        merged_at: issue.pull_request?.merged_at || null,
        labels: issue.labels.map((l) => l.name),
      });
    }
    
    if (data.length < REST_PER_PAGE) break;
    await delay(REST_PAGE_DELAY_MS);
  }
  return items;
}

async function main() {
  // Read leaderboard
  const leaderboardPath = join(__dirname, "..", "public", "data", "leaderboard.json");
  const leaderboard = JSON.parse(readFileSync(leaderboardPath, "utf-8"));

  const contributorProfiles = join(__dirname, "..", "public", "data", "contributors");

  let updated = 0;
  let total = 0;

  for (const entry of leaderboard.entries) {
    total++;
    const login = entry.login;
    const profilePath = join(contributorProfiles, `${login}.json`);

    if (!existsSync(profilePath)) {
      console.log(`Skipping ${login} - no profile file`);
      continue;
    }

    const profile = JSON.parse(readFileSync(profilePath, "utf-8"));

    // Skip if already has repo_breakdown
    if (profile.repo_breakdown) {
      console.log(`Skipping ${login} - already has repo_breakdown`);
      continue;
    }

    console.log(`Fetching issues for ${login}...`);

    try {
      // Fetch issues from all repos
      const allIssues = [];
      for (const repo of REPOS) {
        const [owner, repoName] = repo.split("/");
        const issues = await fetchAllIssues(owner, repoName, login);
        allIssues.push(...issues);
      }

      // Group by repo and categorize (see scripts/add-repo-breakdown-helpers.mjs).
      const repoBreakdownMap = categorizeIssuesByRepo(allIssues);

      const repoBreakdown = sortRepoBreakdown(repoBreakdownMap);

      // Add repo_breakdown to profile
      profile.repo_breakdown = repoBreakdown;

      // Write updated profile
      writeFileSync(profilePath, JSON.stringify(profile, null, 2) + "\n");
      updated++;
      console.log(`Updated ${login} with repo_breakdown (${repoBreakdown.length} repos)`);
    } catch (err) {
      console.error(`Error processing ${login}: ${err.message}`);
    }

    await delay(REST_PAGE_DELAY_MS);
  }

  console.log(
    `\nDone! Updated ${updated} out of ${total} contributor profiles with repo_breakdown`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
