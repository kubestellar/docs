/**
 * Shared radar chart constants and computation logic.
 * Used by both the full profile radar chart and the leaderboard hover mini radar.
 */

export interface RadarTopicCluster {
  name: string;
  issue_count: number;
}

/** Number of axes in the radar chart */
export const RADAR_AXIS_COUNT = 6;
/** Minimum score threshold to display a dimension (avoids empty-looking charts) */
export const RADAR_MIN_DISPLAY_SCORE = 0.08;

/**
 * The 6 contribution dimensions, each with keywords that map topics to that axis.
 * Keywords are matched case-insensitively against topic cluster names.
 */
export const RADAR_DIMENSIONS = [
  {
    label: "Operations",
    keywords: [
      "cluster", "health", "monitor", "kubectl", "k8s", "node", "kubeconfig",
      "context", "multicluster", "connect", "deployment", "deploy", "unhealthy",
      "api", "handler", "endpoint", "backend", "server", "route", "store",
      "resource", "compute", "capacity", "provision", "helm", "gitops",
      "cicd", "pipeline", "release", "rollout", "startup", "dependency",
      "build", "npm", "pull",
    ],
  },
  {
    label: "Dashboard",
    keywords: [
      "dashboard", "card", "widget", "layout", "grid", "drag", "drop",
      "chart", "graph", "visualize", "bar", "line", "pie", "sparkline",
      "drilldown", "timeseries", "css", "style", "theme", "ui", "component",
      "sidebar", "collapse", "popup", "icon", "panel", "display", "view",
      "tab", "settings", "preference", "onboard", "tour", "wizard",
      "marketplace", "install",
    ],
  },
  {
    label: "Agents",
    keywords: [
      "agent", "kagent", "kagenti", "mcp", "protocol", "ai", "assist",
      "automate", "llm", "model", "provider", "openai", "claude", "gemini",
      "fallback", "inference", "vllm",
    ],
  },
  {
    label: "Missions",
    keywords: [
      "mission", "mission-control", "browser", "deploy", "workflow",
      "objective", "goal", "task", "export", "yaml", "markdown", "json",
      "history", "pagination",
    ],
  },
  {
    label: "Testing",
    keywords: [
      "test", "coverage", "nightly", "e2e", "playwright", "jest", "spec",
      "fixture", "mock", "stub", "fork", "ci", "workflow", "automation",
    ],
  },
  {
    label: "Security",
    keywords: [
      "rbac", "auth", "oauth", "login", "session", "token", "permission",
      "role", "security", "vulnerability", "scan", "compliance", "trivy",
      "kubescape", "validation", "encryption", "middleware", "policy",
    ],
  },
] as const;

/**
 * Compute radar scores from topic clusters.
 * Each dimension gets a score proportional to the issue count of topics
 * whose names match that dimension's keywords.
 */
export function computeRadarScores(topics: RadarTopicCluster[]): number[] {
  if (!topics || topics.length === 0) {
    return new Array(RADAR_AXIS_COUNT).fill(0);
  }

  const rawScores = new Array(RADAR_AXIS_COUNT).fill(0);

  for (const topic of topics) {
    const topicWords = topic.name.toLowerCase().split(/[\s,]+/);

    for (let i = 0; i < RADAR_DIMENSIONS.length; i++) {
      const dimension = RADAR_DIMENSIONS[i];
      let matchStrength = 0;

      for (const keyword of dimension.keywords) {
        for (const word of topicWords) {
          if (word.includes(keyword) || keyword.includes(word)) {
            matchStrength++;
          }
        }
      }

      if (matchStrength > 0) {
        rawScores[i] += topic.issue_count * matchStrength;
      }
    }
  }

  // Normalize to 0..1 range
  const maxScore = Math.max(...rawScores, 1);
  return rawScores.map((s) => Math.max(s / maxScore, 0));
}

/**
 * Calculate a point on the radar chart given an axis index, score (0..1),
 * and chart parameters.
 */
export function radarPoint(
  axisIndex: number,
  score: number,
  radius: number,
  center: number,
): { x: number; y: number } {
  /** Offset so first axis points straight up (negative Y) */
  const ANGLE_OFFSET = -Math.PI / 2;
  const angle =
    ANGLE_OFFSET + (2 * Math.PI * axisIndex) / RADAR_AXIS_COUNT;
  return {
    x: center + radius * score * Math.cos(angle),
    y: center + radius * score * Math.sin(angle),
  };
}
