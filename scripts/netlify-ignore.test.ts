/**
 * Subprocess-style tests for scripts/netlify-ignore.sh — Netlify's
 * per-build "ignore" hook. The exit-code contract is the whole point
 * of the script: exit 0 skips the build (used to short-circuit deploy
 * previews for `chore/hive-snapshot*` automation branches so Netlify
 * preview minutes are not consumed), exit 1 proceeds with the build.
 * Inverting either arm silently breaks previews for the entire site
 * or wastes runner minutes on throwaway snapshot branches — a
 * failure mode with no user-facing signal until the bill or the
 * missing preview is noticed.
 *
 * Netlify may populate the branch name in either $BRANCH or $HEAD
 * depending on the trigger, so the script matches either. These
 * tests cover both surfaces and both exit-code arms, including the
 * "empty envs must not accidentally glob-match" case (`case` on an
 * empty string against `chore/hive-snapshot*` must not match).
 *
 * Six cases (mirroring the sibling test_netlify-ignore.sh runbook
 * pattern already on disk in scripts/):
 *   1. BRANCH=chore/hive-snapshot-abc — exit 0 (skip)
 *   2. HEAD=chore/hive-snapshot-xyz   — exit 0 (skip) via HEAD arm
 *   3. BRANCH=main                    — exit 1 (build)
 *   4. BRANCH="" HEAD=""              — exit 1 (build), no false glob match
 *   5. BRANCH=chore/hive-snap         — exit 1 (build), prefix alone is not enough
 *   6. BRANCH=chore/something-else    — exit 1 (build), unrelated chore branch
 *
 * Same subprocess-harness pattern used by scripts/verify-site-health.test.ts
 * (added in PR #6909 under kubestellar/docs#6842).
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, test, expect } from "vitest";
import { spawn } from "node:child_process";
import { join } from "node:path";

const SCRIPT_PATH = join(__dirname, "netlify-ignore.sh");

type Env = { BRANCH?: string; HEAD?: string; PULL_REQUEST?: string; REVIEW_ID?: string; COMMIT_REF?: string };

function runScript(env: Env): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    // Pass an explicit, minimal env so leaks from the ambient shell
    // ($BRANCH set by the runner, etc.) cannot accidentally satisfy
    // a case arm. PATH is preserved so bash itself is findable.
    const spawnEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      NODE_ENV: process.env.NODE_ENV,
      BRANCH: env.BRANCH ?? "",
      HEAD: env.HEAD ?? "",
      PULL_REQUEST: env.PULL_REQUEST ?? "",
      REVIEW_ID: env.REVIEW_ID ?? "",
      COMMIT_REF: env.COMMIT_REF ?? "",
    };
    const proc = spawn("bash", [SCRIPT_PATH], { stdio: ["ignore", "pipe", "pipe"], env: spawnEnv });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (b) => { stdout += b.toString(); });
    proc.stderr.on("data", (b) => { stderr += b.toString(); });
    proc.on("close", (code) => resolve({ status: code, stdout, stderr }));
  });
}

describe("netlify-ignore.sh", () => {
  test("exits 0 (skip build) when BRANCH matches chore/hive-snapshot*", async () => {
    const res = await runScript({ BRANCH: "chore/hive-snapshot-abc" });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Skipping build");
    expect(res.stdout).toContain("chore/hive-snapshot-abc");
  });

  test("exits 0 (skip build) when only HEAD (not BRANCH) matches chore/hive-snapshot*", async () => {
    const res = await runScript({ BRANCH: "main", HEAD: "chore/hive-snapshot-xyz" });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Skipping build");
    expect(res.stdout).toContain("chore/hive-snapshot-xyz");
  });

  test("exits 1 (proceed with build) on a normal branch like main", async () => {
    const res = await runScript({ BRANCH: "main" });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("Proceeding with build");
    expect(res.stdout).not.toContain("Skipping build");
  });

  test("exits 1 (proceed with build) when BRANCH and HEAD are both empty", async () => {
    // Guard against a `case "" in chore/hive-snapshot*)` accidental match.
    const res = await runScript({ BRANCH: "", HEAD: "" });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("Proceeding with build");
    expect(res.stdout).not.toContain("Skipping build");
  });

  test("exits 1 (proceed with build) for a prefix-only match like chore/hive-snap", async () => {
    // The glob is chore/hive-snapshot* — a prefix like "chore/hive-snap"
    // must NOT match. Guards against a refactor that broadens the glob to
    // chore/hive-* or chore/hive-snap*.
    const res = await runScript({ BRANCH: "chore/hive-snap" });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("Proceeding with build");
    expect(res.stdout).not.toContain("Skipping build");
  });

  test("exits 1 (proceed with build) for an unrelated chore branch", async () => {
    // Guards against a refactor that broadens the glob to chore/*.
    const res = await runScript({ BRANCH: "chore/something-else" });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("Proceeding with build");
    expect(res.stdout).not.toContain("Skipping build");
  });
});
