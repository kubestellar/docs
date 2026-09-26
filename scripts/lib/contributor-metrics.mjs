/**
 * Cadence/timeline/suggestion helpers extracted from
 * scripts/generate-contributor-profiles.mjs so the pure, network-free
 * computations can be unit-tested independently of the GitHub API calls
 * and TF-IDF clustering pipeline in the runner.
 *
 * See scripts/lib/contributor-metrics.test.mjs for the contract these
 * functions must uphold.
 */

import { cosineSimilarity } from "./text-clustering.mjs";

// ── Cadence constants ──────────────────────────────────────────────────
/** Number of weeks for rolling average calculation */
export const ROLLING_WEEKS = 12;
/** Number of weeks for trend comparison (recent vs prior) */
export const TREND_WEEKS = 4;
/** Milliseconds in one week */
export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
/** Milliseconds in one day */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Number of months for activity timeline */
export const TIMELINE_MONTHS = 12;
/** Trend threshold: ratio above which counts as "ramping up" */
export const TREND_RAMP_UP_RATIO = 1.5;
/** Trend threshold: ratio below which counts as "slowing down" */
export const TREND_SLOW_DOWN_RATIO = 0.5;

// ── Suggestion constants ───────────────────────────────────────────────
/** Minimum cosine similarity for a "deepen" suggestion match */
export const DEEPEN_SIMILARITY_THRESHOLD = 0.2;
/** Minimum cosine similarity for a codebase area to be considered "covered" by a contributor */
export const AREA_COVERED_THRESHOLD = 0.1;
/** Number of suggestions per category (deepen/stretch) */
export const SUGGESTION_COUNT = 5;

// ── Cadence metrics ──────────────────────────────────────────────────

/**
 * Compute engagement cadence from issue timestamps.
 * @param {string[]} dates - Issue creation date strings (ISO 8601)
 * @returns {object} Cadence metrics object
 */
export function computeCadence(dates) {
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
export function computeTimeline(dates) {
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
export function findDeepenSuggestions(
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
export const CONSOLE_CODEBASE_AREAS = [
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
export function findStretchAreas(clusterCentroids, areaVectors) {
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
