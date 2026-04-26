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
import { createRequire } from "node:module";

// wink-nlp is CJS-only, use createRequire for ESM compat
const require = createRequire(import.meta.url);
const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-web-model");
const nlp = winkNLP(model);
const its = nlp.its;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Configuration ────────────────────────────────────────────────────
const REPOS = [
  "kubestellar/console",
  "kubestellar/console-marketplace",
  "kubestellar/console-kb",
  "kubestellar/docs",
];

const API_BASE = "https://api.github.com";
/** Items per page for REST API pagination */
const REST_PER_PAGE = 100;
/** Maximum pages to fetch per repo */
const REST_MAX_PAGES = 100;
/** Delay between REST API pages (ms) */
const REST_PAGE_DELAY_MS = 100;
/** Max characters of issue body to use for topic extraction */
const BODY_CHAR_LIMIT = 500;
/** Minimum cosine similarity to merge two clusters */
const CLUSTER_MERGE_THRESHOLD = 0.15;
/** Minimum cosine similarity for a "deepen" suggestion match */
const DEEPEN_SIMILARITY_THRESHOLD = 0.2;
/** Minimum cosine similarity for a codebase area to be considered "covered" by a contributor */
const AREA_COVERED_THRESHOLD = 0.1;
/** Number of top terms used to name a cluster */
const CLUSTER_NAME_TERM_COUNT = 3;
/** Number of suggestions per category (deepen/stretch) */
const SUGGESTION_COUNT = 5;
/** Minimum issues required for topic clustering */
const MIN_ISSUES_FOR_CLUSTERING = 3;
/** Number of weeks for rolling average calculation */
const ROLLING_WEEKS = 12;
/** Number of weeks for trend comparison (recent vs prior) */
const TREND_WEEKS = 4;
/** Milliseconds in one week */
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
/** Milliseconds in one day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Number of months for activity timeline */
const TIMELINE_MONTHS = 12;
/** Trend threshold: ratio above which counts as "ramping up" */
const TREND_RAMP_UP_RATIO = 1.5;
/** Trend threshold: ratio below which counts as "slowing down" */
const TREND_SLOW_DOWN_RATIO = 0.5;

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
    if (BUG_LABELS.has(label.name)) return "bug";
    if (FEATURE_LABELS.has(label.name)) return "feature";
  }
  return "other";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Text preprocessing ───────────────────────────────────────────────

