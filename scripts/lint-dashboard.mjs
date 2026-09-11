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
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { load as loadYaml } from "js-yaml"

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
const declaredMetrics = [...metricsSource.matchAll(/name:\s*"([a-z0-9_]+)"/g)].map(
  (m) => m[1]
)
if (declaredMetrics.length === 0) {
  fail(`No metric names found in ${path.relative(repoRoot, metricsSourcePath)}`)
}

const knownMetricPattern = new RegExp(
  "\\b(" +
    declaredMetrics
      .map((name) => `${name}(_bucket|_sum|_count)?`)
      .join("|") +
    ")\\b"
)

function checkExprReferencesKnownMetrics(expr, label) {
  // A PromQL expression is expected to mention at least one known metric
  // name; this is a lightweight guard against typos/renames, not a full
  // PromQL parser.
  if (!knownMetricPattern.test(expr)) {
    fail(
      `${label} does not reference any known metric from metrics.ts (${declaredMetrics.join(", ")})`
    )
  }
}

// --- dashboard.json ---
try {
  const raw = fs.readFileSync(dashboardPath, "utf8")
  const dashboard = JSON.parse(raw)
  ok(`${path.relative(repoRoot, dashboardPath)} is valid JSON`)

  const panels = Array.isArray(dashboard.panels) ? dashboard.panels : []
  if (panels.length === 0) {
    fail("dashboard.json has no panels")
  }
  for (const panel of panels) {
    const targets = Array.isArray(panel.targets) ? panel.targets : []
    for (const target of targets) {
      if (typeof target.expr !== "string" || target.expr.length === 0) {
        fail(`Panel "${panel.title ?? panel.id}" has an empty/missing target.expr`)
        continue
      }
      checkExprReferencesKnownMetrics(
        target.expr,
        `Panel "${panel.title ?? panel.id}" expr`
      )
    }
  }
} catch (err) {
  fail(`Failed to parse ${path.relative(repoRoot, dashboardPath)}: ${err.message}`)
}

// --- alerts.yaml ---
try {
  const raw = fs.readFileSync(alertsPath, "utf8")
  const doc = loadYaml(raw)
  ok(`${path.relative(repoRoot, alertsPath)} is valid YAML`)

  const groups = doc?.spec?.groups
  if (!Array.isArray(groups) || groups.length === 0) {
    fail("alerts.yaml has no spec.groups")
  } else {
    for (const group of groups) {
      const rules = Array.isArray(group.rules) ? group.rules : []
      if (rules.length === 0) {
        fail(`Group "${group.name}" has no rules`)
      }
      for (const rule of rules) {
        if (typeof rule.expr !== "string" || rule.expr.length === 0) {
          fail(`Alert "${rule.alert}" has an empty/missing expr`)
          continue
        }
        checkExprReferencesKnownMetrics(rule.expr, `Alert "${rule.alert}" expr`)
        if (!rule.annotations?.summary) {
          fail(`Alert "${rule.alert}" is missing an annotations.summary`)
        }
      }
    }
  }
} catch (err) {
  fail(`Failed to parse ${path.relative(repoRoot, alertsPath)}: ${err.message}`)
}

if (failed) {
  console.error("\nDashboard/alert lint failed.")
  process.exit(1)
}
console.log("\nDashboard/alert lint passed.")
