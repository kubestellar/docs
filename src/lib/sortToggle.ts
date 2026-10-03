// ── Shared sortable-column toggle logic ─────────────────────────────────
// Single source of truth for the "click a column header to sort" state
// transition shared between src/app/[locale]/leaderboard/page.tsx and
// src/app/[locale]/acmm-leaderboard/page.tsx.
//
// These previously hand-rolled the same transition independently (inline
// in leaderboard/page.tsx, as a local toggleSort() in
// acmm-leaderboard/page.tsx) and had already drifted on whether a newly
// selected column defaults to "asc" or "desc". Import from here instead
// of re-implementing the transition.

export type SortDir = "asc" | "desc";

/**
 * Computes the next { field, dir } when a sortable column header is clicked.
 *
 * - Clicking the currently active column flips its direction.
 * - Clicking a different column selects it, starting at `defaultDir`
 *   (defaults to "desc").
 */
export function nextSortState<F extends string>(
  currentField: F,
  currentDir: SortDir,
  clickedField: F,
  defaultDir: SortDir = "desc"
): { field: F; dir: SortDir } {
  if (currentField === clickedField) {
    return { field: currentField, dir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { field: clickedField, dir: defaultDir };
}