/** Strip markdown formatting, code blocks, URLs, and HTML tags */
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/https?:\/\/\S+/g, " ") // URLs
    .replace(/<[^>]+>/g, " ") // HTML tags
    .replace(/[#*_~\[\]()>|\\-]/g, " ") // markdown chars
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize text into lemmatized, lowercase tokens (no stop words, no punctuation) */
function tokenize(text) {
  if (!text || text.trim().length === 0) return [];
  const doc = nlp.readDoc(text);
  const tokens = [];
  doc.tokens().each((t) => {
    if (t.out(its.stopWordFlag)) return;
    if (t.out(its.type) === "punctuation") return;
    const lemma = t.out(its.lemma);
    if (!lemma) return;
    const lower = lemma.toLowerCase();
    if (lower.length < 2) return;
    // Skip pure numbers
    if (/^\d+$/.test(lower)) return;
    tokens.push(lower);
  });
  return tokens;
}

// ── TF-IDF ───────────────────────────────────────────────────────────

/**
 * Compute TF-IDF vectors for a set of documents.
 * @param {string[][]} docs - Array of tokenized documents (each is an array of terms)
 * @returns {{ vectors: Map<string, number>[], vocabulary: Set<string> }}
 */
function computeTfIdf(docs) {
  const docCount = docs.length;
  if (docCount === 0) return { vectors: [], vocabulary: new Set() };

  // Document frequency: how many docs contain each term
  const df = new Map();
  for (const tokens of docs) {
    const unique = new Set(tokens);
    for (const term of unique) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const vocabulary = new Set(df.keys());

  // Compute TF-IDF vector per document
  const vectors = docs.map((tokens) => {
    const tf = new Map();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    const len = tokens.length || 1;
    const vec = new Map();
    for (const [term, count] of tf) {
      const tfNorm = count / len;
      const idf = Math.log(docCount / (df.get(term) || 1));
      const score = tfNorm * idf;
      if (score > 0) vec.set(term, score);
    }
    return vec;
  });

  return { vectors, vocabulary };
}

/** Cosine similarity between two sparse TF-IDF vectors (Map<string, number>) */
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, val] of a) {
    normA += val * val;
    if (b.has(term)) dot += val * b.get(term);
  }
  for (const [, val] of b) {
    normB += val * val;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Compute centroid of multiple TF-IDF vectors */
function centroid(vectors) {
  const sum = new Map();
  for (const vec of vectors) {
    for (const [term, val] of vec) {
      sum.set(term, (sum.get(term) || 0) + val);
    }
  }
  const count = vectors.length || 1;
  const result = new Map();
  for (const [term, val] of sum) {
    result.set(term, val / count);
  }
  return result;
}

// ── Agglomerative clustering ─────────────────────────────────────────

/**
 * Cluster TF-IDF vectors using agglomerative (bottom-up) clustering.
 * Each issue starts as its own cluster. Merge the two most similar clusters
 * until the maximum similarity drops below CLUSTER_MERGE_THRESHOLD.
 *
 * @param {Map<string, number>[]} vectors - TF-IDF vectors (one per issue)
 * @returns {number[][]} - Array of clusters, each is an array of issue indices
 */
function agglomerativeClustering(vectors) {
  if (vectors.length === 0) return [];
  if (vectors.length === 1) return [[0]];

  // Initialize: each issue is its own cluster
  let clusters = vectors.map((_, i) => [i]);
  let clusterCentroids = vectors.map((v) => new Map(v));

  while (clusters.length > 1) {
    // Find the two most similar clusters
    let bestSim = -1;
    let bestI = -1;
    let bestJ = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const sim = cosineSimilarity(clusterCentroids[i], clusterCentroids[j]);
        if (sim > bestSim) {
          bestSim = sim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    // Stop if the most similar pair is below threshold
    if (bestSim < CLUSTER_MERGE_THRESHOLD) break;

    // Merge cluster j into cluster i
    const mergedIndices = [...clusters[bestI], ...clusters[bestJ]];
    const mergedVectors = mergedIndices.map((idx) => vectors[idx]);
    const mergedCentroid = centroid(mergedVectors);

    clusters[bestI] = mergedIndices;
    clusterCentroids[bestI] = mergedCentroid;

    // Remove cluster j
    clusters.splice(bestJ, 1);
    clusterCentroids.splice(bestJ, 1);
  }

  return clusters;
}

/**
 * Name a cluster by its top N terms (by average TF-IDF score).
 * @param {Map<string, number>} clusterCentroid
 * @returns {string} e.g. "benchmark, latency, performance"
 */
function nameCluster(clusterCentroid) {
  const sorted = [...clusterCentroid.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CLUSTER_NAME_TERM_COUNT);
  return sorted.map(([term]) => term).join(", ");
}

// ── Cadence metrics ──────────────────────────────────────────────────

/**
 * Compute engagement cadence from issue timestamps.
 * @param {string[]} dates - Issue creation date strings (ISO 8601)
 * @returns {object} Cadence metrics object
 */
function computeCadence(dates) {
  if (dates.length === 0) {
    return {
      avg_per_week: 0,
      avg_per_day: 0,
      by_day_of_week: [0, 0, 0, 0, 0, 0, 0],
      by_hour_of_day: new Array(24).fill(0),
      current_streak_weeks: 0,
      longest_streak_weeks: 0,
      trend: "inactive",
      first_issue_at: null,
      last_issue_at: null,
    };
  }

  const sorted = dates.map((d) => new Date(d)).sort((a, b) => a - b);
  const firstIssue = sorted[0];
  const lastIssue = sorted[sorted.length - 1];
  const now = new Date();

  // Day-of-week distribution (0=Mon, 6=Sun — ISO weekday)
  const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  // Hour-of-day distribution (UTC)
  const byHourOfDay = new Array(24).fill(0);

  for (const d of sorted) {
    // JS getDay: 0=Sun, 1=Mon... convert to 0=Mon, 6=Sun
    const dow = (d.getUTCDay() + 6) % 7;
    byDayOfWeek[dow]++;
    byHourOfDay[d.getUTCHours()]++;
  }

  // Average issues per day (over entire active period)
  const activeDays = Math.max(1, (lastIssue - firstIssue) / MS_PER_DAY);
  const avgPerDay = Math.round((dates.length / activeDays) * 100) / 100;

  // Rolling 12-week average
  const twelveWeeksAgo = new Date(now.getTime() - ROLLING_WEEKS * MS_PER_WEEK);
  const recentIssues = sorted.filter((d) => d >= twelveWeeksAgo);
  const avgPerWeek =
    Math.round((recentIssues.length / ROLLING_WEEKS) * 10) / 10;

  // Streak calculation (consecutive weeks with >= 1 issue)
  const weekBuckets = new Map();
  for (const d of sorted) {
    const daysSinceEpoch = Math.floor(d.getTime() / MS_PER_DAY);
    const weekNum = Math.floor(daysSinceEpoch / 7);
    weekBuckets.set(weekNum, (weekBuckets.get(weekNum) || 0) + 1);
  }

  const weekNums = [...weekBuckets.keys()].sort((a, b) => a - b);
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  const currentWeekNum = Math.floor(Date.now() / MS_PER_DAY / 7);

  for (let i = 0; i < weekNums.length; i++) {
    if (i === 0 || weekNums[i] === weekNums[i - 1] + 1) {
      streak++;
    } else {
      streak = 1;
    }
    if (streak > longestStreak) longestStreak = streak;
    // Current streak: must include the current or previous week
    if (weekNums[i] >= currentWeekNum - 1) {
      currentStreak = streak;
    }
  }

  // Trend: compare last 4 weeks to prior 4 weeks
  const fourWeeksAgo = new Date(now.getTime() - TREND_WEEKS * MS_PER_WEEK);
  const eightWeeksAgo = new Date(
    now.getTime() - TREND_WEEKS * 2 * MS_PER_WEEK
  );
  const recentCount = sorted.filter((d) => d >= fourWeeksAgo).length;
  const priorCount = sorted.filter(
    (d) => d >= eightWeeksAgo && d < fourWeeksAgo
  ).length;

  let trend = "steady";
  if (recentCount === 0 && priorCount === 0) trend = "inactive";
  else if (recentCount > priorCount * TREND_RAMP_UP_RATIO) trend = "ramping_up";
  else if (recentCount < priorCount * TREND_SLOW_DOWN_RATIO)
    trend = "slowing_down";

  return {
    avg_per_week: avgPerWeek,
    avg_per_day: avgPerDay,
    by_day_of_week: byDayOfWeek,
    by_hour_of_day: byHourOfDay,
    current_streak_weeks: currentStreak,
    longest_streak_weeks: longestStreak,
    trend,
    first_issue_at: firstIssue.toISOString(),
    last_issue_at: lastIssue.toISOString(),
  };
}

// ── Activity timeline ────────────────────────────────────────────────

/**
 * Compute monthly issue counts for the activity timeline.
 * @param {string[]} dates - Issue creation date strings
 * @returns {object[]} Array of { month: "YYYY-MM", issue_count: N } for last 12 months
 */
function computeTimeline(dates) {
  const now = new Date();
  const months = [];

  for (let i = TIMELINE_MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: key, issue_count: 0 });
  }

  const monthSet = new Map(months.map((m) => [m.month, m]));

  for (const date of dates) {
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthSet.has(key)) {
      monthSet.get(key).issue_count++;
    }
  }

  return months;
}

