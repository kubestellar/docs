#!/usr/bin/env node
/**
 * Generates public/config/shared.json from src/config/versions.ts.
 *
 * This script is the bridge that keeps shared.json (runtime-fetched by the
 * browser via useSharedConfig) in sync with versions.ts (the single source of
 * truth for version/project metadata).
 *
 * Run automatically as a prebuild step so CI always produces a consistent
 * shared.json.  Can also be run manually with tsx:
 *   npx tsx scripts/generate-shared-config.ts
 *
 * Non-version fields that live only in shared.json (surveyUrl, relatedProjects,
 * editBaseUrls) are preserved from the existing file so this script never
 * overwrites hand-maintained content.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS } from '../src/config/versions';

// ---------------------------------------------------------------------------
// Resolve paths relative to repo root
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sharedJsonPath = path.join(repoRoot, 'public', 'config', 'shared.json');

// ---------------------------------------------------------------------------
// Import version data from versions.ts via tsx so the script works in the
// Node 20 runtime configured for Netlify.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Build versions and projects maps from PROJECTS
// ---------------------------------------------------------------------------
type VersionEntry = {
  label: string;
  branch: string;
  isDefault: boolean;
  externalUrl?: string;
  isDev?: boolean;
};

const versions: Record<string, Record<string, VersionEntry>> = {};
const projects: Record<string, { name: string; basePath: string; currentVersion: string }> = {};

for (const [id, project] of Object.entries(PROJECTS)) {
  // versions map: strip internal-only fields if any
  versions[id] = Object.fromEntries(
    Object.entries(project.versions).map(([key, v]) => {
      const entry: VersionEntry = {
        label: v.label,
        branch: v.branch,
        isDefault: v.isDefault,
      };
      if (v.externalUrl) entry.externalUrl = v.externalUrl;
      if (v.isDev) entry.isDev = v.isDev;
      return [key, entry];
    }),
  );

  // projects map: only the fields the browser needs
  projects[id] = {
    name: project.name,
    basePath: project.basePath,
    currentVersion: project.currentVersion,
  };
}

// ---------------------------------------------------------------------------
// Preserve hand-maintained fields from the existing shared.json
// ---------------------------------------------------------------------------
interface ExistingSharedConfig {
  surveyUrl?: string;
  relatedProjects?: unknown[];
  editBaseUrls?: Record<string, string>;
  [key: string]: unknown;
}

let existing: ExistingSharedConfig = {};
if (fs.existsSync(sharedJsonPath)) {
  existing = JSON.parse(fs.readFileSync(sharedJsonPath, 'utf8')) as ExistingSharedConfig;
}

// Derive editBaseUrls from project data; fall back to existing values so
// hand-maintained URLs (e.g. external repos) are not lost.
const editBaseUrls: Record<string, string> = { ...(existing.editBaseUrls ?? {}) };
// Always regenerate the kubestellar editBaseUrl from the current branch
const ksLatest = PROJECTS.kubestellar.versions.latest;
if (ksLatest?.branch) {
  editBaseUrls.kubestellar = `https://github.com/kubestellar/docs/edit/${ksLatest.branch}/docs/content`;
}

// ---------------------------------------------------------------------------
// Assemble and write the new shared.json
// ---------------------------------------------------------------------------
const sharedConfig = {
  surveyUrl: existing.surveyUrl,
  versions,
  projects,
  relatedProjects: existing.relatedProjects ?? [],
  editBaseUrls,
  updatedAt: new Date().toISOString(),
};

fs.writeFileSync(sharedJsonPath, JSON.stringify(sharedConfig, null, 2) + '\n');
console.log(`✅ Generated ${path.relative(repoRoot, sharedJsonPath)} from versions.ts`);
