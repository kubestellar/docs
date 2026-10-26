#!/usr/bin/env node
// Duplication ratchet: runs jscpd with .jscpd.json and fails only when the
// clone count grows past the committed baseline (jscpd-baseline.json).
// Existing debt never fails the gate; a PR that lowers duplication should
// lower the baseline in the same PR.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baselinePath = 'jscpd-baseline.json';
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const outDir = mkdtempSync(join(tmpdir(), 'jscpd-'));

try {
  const run = spawnSync(
    'npx',
    ['--yes', 'jscpd', '--config', '.jscpd.json', '--reporters', 'console,json', '--output', outDir],
    { stdio: 'inherit' },
  );
  if (run.error) throw run.error;

  const report = JSON.parse(readFileSync(join(outDir, 'jscpd-report.json'), 'utf8'));
  const clones = report.statistics.total.clones;

  console.log(`\njscpd ratchet: ${clones} clone(s) found, baseline ${baseline.clones}`);
  if (clones > baseline.clones) {
    console.error(`::error::Duplication increased: ${clones} clones > baseline ${baseline.clones}. Remove the new duplication (see clones above).`);
    process.exit(1);
  }
  if (clones < baseline.clones) {
    console.log(`::notice::Duplication decreased; lower "clones" in ${baselinePath} to ${clones} in this PR to ratchet.`);
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
