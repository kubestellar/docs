// Shared rank medal + display for the leaderboards.
//
// Two leaderboards (src/app/[locale]/leaderboard and
// src/app/[locale]/acmm-leaderboard) previously each carried a byte-
// equivalent local `RankDisplay` component and hand-copied medal emoji.
// This module is the single source of truth; both call sites re-export
// from here so their existing import paths keep working.

import React from "react";

export const GOLD_MEDAL = "🥇";
export const SILVER_MEDAL = "🥈";
export const BRONZE_MEDAL = "🥉";

/**
 * Rank badge for a leaderboard row.
 *
 * - Rank 1/2/3 → gold/silver/bronze medal
 * - Any other rank → "#N" in muted tabular-nums
 */
export function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="text-xl" title="1st place">
        {GOLD_MEDAL}
      </span>
    );
  if (rank === 2)
    return (
      <span className="text-xl" title="2nd place">
        {SILVER_MEDAL}
      </span>
    );
  if (rank === 3)
    return (
      <span className="text-xl" title="3rd place">
        {BRONZE_MEDAL}
      </span>
    );
  return <span className="text-sm text-gray-400 tabular-nums">#{rank}</span>;
}