// ── Suggestion generation ────────────────────────────────────────────

/**
 * Find "deepen" suggestions: open issues similar to the contributor's topic clusters.
 */
function findDeepenSuggestions(
  clusterCentroids,
  clusterNames,
  openIssues,
  login
) {
  const suggestions = [];

  for (const issue of openIssues) {
    if (issue.login === login) continue;

    let bestSim = 0;
    let bestTopic = "";

    for (let i = 0; i < clusterCentroids.length; i++) {
      const sim = cosineSimilarity(issue.vector, clusterCentroids[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestTopic = clusterNames[i];
      }
    }

    if (bestSim >= DEEPEN_SIMILARITY_THRESHOLD) {
      suggestions.push({
        title: issue.title,
        url: issue.url,
        repo: issue.repo,
        topic_match: bestTopic,
        similarity: bestSim,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, SUGGESTION_COUNT)
    .map(({ similarity, ...rest }) => rest);
}

// ── Console codebase areas ────────────────────────────────────────────
/**
 * Areas of the kubestellar/console codebase that contributors can explore.
 * Each area has keywords that map to its domain — used to check overlap with
 * a contributor's existing topic clusters via TF-IDF cosine similarity.
 */
const CONSOLE_CODEBASE_AREAS = [
  {
    name: "Dashboard & Cards",
    path: "web/src/components/cards/, web/src/components/dashboard/",
    description: "Dashboard layout, card framework, card registry, and individual monitoring cards",
    keywords: "dashboard card widget customizer layout grid drag drop monitor status",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/cards",
  },
  {
    name: "GPU & AI/ML",
    path: "web/src/components/gpu/, web/src/components/aiml/, web/src/components/llmd-benchmarks/",
    description: "GPU namespace allocations, AI/ML workload monitoring, llm-d benchmarks and performance",
    keywords: "gpu ai ml inference model benchmark latency throughput vllm llm performance",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/gpu",
  },
  {
    name: "Cluster Management",
    path: "web/src/components/clusters/, pkg/k8s/",
    description: "Multi-cluster views, cluster health, add/remove clusters, Kubernetes client",
    keywords: "cluster node kubeconfig context multicluster health add remove connect",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/clusters",
  },
  {
    name: "Security & RBAC",
    path: "web/src/components/security/, web/src/components/rbac/",
    description: "Security scanning, RBAC management, role bindings, compliance",
    keywords: "security rbac role permission policy vulnerability scan compliance trivy kubescape",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/security",
  },
  {
    name: "Deployments & GitOps",
    path: "web/src/components/deploy/, web/src/components/gitops/, web/src/components/cicd/",
    description: "Deployment management, GitOps sync, CI/CD pipelines, Helm charts",
    keywords: "deploy deployment gitops helm chart cicd pipeline release rollout canary",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/deploy",
  },
  {
    name: "Missions & AI Agent",
    path: "web/src/components/missions/, web/src/components/mission-control/, pkg/agent/",
    description: "AI-driven missions, mission browser, agent protocol, MCP integration",
    keywords: "mission agent mcp protocol ai assist automate task goal objective",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/missions",
  },
  {
    name: "Authentication & Settings",
    path: "web/src/components/auth/, web/src/components/settings/, pkg/api/middleware/",
    description: "OAuth flow, user settings, preferences, API middleware, authentication",
    keywords: "auth oauth login session token settings preference user profile middleware",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/auth",
  },
  {
    name: "Observability & Logs",
    path: "web/src/components/logs/, web/src/components/events/, web/src/components/alerts/",
    description: "Log streaming, event timeline, alerting, notifications",
    keywords: "log event alert notification observe monitor stream terminal watch",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/logs",
  },
  {
    name: "Networking & Services",
    path: "web/src/components/network/, web/src/components/services/",
    description: "Service mesh, ingress, network policies, service discovery",
    keywords: "network service ingress mesh policy dns endpoint load balance",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/network",
  },
  {
    name: "Storage & Compute",
    path: "web/src/components/storage/, web/src/components/compute/",
    description: "Persistent volumes, storage classes, compute resource management",
    keywords: "storage volume pvc pv class compute resource capacity provision",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/storage",
  },
  {
    name: "Backend API & Handlers",
    path: "pkg/api/, pkg/models/, pkg/store/",
    description: "Go backend REST API, request handlers, data models, persistence layer",
    keywords: "api handler endpoint rest backend server route model store database",
    url: "https://github.com/kubestellar/console/tree/main/pkg/api",
  },
  {
    name: "Marketplace & Operators",
    path: "web/src/components/marketplace/, web/src/components/operators/",
    description: "Plugin marketplace, operator management, extensions",
    keywords: "marketplace plugin operator extension install catalog addon",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/marketplace",
  },
  {
    name: "Onboarding & Rewards",
    path: "web/src/components/onboarding/, web/src/components/rewards/",
    description: "New user onboarding, gamification, contributor rewards system",
    keywords: "onboard tour wizard reward point level badge gamification leaderboard",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/onboarding",
  },
  {
    name: "Charts & Visualizations",
    path: "web/src/components/charts/, web/src/components/drilldown/",
    description: "Data visualization components, chart library, drill-down views",
    keywords: "chart graph visualize bar line pie sparkline drilldown timeseries",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/charts",
  },
  {
    name: "Cost Management",
    path: "web/src/components/cost/",
    description: "Cloud cost analysis, resource cost allocation, budgeting",
    keywords: "cost budget spend allocation cloud resource optimize expense",
    url: "https://github.com/kubestellar/console/tree/main/web/src/components/cost",
  },
];

/**
 * Find "stretch" suggestions: console codebase areas the contributor hasn't focused on.
 * Compares the contributor's topic cluster centroids against each codebase area's
 * keyword vector. Areas with low similarity to all clusters are "new territory."
 *
 * @param {Map<string, number>[]} clusterCentroids - Contributor's topic centroids
 * @param {Map<string, number>[]} areaVectors - Pre-computed TF-IDF vectors for codebase areas
 * @returns {object[]} Codebase areas the contributor hasn't explored
 */
function findStretchAreas(clusterCentroids, areaVectors) {
  const uncovered = [];

  for (let i = 0; i < CONSOLE_CODEBASE_AREAS.length; i++) {
    const area = CONSOLE_CODEBASE_AREAS[i];
    const areaVec = areaVectors[i];

    // Check max similarity to any of the contributor's clusters
    let maxSim = 0;
    for (const c of clusterCentroids) {
      const sim = cosineSimilarity(areaVec, c);
      if (sim > maxSim) maxSim = sim;
    }

    // If the area doesn't overlap with any cluster, it's a stretch
    if (maxSim < AREA_COVERED_THRESHOLD) {
      uncovered.push({
        name: area.name,
        path: area.path,
        description: area.description,
        url: area.url,
        similarity: maxSim,
      });
    }
  }

  // Sort by least similar first (most novel areas)
  return uncovered
    .sort((a, b) => a.similarity - b.similarity)
    .slice(0, SUGGESTION_COUNT)
    .map(({ similarity, ...rest }) => rest);
}

// ── Data fetching ────────────────────────────────────────────────────

async function fetchAllIssuesWithBodies(repo) {
  const allItems = [];

  for (let page = 1; page <= REST_MAX_PAGES; page++) {
    const url = `${API_BASE}/repos/${repo}/issues?state=all&per_page=${REST_PER_PAGE}&page=${page}&sort=created&direction=desc`;

    if (page > 1) await delay(REST_PAGE_DELAY_MS);

    const items = await ghFetch(url);
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
      const clusters = agglomerativeClustering(myVectors);

      for (const cluster of clusters) {
        const clusterVecs = cluster.map((idx) => myVectors[idx]);
        const clusterCenter = centroid(clusterVecs);
        const name = nameCluster(clusterCenter);
        const clusterIssues = cluster.map((idx) => myIssues[idx]);
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
