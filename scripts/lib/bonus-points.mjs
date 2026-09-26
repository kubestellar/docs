/**
 * "Bonus points" awards: manually-created issues on kubestellar/console,
 * labeled `bonus-points` and opened by an authorized maintainer, granting
 * extra points to a contributor. Always fetched fresh (small query).
 */

import { API_BASE, REST_PER_PAGE, ghFetch } from "./github-fetch.mjs";

const BONUS_AUTHORIZED_USER = "clubanderson";
const BONUS_LABEL = "bonus-points";
const BONUS_REPO = "kubestellar/console";
const BONUS_TITLE_REGEX = /^\[bonus\]\s+@(\S+)\s+\+(\d+)\s*(.*)/i;

export async function fetchBonusPoints(headers) {
  const bonuses = new Map();

  try {
    const url = `${API_BASE}/repos/${BONUS_REPO}/issues?labels=${BONUS_LABEL}&state=all&per_page=${REST_PER_PAGE}&creator=${BONUS_AUTHORIZED_USER}`;
    const issues = await ghFetch(url, headers);

    for (const issue of issues) {
      if (issue.user?.login !== BONUS_AUTHORIZED_USER) continue;

      const match = issue.title.match(BONUS_TITLE_REGEX);
      if (!match) {
        console.warn(`  Skipping malformed bonus issue #${issue.number}: "${issue.title}"`);
        continue;
      }

      const [, login, pointsStr, reason] = match;
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points <= 0) continue;

      if (!bonuses.has(login)) {
        bonuses.set(login, { points: 0, reasons: [] });
      }
      const entry = bonuses.get(login);
      entry.points += points;
      entry.reasons.push(`#${issue.number}: +${points} ${reason.trim() || "(no reason)"}`);
    }
  } catch (err) {
    console.warn(`  Warning: failed to fetch bonus issues: ${err.message}`);
  }

  return bonuses;
}
