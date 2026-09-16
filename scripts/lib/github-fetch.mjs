/**
 * GitHub REST API fetch helpers extracted from
 * scripts/generate-contributor-profiles.mjs so the pagination/label logic
 * can be reused and unit-tested independently of the network calls made by
 * the runner.
 *
 * See scripts/lib/github-fetch.test.mjs for the contract these functions
 * must uphold.
 */

export const API_BASE = "https://api.github.com";
/** Items per page for REST API pagination */
export const REST_PER_PAGE = 100;
/** Maximum pages to fetch per repo */
export const REST_MAX_PAGES = 100;
/** Delay between REST API pages (ms) */
export const REST_PAGE_DELAY_MS = 100;

// ── Label classification ──────────────────────────────────────────────
const BUG_LABELS = new Set(["bug", "kind/bug", "type/bug"]);
const FEATURE_LABELS = new Set([
  "enhancement",
  "feature",
  "kind/feature",
  "type/feature",
]);

/** Classify an issue as "bug", "feature", or "other" based on its labels. */
export function classifyIssueLabels(labels) {
  for (const label of labels) {
    if (BUG_LABELS.has(label.name)) return "bug";
    if (FEATURE_LABELS.has(label.name)) return "feature";
  }
  return "other";
}

/** Build the default GitHub REST API request headers for the given token. */
export function buildDefaultHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Perform a GitHub REST API GET request, throwing on non-2xx responses. */
export async function ghFetch(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}
