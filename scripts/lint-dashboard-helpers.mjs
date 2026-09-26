/**
 * Pure helpers extracted from scripts/lint-dashboard.mjs so the classification
 * logic (metric-name extraction, PromQL expression validation, dashboard/alert
 * shape checks) can be unit-tested independently of the runner's disk I/O.
 *
 * Everything here is a pure function of its inputs. The runner reads files
 * and js-yaml-parses alerts.yaml, then hands the parsed objects to these
 * helpers. See scripts/lint-dashboard-helpers.test.mjs for the contract.
 */

/**
 * Extract declared metric names from the source of src/lib/metrics.ts.
 * Matches `name: "<lower_snake>"` entries. Returns an array (may be empty).
 */
export function extractDeclaredMetrics(metricsSource) {
  return [...metricsSource.matchAll(/name:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]);
}

/**
 * Build a RegExp that matches any of the declared metric names, allowing
 * the implicit PromQL histogram suffixes `_bucket`, `_sum`, `_count`.
 * Returns null when no metric names are declared (caller must treat that as
 * an error separately — matching the runner's `No metric names found` fail).
 */
export function buildKnownMetricPattern(declaredMetrics) {
  if (!declaredMetrics || declaredMetrics.length === 0) return null;
  return new RegExp(
    "\\b(" +
      declaredMetrics.map((name) => `${name}(_bucket|_sum|_count)?`).join("|") +
      ")\\b"
  );
}

/**
 * Return true iff `expr` mentions at least one known metric name.
 * A null pattern (no metrics declared) always returns false.
 */
export function exprReferencesKnownMetric(expr, knownPattern) {
  if (!knownPattern) return false;
  return knownPattern.test(expr);
}

/**
 * Validate a parsed dashboard.json object. Returns { errors: string[] } —
 * empty array means the dashboard is well-formed.
 *
 * Rules (mirror the runner exactly):
 *   - dashboard.panels must be a non-empty array.
 *   - Each panel.targets[].expr must be a non-empty string.
 *   - Each expr must reference at least one known metric.
 *
 * `declaredMetrics` is used only to format the "known metrics" list in the
 * error message, matching the runner's message shape.
 */
export function validateDashboard(dashboard, knownPattern, declaredMetrics = []) {
  const errors = [];
  const panels = Array.isArray(dashboard?.panels) ? dashboard.panels : [];
  if (panels.length === 0) {
    errors.push("dashboard.json has no panels");
  }
  for (const panel of panels) {
    const label = panel.title ?? panel.id;
    const targets = Array.isArray(panel.targets) ? panel.targets : [];
    for (const target of targets) {
      if (typeof target.expr !== "string" || target.expr.length === 0) {
        errors.push(`Panel "${label}" has an empty/missing target.expr`);
        continue;
      }
      if (!exprReferencesKnownMetric(target.expr, knownPattern)) {
        errors.push(
          `Panel "${label}" expr does not reference any known metric from metrics.ts (${declaredMetrics.join(", ")})`
        );
      }
    }
  }
  return { errors };
}

/**
 * Validate a parsed alerts.yaml document. Returns { errors: string[] }.
 *
 * Rules (mirror the runner exactly):
 *   - doc.spec.groups must be a non-empty array.
 *   - Each group.rules must be a non-empty array.
 *   - Each rule.expr must be a non-empty string.
 *   - Each rule.expr must reference at least one known metric.
 *   - Each rule.annotations.summary must be present (truthy).
 */
export function validateAlerts(doc, knownPattern, declaredMetrics = []) {
  const errors = [];
  const groups = doc?.spec?.groups;
  if (!Array.isArray(groups) || groups.length === 0) {
    errors.push("alerts.yaml has no spec.groups");
    return { errors };
  }
  for (const group of groups) {
    const rules = Array.isArray(group.rules) ? group.rules : [];
    if (rules.length === 0) {
      errors.push(`Group "${group.name}" has no rules`);
    }
    for (const rule of rules) {
      if (typeof rule.expr !== "string" || rule.expr.length === 0) {
        errors.push(`Alert "${rule.alert}" has an empty/missing expr`);
        continue;
      }
      if (!exprReferencesKnownMetric(rule.expr, knownPattern)) {
        errors.push(
          `Alert "${rule.alert}" expr does not reference any known metric from metrics.ts (${declaredMetrics.join(", ")})`
        );
      }
      if (!rule.annotations?.summary) {
        errors.push(`Alert "${rule.alert}" is missing an annotations.summary`);
      }
    }
  }
  return { errors };
}
