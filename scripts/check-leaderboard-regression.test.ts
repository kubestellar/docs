/**
 * Integration tests for scripts/check-leaderboard-regression.mjs.
 *
 * The script has no exported functions — it reads leaderboard.json from
 * `public/data/`, compares against `git show HEAD:public/data/leaderboard.json`,
 * and exits non-zero when a top-N contributor lost more than 10% of their
 * points. To exercise it without touching production data, each test spawns
 * the script inside a temp git repo whose `public/data/leaderboard.json`
 * stands in for the docs checkout.
 *
 * The temp repo layout mirrors the real one so the script's
 * `join(__dirname, "..", "public", "data", "leaderboard.json")` still points
 * at the fixture: we symlink `scripts/` from the real repo into the temp dir.
 */
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const SCRIPT_SRC = join(REPO_ROOT, "scripts", "check-leaderboard-regression.mjs");
const SCRIPT_REL = "scripts/check-leaderboard-regression.mjs";

// Build a temp docs-repo-shaped directory with an initial committed
// leaderboard.json (the "previous" snapshot) and an unstaged replacement
// (the "new" snapshot). Returns the temp dir root.
function makeFixtureRepo(previous: unknown, next: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "leaderboard-regression-"));
  mkdirSync(join(dir, "public", "data"), { recursive: true });
  // Copy (not symlink) so node's realpath-based __dirname points at the temp
  // dir and the script resolves its `../public/data/leaderboard.json` against
  // the fixture instead of the real docs repo.
  mkdirSync(join(dir, "scripts"), { recursive: true });
  copyFileSync(SCRIPT_SRC, join(dir, "scripts", "check-leaderboard-regression.mjs"));

  const jsonPath = join(dir, "public", "data", "leaderboard.json");
  writeFileSync(jsonPath, JSON.stringify(previous));

  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  git("config", "commit.gpgsign", "false");
  git("add", "public/data/leaderboard.json");
  git("commit", "-q", "-m", "seed leaderboard");

  // Overwrite with the "new" snapshot (the working-tree state the guard reads).
  writeFileSync(jsonPath, JSON.stringify(next));
  return dir;
}

function runScript(dir: string, env: Record<string, string> = {}) {
  return spawnSync(
    process.execPath,
    [SCRIPT_REL],
    {
      cwd: dir,
      env: { ...process.env, ...env },
      encoding: "utf8",
    },
  );
}

describe("check-leaderboard-regression.mjs", () => {
  const tempDirs: string[] = [];
  const track = (d: string) => { tempDirs.push(d); return d; };
  afterAll(() => {
    for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
  });

  test("passes when top contributors are stable", () => {
    const snap = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
      ],
    };
    const dir = track(makeFixtureRepo(snap, snap));
    const res = runScript(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Regression check passed");
  });

  test("fails when a top-3 contributor drops more than 10%", () => {
    const previous = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
      ],
    };
    const next = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 500 }, // −50%: must trip.
        { login: "bob",   total_points: 900 },
        { login: "carol", total_points: 800 },
      ],
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("LEADERBOARD REGRESSION DETECTED");
    expect(res.stderr).toContain("alice");
    expect(res.stderr).toContain("50.0%");
  });

  test("passes when a top-3 contributor drops by exactly the 10% threshold", () => {
    // The guard uses `dropPct > threshold` (strictly greater), so a drop of
    // exactly 10% must NOT be flagged. This is the boundary contract.
    const previous = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
      ],
    };
    const next = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 900 }, // exactly −10%
        { login: "bob",   total_points: 900 },
        { login: "carol", total_points: 800 },
      ],
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Regression check passed");
  });

  test("prints a warning glyph but still passes for a small drop under threshold", () => {
    const previous = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
      ],
    };
    const next = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 950 }, // −5%
        { login: "bob",   total_points: 900 },
        { login: "carol", total_points: 800 },
      ],
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/alice.*5\.0%/);
  });

  test("skips a top contributor who is new to the top N", () => {
    const previous = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
      ],
    };
    const next = {
      year_start: "2026-01-01",
      entries: [
        { login: "dave",  total_points: 1200 }, // brand new to top 3
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
      ],
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/dave: new to top 3 — skipping/);
  });

  test("only inspects the top 3 — a big drop for a 4th-ranked contributor is ignored", () => {
    // eve was 4th before (not in top 3), so even a −50% drop must not fail.
    const previous = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
        { login: "eve",   total_points:  700 },
      ],
    };
    const next = {
      year_start: "2026-01-01",
      entries: [
        { login: "alice", total_points: 1000 },
        { login: "bob",   total_points:  900 },
        { login: "carol", total_points:  800 },
        { login: "eve",   total_points:  350 },
      ],
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir);
    expect(res.status).toBe(0);
  });

  test("LEADERBOARD_FORCE=1 bypasses the check entirely", () => {
    const previous = {
      year_start: "2026-01-01",
      entries: [{ login: "alice", total_points: 1000 }],
    };
    const next = {
      year_start: "2026-01-01",
      entries: [{ login: "alice", total_points: 10 }], // would normally fail
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir, { LEADERBOARD_FORCE: "1" });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("LEADERBOARD_FORCE=1");
  });

  test("skips when the scoring year_start changed", () => {
    // Year-boundary rollover: guard must skip and exit 0 rather than firing.
    const previous = {
      year_start: "2026-01-01",
      entries: [{ login: "alice", total_points: 1000 }],
    };
    const next = {
      year_start: "2027-01-01",
      entries: [{ login: "alice", total_points: 10 }],
    };
    const dir = track(makeFixtureRepo(previous, next));
    const res = runScript(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Scoring year changed");
  });

  test("skips when there is no previous snapshot in git HEAD", () => {
    // Fresh checkout with no committed leaderboard.json — the guard should
    // report "no previous snapshot" and exit 0.
    const dir = mkdtempSync(join(tmpdir(), "leaderboard-regression-fresh-"));
    tempDirs.push(dir);
    mkdirSync(join(dir, "public", "data"), { recursive: true });
    mkdirSync(join(dir, "scripts"), { recursive: true });
    copyFileSync(SCRIPT_SRC, join(dir, "scripts", "check-leaderboard-regression.mjs"));
    // Only commit an unrelated file so HEAD exists but leaderboard.json does not.
    writeFileSync(join(dir, "public", "data", "leaderboard.json"),
      JSON.stringify({ entries: [] }));
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@e.com");
    git("config", "user.name", "t");
    git("config", "commit.gpgsign", "false");
    writeFileSync(join(dir, "README"), "seed");
    git("add", "README");
    git("commit", "-q", "-m", "seed");

    const res = runScript(dir);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("No previous leaderboard snapshot");
  });

  test("fails with a helpful error when the new leaderboard file is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "leaderboard-regression-missing-"));
    tempDirs.push(dir);
    mkdirSync(join(dir, "public", "data"), { recursive: true });
    mkdirSync(join(dir, "scripts"), { recursive: true });
    copyFileSync(SCRIPT_SRC, join(dir, "scripts", "check-leaderboard-regression.mjs"));
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@e.com");
    git("config", "user.name", "t");
    git("config", "commit.gpgsign", "false");
    writeFileSync(join(dir, "README"), "seed");
    git("add", "README");
    git("commit", "-q", "-m", "seed");
    // Intentionally do NOT create public/data/leaderboard.json.

    const res = runScript(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("Failed to read new leaderboard.json");
  });
});
