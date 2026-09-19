#!/usr/bin/env node

/**
 * Generates per-contributor profile data with topic clustering and cadence metrics.
 *
 * Reads the leaderboard contributor list, fetches all issues (with bodies) each
 * contributor has opened, clusters them into topics using TF-IDF + agglomerative
 * clustering, computes engagement cadence, and generates "deepen" and "stretch"
 * suggestions by matching contributor focus areas against open issues.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-contributor-profiles.mjs
 *
 * Output: public/data/contributors/{username}.json (one file per contributor)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REST_PER_PAGE,
  REST_MAX_PAGES,
  REST_PAGE_DELAY_MS,
  API_BASE,
  classifyIssueLabels,
  buildDefaultHeaders,
  delay,
  ghFetch,
} from "./lib/github-fetch.mjs";
import {
  cleanText,
  tokenize,
  computeTfIdf,
  centroid,
  agglomerativeClustering,
  nameCluster,
} from "./lib/text-clustering.mjs";
import {
  computeCadence,
  computeTimeline,
  findDeepenSuggestions,
  findStretchAreas,
  CONSOLE_CODEBASE_AREAS,
} from "./lib/contributor-metrics.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Configuration ────────────────────────────────────────────────────
const REPOS = [
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
  "kubestellar/docs",
];

/** Max characters of issue body to use for topic extraction */
const BODY_CHAR_LIMIT = 500;
/** Minimum issues required for topic clustering */
const MIN_ISSUES_FOR_CLUSTERING = 3;
/**
 * Maximum issues fed into agglomerative clustering. The algorithm is O(n^3),
 * so high-volume contributors (thousands of issues/PRs) can make the step
 * run for many minutes and blow the workflow's 5-minute timeout. Cap the
 * input to the most recent N issues, which is enough to surface current
 * topics of interest.
 */
const MAX_ISSUES_FOR_CLUSTERING = 300;

// ── Bot/service accounts to exclude ──────────────────────────────────
const EXCLUDED_LOGINS = new Set([
  "web-flow",
  "dependabot[bot]",
  "github-actions[bot]",
  "netlify[bot]",
]);

// ── GitHub API helpers ───────────────────────────────────────────────
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const defaultHeaders = buildDefaultHeaders(TOKEN);

// ── Data fetching ────────────────────────────────────────────────────

