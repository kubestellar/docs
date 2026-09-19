/**
 * Pure history-bookkeeping helpers extracted from
 * scripts/generate-acmm-history.mjs so the rolling-window, idempotency,
 * and legacy-migration logic can be unit-tested independently of the
 * network scan calls made by the runner.
 *
 * See scripts/lib/acmm-history.test.mjs for the contract these functions
 * must uphold.
 */

/** Format a Date as a UTC "YYYY-MM-DD" string. */
export function todayUTC(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Normalize a freshly-parsed history file: migrate the legacy "weeks" key
 * to "dates" and ensure the "dates"/"scores" containers exist.
 */
export function migrateLegacyHistory(raw) {
  const history = { ...raw };
  if (history.weeks && !history.dates) {
    history.dates = history.weeks;
    delete history.weeks;
  }
  if (!history.dates) history.dates = [];
  if (!history.scores) history.scores = {};
  return history;
}

/**
 * Cold start: seed an empty history with the recorded snapshot scores as
 * data point 0. Mutates and returns `history` (no-op if already seeded).
 */
export function seedColdStart(history, repos, seedDate, seedScores) {
  if (history.dates.length !== 0) return history;
  history.dates.push(seedDate);
  for (const repo of repos) {
    if (!history.scores[repo]) history.scores[repo] = [];
    history.scores[repo].push(seedScores[repo] ?? 0);
  }
  return history;
}

/**
 * Determine whether today's scan is a no-op (already recorded with
 * detectedIds), a backfill (recorded but missing detectedIds), or a fresh
 * append.
 */
export function checkIdempotency(history, today) {
  const detectedIdsPopulated =
    !!history.detectedIds && Object.keys(history.detectedIds).length > 0;
  const alreadyRecorded = history.dates[history.dates.length - 1] === today;
  return {
    detectedIdsPopulated,
    alreadyRecorded,
    isNoOp: alreadyRecorded && detectedIdsPopulated,
    isBackfill: alreadyRecorded && !detectedIdsPopulated,
  };
}

/**
 * Append (or, if backfilling, overwrite the last entry of) today's scan
 * results into the history, store the latest detectedIds, trim to
 * `maxDataPoints`, and drop any repos no longer being tracked. Mutates and
 * returns `history`.
 */
export function applyScanResults(
  history,
  { repos, today, scores, latestDetectedIds, isBackfill, maxDataPoints }
) {
  if (isBackfill) {
    const idx = history.dates.length - 1;
    for (const repo of repos) {
      if (!history.scores[repo]) history.scores[repo] = [];
      history.scores[repo][idx] = scores[repo] ?? 0;
    }
  } else {
    history.dates.push(today);
    for (const repo of repos) {
      if (!history.scores[repo]) history.scores[repo] = [];
      history.scores[repo].push(scores[repo] ?? 0);
    }
  }

  history.detectedIds = latestDetectedIds;

  while (history.dates.length > maxDataPoints) {
    history.dates.shift();
    for (const repo of Object.keys(history.scores)) {
      history.scores[repo]?.shift();
    }
  }

  const repoSet = new Set(repos);
  for (const repo of Object.keys(history.scores)) {
    if (!repoSet.has(repo)) delete history.scores[repo];
  }

  return history;
}
