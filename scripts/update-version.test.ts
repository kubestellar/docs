/**
 * Subprocess-style tests for scripts/update-version.js — the release-automation
 * script called by sync-console-release-versions.yml. The script is a top-level
 * Node program (no exported functions), so each test:
 *
 *   1. Builds a temp directory shaped like the docs repo — scripts/,
 *      src/config/versions.ts, public/config/shared.json — with fixture content.
 *   2. Copies scripts/update-version.js into that temp scripts/ dir so the
 *      script's `path.join(__dirname, '../src/config/versions.ts')` resolves
 *      against the fixture, not the real docs checkout.
 *   3. Spawns `node scripts/update-version.js …` inside that dir.
 *   4. Asserts on the transformed files.
 *
 * Same pattern used by scripts/check-leaderboard-regression.test.ts.
 *
 * Filed under kubestellar/docs#6842.
 */
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const SCRIPT_SRC = join(REPO_ROOT, "scripts", "update-version.js");

// Minimal versions.ts fixture: two project constants (KUBESTELLAR_VERSIONS and
// A2A_VERSIONS) plus a PROJECTS map. Only the fields update-version.js reads or
// writes need to be realistic — everything else is placeholder.
function fixtureVersionsTs(): string {
  return `import type { ProjectConfig, VersionInfo } from './types'

const KUBESTELLAR_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.30.0 (Latest)",
    branch: "docs/0.30.0",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
  },
  "0.29.0": {
    label: "v0.29.0",
    branch: "docs/0.29.0",
    isDefault: false,
  },
}

const A2A_VERSIONS: Record<string, VersionInfo> = {
  latest: {
    label: "v0.1.0 (Latest)",
    branch: "docs/a2a/0.1.0",
    isDefault: true,
  },
  main: {
    label: "main (dev)",
    branch: "main",
    isDefault: false,
  },
}

export const PROJECTS: Record<string, ProjectConfig> = {
  kubestellar: {
    id: "kubestellar",
    name: "KubeStellar",
    basePath: "",
    currentVersion: "0.30.0",
    contentPath: "docs/content",
    versions: KUBESTELLAR_VERSIONS,
  },
  "a2a": {
    id: "a2a",
    name: "A2A",
    basePath: "a2a",
    currentVersion: "0.1.0",
    contentPath: "a2a-docs/content",
    versions: A2A_VERSIONS,
  },
}
`;
}

function fixtureSharedJson(): string {
  return JSON.stringify(
    {
      versions: {
        kubestellar: {
          latest: { label: "v0.30.0 (Latest)", branch: "docs/0.30.0", isDefault: true },
          main: { label: "main (dev)", branch: "main", isDefault: false },
          "0.29.0": { label: "v0.29.0", branch: "docs/0.29.0", isDefault: false },
        },
        a2a: {
          latest: { label: "v0.1.0 (Latest)", branch: "docs/a2a/0.1.0", isDefault: true },
          main: { label: "main (dev)", branch: "main", isDefault: false },
        },
      },
      projects: {
        kubestellar: { currentVersion: "0.30.0" },
        a2a: { currentVersion: "0.1.0" },
      },
      editBaseUrls: {
        kubestellar: "https://github.com/kubestellar/docs/edit/main/docs/content",
      },
      updatedAt: "2020-01-01T00:00:00.000Z",
    },
    null,
    2
  ) + "\n";
}

function makeFixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "update-version-"));
  mkdirSync(join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, "src", "config"), { recursive: true });
  mkdirSync(join(dir, "public", "config"), { recursive: true });
  copyFileSync(SCRIPT_SRC, join(dir, "scripts", "update-version.js"));
  writeFileSync(join(dir, "src", "config", "versions.ts"), fixtureVersionsTs());
  writeFileSync(join(dir, "public", "config", "shared.json"), fixtureSharedJson());
  return dir;
}

type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  versionsTs: string;
  sharedJson: any;
};

function runScript(dir: string, args: string[]): RunResult {
  const res = spawnSync(
    process.execPath,
    [join(dir, "scripts", "update-version.js"), ...args],
    { cwd: dir, encoding: "utf8" }
  );
  const versionsTs = readFileSync(join(dir, "src", "config", "versions.ts"), "utf8");
  const sharedJson = JSON.parse(
    readFileSync(join(dir, "public", "config", "shared.json"), "utf8")
  );
  return {
    status: res.status,
    stdout: res.stdout,
    stderr: res.stderr,
    versionsTs,
    sharedJson,
  };
}

