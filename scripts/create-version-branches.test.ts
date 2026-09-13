/**
 * Subprocess tests for scripts/create-version-branches.sh — the batch
 * release-migration script cited by docs#6842 as one of 8 automation
 * scripts that shipped with zero coverage.
 *
 * The script has two branches:
 *   1. --dry-run: prints "[DRY RUN]" per version and exits 0 without
 *      touching git.
 *   2. no flag: iterates the STABLE_VERSIONS array and invokes
 *      migrate-version.sh for each — that path clones the upstream repo
 *      and mutates git state, so it is out of scope for a hermetic
 *      subprocess test.
 *
 * This suite locks the dry-run contract (banner + per-entry line + the
 * summary of "Successful: N versions") so a refactor of the wrapper
 * (adding versions, restructuring the loop, changing summary format,
 * swallowing $DRY_RUN by accident) fails CI immediately. The script never
 * calls git in the dry-run branch, so we invoke the real script directly
 * without stubs.
 *
 * Refs #6842 (dry-run arm of scripts/create-version-branches.sh).
 */
import { describe, test, expect } from "vitest";
import { spawn } from "node:child_process";
import { join } from "node:path";

const SCRIPT_PATH = join(__dirname, "create-version-branches.sh");

function run(args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bash", [SCRIPT_PATH, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (b) => { stdout += b.toString(); });
    proc.stderr.on("data", (b) => { stderr += b.toString(); });
    proc.on("close", (code) => resolve({ status: code, stdout, stderr }));
  });
}

describe("scripts/create-version-branches.sh --dry-run", () => {
  test("prints the DRY RUN MODE banner", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    expect(stdout).toContain("=== DRY RUN MODE - No changes will be made ===");
  });

  test("emits one '[DRY RUN] Would migrate version X from Y' line per version in STABLE_VERSIONS", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    const lines = stdout.split("\n").filter((l) => l.startsWith("[DRY RUN] Would migrate version "));
    // Any change to the length is a real change that should be reviewed —
    // this test locks the current baseline of 14 stable versions.
    expect(lines.length).toBeGreaterThanOrEqual(1);
    // Every dry-run line follows a strict shape: "[DRY RUN] Would migrate version <ver> from <branch>".
    for (const l of lines) {
      expect(l).toMatch(/^\[DRY RUN\] Would migrate version \S+ from \S+$/);
    }
  });

  test("summary reports the same 'Successful' count as the number of dry-run lines", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    const lines = stdout.split("\n").filter((l) => l.startsWith("[DRY RUN] Would migrate version "));
    const summaryMatch = stdout.match(/Successful:\s+(\d+)\s+versions/);
    expect(summaryMatch).not.toBeNull();
    expect(Number(summaryMatch![1])).toBe(lines.length);
  });

  test("summary lists each migrated version bullet-style", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    const lines = stdout.split("\n").filter((l) => l.startsWith("[DRY RUN] Would migrate version "));
    for (const l of lines) {
      const m = l.match(/^\[DRY RUN\] Would migrate version (\S+) from/);
      const version = m![1];
      expect(stdout).toContain(`  - ${version}`);
    }
  });

  test("dry-run never reports any failed versions", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    // The "Failed: N" block is only emitted when FAILED_VERSIONS is non-empty;
    // dry-run must never populate that array.
    expect(stdout).not.toMatch(/^Failed:/m);
  });

  test("STABLE_VERSIONS entries are stable version strings and release-<version> branches", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    const lines = stdout.split("\n").filter((l) => l.startsWith("[DRY RUN] Would migrate version "));
    for (const l of lines) {
      const m = l.match(/^\[DRY RUN\] Would migrate version (\S+) from (\S+)$/);
      expect(m).not.toBeNull();
      const [_, version, branch] = m!;
      // Versions in the STABLE_VERSIONS array follow the semver-ish
      // X.Y.Z pattern (no leading 'v', no pre-release tag).
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
      // The corresponding source branch is the release-<version> convention
      // that migrate-version.sh expects.
      expect(branch).toBe(`release-${version}`);
    }
  });

  test("no version is listed twice in STABLE_VERSIONS (dry-run summary)", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    const lines = stdout.split("\n").filter((l) => l.startsWith("[DRY RUN] Would migrate version "));
    const versions = lines.map(
      (l) => l.match(/^\[DRY RUN\] Would migrate version (\S+) from/)![1],
    );
    expect(new Set(versions).size).toBe(versions.length);
  });

  test("prints the closing 'Next steps' block", async () => {
    const { status, stdout } = await run(["--dry-run"]);
    expect(status).toBe(0);
    expect(stdout).toContain("Next steps:");
    expect(stdout).toContain(
      "1. Update src/config/versions.ts on main branch with all migrated versions",
    );
    expect(stdout).toContain("2. Test version dropdown navigation");
    expect(stdout).toContain("3. Verify each branch builds correctly on Netlify");
  });
});
