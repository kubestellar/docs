/**
 * Shape / invariant tests for src/app/[locale]/acmm-leaderboard/data.ts.
 *
 * The ACMM leaderboard page (src/app/[locale]/acmm-leaderboard/page.tsx)
 * consumes three exports from ./data:
 *   - ACMM_PROJECTS    — the 289-row snapshot rendered as the table
 *   - BADGE_PARTICIPANTS — the Set of "org/repo" strings that get the
 *                        badge decoration in the row
 *   - SNAPSHOT_DATE    — the "yyyy-MM-dd" string shown in the header
 *
 * The file is otherwise pure data: no code paths, no functions, so if a
 * later edit drifts (duplicate repos, non-string SNAPSHOT_DATE, a badge
 * participant that isn't in ACMM_PROJECTS anymore, a project with a
 * level outside the model's 1..5 range, etc.) nothing catches it before
 * the page renders wrong. These tests catch that at CI time.
 */
import { describe, it, expect } from "vitest";
import {
  ACMM_PROJECTS,
  BADGE_PARTICIPANTS,
  SNAPSHOT_DATE,
  type AcmmProject,
} from "../app/[locale]/acmm-leaderboard/data";

describe("acmm-leaderboard/data — SNAPSHOT_DATE", () => {
  it("is a non-empty ISO yyyy-MM-dd string", () => {
    expect(typeof SNAPSHOT_DATE).toBe("string");
    expect(SNAPSHOT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses as a real calendar date", () => {
    const parsed = new Date(`${SNAPSHOT_DATE}T00:00:00Z`);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    // Round-trip the ISO date portion so a value like "2026-02-30"
    // (which Date silently normalises to 2026-03-02) fails here.
    expect(parsed.toISOString().slice(0, 10)).toBe(SNAPSHOT_DATE);
  });
});

describe("acmm-leaderboard/data — BADGE_PARTICIPANTS", () => {
  it("is a non-empty Set of strings", () => {
    expect(BADGE_PARTICIPANTS).toBeInstanceOf(Set);
    expect(BADGE_PARTICIPANTS.size).toBeGreaterThan(0);
    for (const repo of BADGE_PARTICIPANTS) {
      expect(typeof repo).toBe("string");
      expect(repo.length).toBeGreaterThan(0);
    }
  });

  it('every entry is an "owner/repo" pair', () => {
    for (const repo of BADGE_PARTICIPANTS) {
      // Exactly one slash separating two non-empty segments; matches how
      // the page renders and how ACMM_PROJECTS keys projects.
      expect(repo).toMatch(/^[^/\s]+\/[^/\s]+$/);
    }
  });

  it("includes kubestellar/console (the project this leaderboard belongs to)", () => {
    // Sanity anchor: dropping the project's own badge would be a
    // regression obvious to any human reader; assert it explicitly.
    expect(BADGE_PARTICIPANTS.has("kubestellar/console")).toBe(true);
  });

  it("every participant appears in ACMM_PROJECTS", () => {
    // The badge decoration is rendered inline in each row — a
    // participant that isn't in the table silently gets no badge.
    const repos = new Set(ACMM_PROJECTS.map(p => p.repo));
    for (const badgeRepo of BADGE_PARTICIPANTS) {
      expect(
        repos.has(badgeRepo),
        `${badgeRepo} missing from ACMM_PROJECTS`
      ).toBe(true);
    }
  });
});

describe("acmm-leaderboard/data — ACMM_PROJECTS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(ACMM_PROJECTS)).toBe(true);
    expect(ACMM_PROJECTS.length).toBeGreaterThan(0);
  });

  it("every entry matches the AcmmProject shape", () => {
    for (const p of ACMM_PROJECTS) {
      // Structural check — mirrors the interface exactly.
      const proj: AcmmProject = p;
      expect(typeof proj.repo).toBe("string");
      expect(proj.repo).toMatch(/^[^/\s]+\/[^/\s]+$/);
      expect(typeof proj.level).toBe("number");
      expect(Number.isInteger(proj.level)).toBe(true);
      expect(typeof proj.score).toBe("number");
      expect(Number.isFinite(proj.score)).toBe(true);
      if (proj.unmetPrereqs !== undefined) {
        expect(typeof proj.unmetPrereqs).toBe("boolean");
      }
    }
  });

  it("all levels are within the ACMM 1..5 range", () => {
    // The ACMM defines levels L1..L5; anything outside is a data typo.
    // The page treats levels below L1 as "unmet prereqs" and expects
    // that state to be signalled via the optional flag, not by a
    // negative or fractional level number.
    for (const { repo, level } of ACMM_PROJECTS) {
      expect(level, `${repo} level=${level}`).toBeGreaterThanOrEqual(1);
      expect(level, `${repo} level=${level}`).toBeLessThanOrEqual(5);
    }
  });

  it("all scores are non-negative", () => {
    // Scores in the snapshot are integer counts; a negative would
    // render as garbage in the sort/comparison logic on the page.
    for (const { repo, score } of ACMM_PROJECTS) {
      expect(score, `${repo} score=${score}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("has unique repo keys (no accidental duplicates on edits)", () => {
    // The page keys rows by repo; duplicates would render twice and
    // undercount filters like `filtered.length of ACMM_PROJECTS.length`.
    const repos = ACMM_PROJECTS.map(p => p.repo);
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const r of repos) {
      if (seen.has(r)) dupes.push(r);
      seen.add(r);
    }
    expect(dupes, `duplicates: ${dupes.join(", ")}`).toEqual([]);
    expect(seen.size).toBe(repos.length);
  });
});