describe("update-version.js — argument validation", () => {
  let dir: string;
  beforeAll(() => { dir = makeFixtureDir(); });
  afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

  test("exits 1 and prints usage when --project/--version/--branch are all missing", () => {
    const res = runScript(dir, []);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("Usage:");
    expect(res.stderr).toContain("--project");
  });

  test("exits 1 when --version is missing", () => {
    const res = runScript(dir, ["--project", "kubestellar", "--branch", "docs/0.31.0"]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("Usage:");
  });

  test("exits 1 when --project is unknown", () => {
    const res = runScript(dir, [
      "--project", "notarealproject",
      "--version", "0.31.0",
      "--branch", "docs/0.31.0",
    ]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("Unknown project: notarealproject");
    expect(res.stderr).toContain("kubestellar");
  });
});

describe("update-version.js — non-latest release (versions.ts)", () => {
  test("inserts a new version entry after the main entry in KUBESTELLAR_VERSIONS", () => {
    const dir = makeFixtureDir();
    try {
      const res = runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.31.0",
        "--branch", "docs/0.31.0",
      ]);
      expect(res.status).toBe(0);
      // New entry exists, right after main.
      expect(res.versionsTs).toContain(`"0.31.0": {`);
      expect(res.versionsTs).toContain(`label: "v0.31.0"`);
      expect(res.versionsTs).toContain(`branch: "docs/0.31.0"`);
      // main entry still present and precedes the new one.
      const mainIdx = res.versionsTs.indexOf(`main: {`);
      const newIdx = res.versionsTs.indexOf(`"0.31.0": {`);
      expect(mainIdx).toBeGreaterThan(-1);
      expect(newIdx).toBeGreaterThan(mainIdx);
      // Latest label untouched (no --set-latest).
      expect(res.versionsTs).toContain(`label: "v0.30.0 (Latest)"`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("is idempotent — a second run with the same version reports 'already exists' and does not double-insert", () => {
    const dir = makeFixtureDir();
    try {
      runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.31.0",
        "--branch", "docs/0.31.0",
      ]);
      const res = runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.31.0",
        "--branch", "docs/0.31.0",
      ]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("already exists");
      // Only one occurrence of the new key.
      const matches = res.versionsTs.match(/"0\.31\.0":\s*\{/g) || [];
      expect(matches.length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("update-version.js — --set-latest promotes and preserves previous latest", () => {
  test("updates latest label + branch, sets PROJECTS.currentVersion, and preserves v0.30.0 as historical entry", () => {
    const dir = makeFixtureDir();
    try {
      const res = runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.31.0",
        "--branch", "docs/0.31.0",
        "--set-latest",
      ]);
      expect(res.status).toBe(0);
      // Latest bumped.
      expect(res.versionsTs).toContain(`label: "v0.31.0 (Latest)"`);
      expect(res.versionsTs).toContain(`branch: "docs/0.31.0"`);
      // PROJECTS.currentVersion updated for kubestellar.
      expect(res.versionsTs).toMatch(/kubestellar:\s*\{[^}]*currentVersion:\s*"0\.31\.0"/s);
      // Previous latest preserved as a historical entry (label without "(Latest)").
      expect(res.versionsTs).toContain(`"0.30.0": {`);
      expect(res.versionsTs).toContain(`label: "v0.30.0"`);
      expect(res.versionsTs).toContain(`branch: "docs/0.30.0"`);
      // The old "(Latest)" label must no longer be present anywhere for v0.30.0.
      expect(res.versionsTs).not.toContain(`"v0.30.0 (Latest)"`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("does not preserve previous latest when it was still pointing at main", () => {
    const dir = makeFixtureDir();
    try {
      // First promote v0.31.0. Now v0.30.0 is a historical entry. Then repoint
      // "latest" at main by editing the fixture — simulating the pre-first-release
      // state — and confirm we do NOT synthesize a historical entry for main.
      runScript(dir, [
        "--project", "a2a",
        "--version", "0.2.0",
        "--branch", "docs/a2a/0.2.0",
        "--set-latest",
      ]);
      // Sanity: previous a2a latest (v0.1.0) got preserved.
      const first = readFileSync(join(dir, "src", "config", "versions.ts"), "utf8");
      expect(first).toContain(`"0.1.0": {`);

      // Now overwrite the a2a latest branch back to "main" so the "was pointing
      // to main" branch of the script fires on the next call.
      const overwrite = first.replace(
        /latest:\s*\{[^}]*label:\s*"v0\.2\.0 \(Latest\)"[^}]*branch:\s*"docs\/a2a\/0\.2\.0"/s,
        `latest: {\n    label: "v0.2.0 (Latest)",\n    isDefault: true,\n    branch: "main"`
      );
      writeFileSync(join(dir, "src", "config", "versions.ts"), overwrite);

      const res = runScript(dir, [
        "--project", "a2a",
        "--version", "0.3.0",
        "--branch", "docs/a2a/0.3.0",
        "--set-latest",
      ]);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain("No previous latest to preserve (was pointing to main)");
      // No historical entry synthesized for "main".
      expect(res.versionsTs).not.toContain(`"main":`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("update-version.js — shared.json is kept in sync", () => {
  test("non-latest release adds a versions entry without changing latest or currentVersion", () => {
    const dir = makeFixtureDir();
    try {
      const res = runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.31.0",
        "--branch", "docs/0.31.0",
      ]);
      expect(res.status).toBe(0);
      expect(res.sharedJson.versions.kubestellar["0.31.0"]).toEqual({
        label: "v0.31.0",
        branch: "docs/0.31.0",
        isDefault: false,
      });
      expect(res.sharedJson.versions.kubestellar.latest.label).toBe("v0.30.0 (Latest)");
      expect(res.sharedJson.projects.kubestellar.currentVersion).toBe("0.30.0");
      expect(typeof res.sharedJson.updatedAt).toBe("string");
      expect(res.sharedJson.updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("--set-latest bumps latest, currentVersion, and editBaseUrls (for kubestellar only)", () => {
    const dir = makeFixtureDir();
    try {
      const res = runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.31.0",
        "--branch", "docs/0.31.0",
        "--set-latest",
      ]);
      expect(res.status).toBe(0);
      expect(res.sharedJson.versions.kubestellar.latest).toMatchObject({
        label: "v0.31.0 (Latest)",
        branch: "docs/0.31.0",
      });
      expect(res.sharedJson.projects.kubestellar.currentVersion).toBe("0.31.0");
      // Historical entry for the previous latest.
      expect(res.sharedJson.versions.kubestellar["0.30.0"]).toEqual({
        label: "v0.30.0",
        branch: "docs/0.30.0",
        isDefault: false,
      });
      // editBaseUrls.kubestellar was rewritten to point at the new frozen branch.
      expect(res.sharedJson.editBaseUrls.kubestellar).toBe(
        "https://github.com/kubestellar/docs/edit/docs/0.31.0/docs/content"
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("--set-latest for a non-kubestellar project does NOT rewrite editBaseUrls.kubestellar", () => {
    const dir = makeFixtureDir();
    try {
      const before = JSON.parse(
        readFileSync(join(dir, "public", "config", "shared.json"), "utf8")
      ).editBaseUrls.kubestellar;
      const res = runScript(dir, [
        "--project", "a2a",
        "--version", "0.2.0",
        "--branch", "docs/a2a/0.2.0",
        "--set-latest",
      ]);
      expect(res.status).toBe(0);
      expect(res.sharedJson.editBaseUrls.kubestellar).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("update-version.js — regex-metacharacter safety", () => {
  test("a version containing regex metacharacters ('0.30.0.*') is escaped, not injected", () => {
    const dir = makeFixtureDir();
    try {
      // The dangerous input. If escapeRegex is broken, `versionEntryRegex`
      // would match "0.30.0" (which exists as latest label 'v0.30.0 (Latest)'
      // — but not as a "\"0.30.0\":" key, so we specifically test that the
      // metacharacter version STILL gets added because it wasn't confused
      // with an existing key.
      const res = runScript(dir, [
        "--project", "kubestellar",
        "--version", "0.30.0.*",
        "--branch", "docs/malicious",
      ]);
      expect(res.status).toBe(0);
      // The literal key, safely quoted, appears.
      expect(res.versionsTs).toContain(`"0.30.0.*": {`);
      // No wholesale corruption of the existing 0.29.0 entry.
      expect(res.versionsTs).toContain(`"0.29.0": {`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
