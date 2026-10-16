#!/usr/bin/env node
/**
 * Generates public/config/shared.json from src/config/versions/ (index.ts).
 *
 * This script is the bridge that keeps shared.json (runtime-fetched by the
 * browser via useSharedConfig) in sync with versions/ (the single source of
 * truth for version/project metadata).
 *
 * Run automatically as a prebuild step so CI always produces a consistent
 * shared.json.  Can also be run manually: node --experimental-strip-types
 * scripts/generate-shared-config.ts
 *
 * Non-version fields that live only in shared.json (surveyUrl, relatedProjects,
 * editBaseUrls) are preserved from the existing file so this script never
 * overwrites hand-maintained content.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildVersionsAndProjects,
  deriveEditBaseUrls,
  mergeSharedConfig,
  parseExistingSharedConfig,
} from './generate-shared-config-helpers';

// ---------------------------------------------------------------------------
// Resolve paths relative to repo root
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const versionsPath = path.join(repoRoot, 'src', 'config', 'versions', 'index.ts');
const sharedJsonPath = path.join(repoRoot, 'public', 'config', 'shared.json');

// ---------------------------------------------------------------------------
// Import version data from versions.ts and generate shared.json
// Wrapped in an async IIFE to avoid top-level await, which is not supported
// when tsx runs in CJS mode (e.g. Netlify's Node 20).
//
// The transformation/merge logic itself lives in
// generate-shared-config-helpers.ts (unit tested) — this IIFE is just I/O.
// ---------------------------------------------------------------------------
(async () => {
  const { PROJECTS } = await import(versionsPath) as typeof import('../src/config/versions/index.ts');

  const { versions, projects } = buildVersionsAndProjects(PROJECTS);

  // Preserve hand-maintained fields from the existing shared.json
  const existing = parseExistingSharedConfig(
    fs.existsSync(sharedJsonPath) ? fs.readFileSync(sharedJsonPath, 'utf8') : undefined,
  );

  const editBaseUrls = deriveEditBaseUrls(existing.editBaseUrls, PROJECTS.kubestellar.versions.latest?.branch);

  const sharedConfig = mergeSharedConfig(existing, versions, projects, editBaseUrls);

  fs.writeFileSync(sharedJsonPath, JSON.stringify(sharedConfig, null, 2) + '\n');
  console.log(`✅ Generated ${path.relative(repoRoot, sharedJsonPath)} from versions.ts`);
})();