async function fetchAllIssuesWithBodies(repo) {
  const allItems = [];

  for (let page = 1; page <= REST_MAX_PAGES; page++) {
    const url = `${API_BASE}/repos/${repo}/issues?state=all&per_page=${REST_PER_PAGE}&page=${page}&sort=created&direction=desc`;

    if (page > 1) await delay(REST_PAGE_DELAY_MS);

    const items = await ghFetch(url, defaultHeaders);
    allItems.push(...items);

    if (items.length < REST_PER_PAGE) break;
  }

  return allItems;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  // 1. Read leaderboard to get contributor list
  const leaderboardPath = join(
    __dirname,
    "..",
    "public",
    "data",
    "leaderboard.json"
  );
  const leaderboard = JSON.parse(readFileSync(leaderboardPath, "utf-8"));
  const contributorLogins = new Set(leaderboard.entries.map((e) => e.login));

  console.log(`Found ${contributorLogins.size} contributors in leaderboard\n`);

  // 2. Fetch all issues with bodies from all repos
  console.log("Fetching all issues with bodies...\n");
  const allRawItems = [];

  for (const repo of REPOS) {
    try {
      const items = await fetchAllIssuesWithBodies(repo);
      const repoShort = repo.split("/")[1];

      // Extract relevant fields for both issues and PRs
      const processed = items
        .filter((item) => item.user?.type === "User")
        .filter((item) => !EXCLUDED_LOGINS.has(item.user?.login))
        .map((item) => ({
          login: item.user.login,
          title: item.title,
          body: (item.body || "").slice(0, BODY_CHAR_LIMIT),
          labels: (item.labels || []).map((l) => l.name),
          repo: repoShort,
          state: item.state,
          created_at: item.created_at,
          number: item.number,
          url: item.html_url,
          comments: item.comments || 0,
          reactions: item.reactions?.total_count || 0,
          is_pr: !!item.pull_request,
          merged_at: item.pull_request?.merged_at || null,
          issue_type: item.pull_request ? null : classifyIssueLabels(item.labels || []),
        }));

      allRawItems.push(...processed);
      const issuesCount = processed.filter(p => !p.is_pr).length;
      const prsCount = processed.filter(p => p.is_pr).length;
      console.log(`  ${repo}: ${processed.length} items (${issuesCount} issues, ${prsCount} PRs)`);
    } catch (err) {
      console.warn(`  Warning: failed to fetch ${repo}: ${err.message}`);
    }
  }

  console.log(`\nTotal issues fetched: ${allRawItems.length}\n`);

  // 3. Tokenize all issues and compute global TF-IDF
  console.log("Computing TF-IDF across all issues...");
  const allTokenized = allRawItems.map((issue) => {
    const text = cleanText(`${issue.title} ${issue.body}`);
    return tokenize(text);
  });

  const { vectors: allVectors } = computeTfIdf(allTokenized);

  // Attach vectors to issues
  for (let i = 0; i < allRawItems.length; i++) {
    allRawItems[i].vector = allVectors[i];
  }

  // Prepare open issues for suggestions (with engagement score)
  const openIssues = allRawItems
    .filter((item) => item.state === "open")
    .map((item) => ({
      ...item,
      engagement: item.comments + item.reactions,
    }));

  console.log(`Open issues for suggestions: ${openIssues.length}\n`);

  // 3b. Compute TF-IDF vectors for console codebase areas
  console.log("Computing codebase area vectors...");
  const areaTexts = CONSOLE_CODEBASE_AREAS.map((area) =>
    `${area.name} ${area.description} ${area.keywords}`
  );
  const areaTokenized = areaTexts.map((text) => tokenize(cleanText(text)));
  const { vectors: areaVectors } = computeTfIdf([...allTokenized, ...areaTokenized]);
  // The area vectors are the last N entries (after all issue vectors)
  const areaVectorSlice = areaVectors.slice(allTokenized.length);
  console.log(`  ${areaVectorSlice.length} codebase areas vectorized\n`);

  // 4. Build per-contributor profiles
  const outDir = join(__dirname, "..", "public", "data", "contributors");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Get leaderboard data for each contributor (points, level, rank)
  const leaderboardMap = new Map(
    leaderboard.entries.map((e) => [e.login, e])
  );

  for (const login of contributorLogins) {
    console.log(`Processing ${login}...`);

    // Get this contributor's issues
    const myIssueIndices = [];
    for (let i = 0; i < allRawItems.length; i++) {
      if (allRawItems[i].login === login) myIssueIndices.push(i);
    }

    const myIssues = myIssueIndices.map((i) => allRawItems[i]);
    const myVectors = myIssueIndices.map((i) => allVectors[i]);

    // Cadence
    const dates = myIssues.map((issue) => issue.created_at);
    const cadence = computeCadence(dates);

    // Activity timeline
    const activityTimeline = computeTimeline(dates);

    // Topic clustering
    let topics = [];
    let clusterCentroids = [];
    let clusterNames = [];

    if (myIssues.length >= MIN_ISSUES_FOR_CLUSTERING) {
      // Cap clustering input to the most recent issues: the algorithm is
      // O(n^3), so high-volume contributors would otherwise blow the
      // workflow's timeout (see MAX_ISSUES_FOR_CLUSTERING).
      const recentOrder = myIssues
        .map((issue, idx) => idx)
        .sort((a, b) => new Date(myIssues[b].created_at) - new Date(myIssues[a].created_at))
        .slice(0, MAX_ISSUES_FOR_CLUSTERING);
      const clusterIssuePool = recentOrder.map((idx) => myIssues[idx]);
      const clusterVectorPool = recentOrder.map((idx) => myVectors[idx]);

      const clusters = agglomerativeClustering(clusterVectorPool);

      for (const cluster of clusters) {
        const clusterVecs = cluster.map((idx) => clusterVectorPool[idx]);
        const clusterCenter = centroid(clusterVecs);
        const name = nameCluster(clusterCenter);
        const clusterIssues = cluster.map((idx) => clusterIssuePool[idx]);
        const openCount = clusterIssues.filter(
          (i) => i.state === "open"
        ).length;
        const closedCount = clusterIssues.filter(
          (i) => i.state === "closed"
        ).length;
        const repos = [...new Set(clusterIssues.map((i) => i.repo))];
        const mostRecent = [...clusterIssues].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];

        topics.push({
          name,
          issue_count: cluster.length,
          recent_issue: {
            title: mostRecent.title,
            url: mostRecent.url,
            created_at: mostRecent.created_at,
          },
          repos,
          open_count: openCount,
          closed_count: closedCount,
        });

        clusterCentroids.push(clusterCenter);
        clusterNames.push(name);
      }

      // Sort topics by issue count descending
      topics.sort((a, b) => b.issue_count - a.issue_count);
    }

    // Suggestions
    const suggestions = {
      deepen:
        myIssues.length >= MIN_ISSUES_FOR_CLUSTERING
          ? findDeepenSuggestions(
            clusterCentroids,
            clusterNames,
            openIssues,
            login
          )
          : [],
      stretch:
        myIssues.length >= MIN_ISSUES_FOR_CLUSTERING
          ? findStretchAreas(clusterCentroids, areaVectorSlice)
          : [],
    };

    // Per-repo breakdown
    const repoBreakdownMap = new Map();
    for (const item of myIssues) {
      if (!repoBreakdownMap.has(item.repo)) {
        repoBreakdownMap.set(item.repo, {
          repo: item.repo,
          bug_issues: 0,
          feature_issues: 0,
          other_issues: 0,
          prs_opened: 0,
          prs_merged: 0,
        });
      }
      const rb = repoBreakdownMap.get(item.repo);
      if (item.is_pr) {
        rb.prs_opened++;
        if (item.merged_at) rb.prs_merged++;
      } else {
        if (item.issue_type === "bug") rb.bug_issues++;
        else if (item.issue_type === "feature") rb.feature_issues++;
        else rb.other_issues++;
      }
    }
    const repoBreakdown = [...repoBreakdownMap.values()].sort((a, b) =>
      (b.prs_opened + b.bug_issues + b.feature_issues + b.other_issues) -
      (a.prs_opened + a.bug_issues + a.feature_issues + a.other_issues)
    );

    // Build profile
    const lbEntry = leaderboardMap.get(login);
    const profile = {
      login,
      generated_at: new Date().toISOString(),
      total_issues_opened: myIssues.filter(i => !i.is_pr).length,
      total_prs_opened: myIssues.filter(i => i.is_pr).length,
      avatar_url: lbEntry?.avatar_url || "",
      total_points: lbEntry?.total_points || 0,
      level: lbEntry?.level || "Observer",
      level_rank: lbEntry?.level_rank || 1,
      rank: lbEntry?.rank || 0,
      cadence,
      topics,
      suggestions,
      activity_timeline: activityTimeline,
      repo_breakdown: repoBreakdown,
    };

    // Write file
    const outPath = join(outDir, `${login}.json`);
    writeFileSync(outPath, JSON.stringify(profile, null, 2) + "\n");
  }

  console.log(
    `\nDone! Generated profiles for ${contributorLogins.size} contributors in ${outDir}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
