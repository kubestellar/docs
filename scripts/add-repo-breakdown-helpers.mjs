/**
 * Pure helpers extracted from scripts/add-repo-breakdown.mjs so they can be
 * unit-tested independently of the GitHub API fetch loop and disk I/O in the
 * runner. Keep these free of side effects and network calls — the runner
 * imports them and wires them to fetched issue items.
 *
 * See scripts/add-repo-breakdown-helpers.test.mjs for the contract these
 * functions must uphold.
 */

/**
 * Categorize an already-flattened list of issue items into per-repo counts.
 *
 * Each item is expected to have:
 *   - repo:      "<owner>/<repo>" (string)
 *   - is_pr:     boolean (true if the item is a pull request, false if issue)
 *   - merged_at: string|null (PR-only; non-null means the PR was merged)
 *   - labels:    string[] (may include "kind/bug" or "kind/feature")
 *
 * Returns a Map keyed by repo string, with per-repo aggregates:
 *   { repo, bug_issues, feature_issues, other_issues, prs_opened, prs_merged }
 *
 * The classification rules mirror the runner's inline logic exactly:
 *   - PRs count toward prs_opened, and additionally prs_merged if merged_at
 *     is truthy.
 *   - Issues (non-PRs) count as bug_issues if labels include "kind/bug",
 *     otherwise feature_issues if labels include "kind/feature", otherwise
 *     other_issues. "kind/bug" wins over "kind/feature" when both are set.
 */
export function categorizeIssuesByRepo(items) {
  const repoBreakdownMap = new Map();
  for (const item of items) {
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
      if (item.labels.includes("kind/bug")) rb.bug_issues++;
      else if (item.labels.includes("kind/feature")) rb.feature_issues++;
      else rb.other_issues++;
    }
  }
  return repoBreakdownMap;
}

/**
 * Sort a categorized repo-breakdown map into a stable array, ordered by
 * descending total activity: prs_opened + bug_issues + feature_issues +
 * other_issues (prs_merged is a subset of prs_opened and is intentionally
 * NOT double-counted, matching the runner's original expression).
 */
export function sortRepoBreakdown(repoBreakdownMap) {
  return [...repoBreakdownMap.values()].sort(
    (a, b) =>
      (b.prs_opened + b.bug_issues + b.feature_issues + b.other_issues) -
      (a.prs_opened + a.bug_issues + a.feature_issues + a.other_issues)
  );
}
