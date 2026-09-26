#!/usr/bin/env node
/**
 * Dashboard/alert-rule lint: validates that the static observability
 * artifacts in cluster-objects/ (dashboard.json, alerts.yaml) are
 * well-formed and only reference metric names that actually exist in
 * src/lib/metrics.ts. This catches drift (renamed/removed metrics,
 * malformed JSON/YAML) at PR time, before anyone tries to import the
 * dashboard or apply the PrometheusRule.
 *
 * No network calls, no external services — pure static-file checks.
 *
 * The classification logic lives in scripts/lint-dashboard-helpers.mjs so
 * it can be unit-tested independently of disk I/O. This runner just wires
 * files to the helpers and prints results.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { load as loadYaml } from "js-yaml"
import {
  extractDeclaredMetrics,
  buildKnownMetricPattern,
  validateDashboard,
  validateAlerts,
} from "./lint-dashboard-helpers.mjs"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const dashboardPath = path.join(repoRoot, "cluster-objects/dashboard.json")
const alertsPath = path.join(repoRoot, "cluster-objects/alerts.yaml")
const metricsSourcePath = path.join(repoRoot, "src/lib/metrics.ts")

let failed = false

function fail(message) {
  console.error(`✖ ${message}`)
  failed = true
}

function ok(message) {
  console.log(`✓ ${message}`)
}

// Known metric names, derived from the `name:` fields declared in
// src/lib/metrics.ts. Histogram metrics also expose an implicit
// `_bucket`/`_sum`/`_count` suffix family in PromQL.
const metricsSource = fs.readFileSync(metricsSourcePath, "utf8")
const declaredMetrics = extractDeclaredMetrics(metricsSource)
if (declaredMetrics.length === 0) {
  fail(`No metric names found in ${path.relative(repoRoot, metricsSourcePath)}`)
}

const knownMetricPattern = buildKnownMetricPattern(declaredMetrics)

// --- dashboard.json ---
try {
  const raw = fs.readFileSync(dashboardPath, "utf8")
  const dashboard = JSON.parse(raw)
  ok(`${path.relative(repoRoot, dashboardPath)} is valid JSON`)

  const { errors } = validateDashboard(dashboard, knownMetricPattern, declaredMetrics)
  for (const err of errors) fail(err)
} catch (err) {
  fail(`Failed to parse ${path.relative(repoRoot, dashboardPath)}: ${err.message}`)
}

// --- alerts.yaml ---
try {
  const raw = fs.readFileSync(alertsPath, "utf8")
  const doc = loadYaml(raw)
  ok(`${path.relative(repoRoot, alertsPath)} is valid YAML`)

  const { errors } = validateAlerts(doc, knownMetricPattern, declaredMetrics)
  for (const err of errors) fail(err)
} catch (err) {
  fail(`Failed to parse ${path.relative(repoRoot, alertsPath)}: ${err.message}`)
}

if (failed) {
  console.error("\nDashboard/alert lint failed.")
  process.exit(1)
}
console.log("\nDashboard/alert lint passed.")
