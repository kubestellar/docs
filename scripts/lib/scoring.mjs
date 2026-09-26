/**
 * Leaderboard scoring rules: point values (mirrors rewards.go), contributor
 * levels, and the recency-weighted "activity score" used for the weekly
 * sparkline trend.
 */

import { classifyIssueLabels as classifyLabels } from "./github-fetch.mjs";

// ── Point values (mirrors rewards.go) ─────────────────────────────────
export const POINTS_BUG_ISSUE = 300;
export const POINTS_FEATURE_ISSUE = 100;
export const POINTS_OTHER_ISSUE = 50;
export const POINTS_PR_OPENED = 200;
export const POINTS_PR_MERGED = 500;

// ── Contributor levels ────────────────────────────────────────────────
export const CONTRIBUTOR_LEVELS = [
  { rank: 1, name: "Observer", minCoins: 0 },
  { rank: 2, name: "Explorer", minCoins: 500 },
  { rank: 3, name: "Navigator", minCoins: 2000 },
  { rank: 4, name: "Pilot", minCoins: 5000 },
  { rank: 5, name: "Commander", minCoins: 15000 },
  { rank: 6, name: "Captain", minCoins: 50000 },
  { rank: 7, name: "Admiral", minCoins: 150000 },
  { rank: 8, name: "Legend", minCoins: 500000 },
];

// ── Weekly activity trend constants ───────────────────────────────────
export const ACTIVITY_WEEKS = 12;
export const RECENCY_HALF_LIFE = 3;

/** Classify an issue by label and attach its point value. */
export function classifyIssueLabels(labels) {
  const type = classifyLabels(labels);
  if (type === "bug") return { type: "issue_bug", points: POINTS_BUG_ISSUE };
  if (type === "feature")
    return { type: "issue_feature", points: POINTS_FEATURE_ISSUE };
  return { type: "issue_other", points: POINTS_OTHER_ISSUE };
}

export function getLevelForPoints(totalPoints) {
  let level = CONTRIBUTOR_LEVELS[0];
  for (let i = CONTRIBUTOR_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= CONTRIBUTOR_LEVELS[i].minCoins) {
      level = CONTRIBUTOR_LEVELS[i];
      break;
    }
  }
  return level;
}

// ── Weekly activity ───────────────────────────────────────────────────

export function weekKeyForDate(isoDateStr) {
  const d = new Date(isoDateStr);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getRecentWeekKeys(numWeeks) {
  const now = new Date();
  const keys = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    keys.push(weekKeyForDate(d.toISOString()));
  }
  return [...new Set(keys)].sort();
}

/** Recency-weighted score: more recent weeks count more (half-life decay). */
export function computeRecentScore(weeklyCounts) {
  let score = 0;
  const len = weeklyCounts.length;
  for (let i = 0; i < len; i++) {
    const weeksAgo = len - 1 - i;
    const weight = Math.pow(0.5, weeksAgo / RECENCY_HALF_LIFE);
    score += weeklyCounts[i] * weight;
  }
  return Math.round(score * 100) / 100;
}
