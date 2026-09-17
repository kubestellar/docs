/**
 * Date helpers used by the leaderboard's incremental snapshot strategy.
 *
 * See scripts/generate-leaderboard.mjs for how the snapshot/live window
 * boundaries are computed from these helpers.
 */

/** Truncate a date to midnight UTC. */
export function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Add (or subtract, with a negative value) a number of days to a date. */
export function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
