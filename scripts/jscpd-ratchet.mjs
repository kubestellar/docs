#!/usr/bin/env node
// Duplication ratchet: runs jscpd with .jscpd.json and fails only when the
// clone count grows past the committed baseline (jscpd-baseline.json).
// Existing debt never fails the gate; a PR that lowers duplication should
// lower the baseline in the same PR.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateRatchet } from './jscpd-ratchet-helpers.mjs';

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

  const result = evaluateRatchet(clones, baseline.clones);
  for (const line of result.logLines) console.log(line);
  if (!result.ok) {
    console.error(result.errorLine);
    process.exit(1);
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
