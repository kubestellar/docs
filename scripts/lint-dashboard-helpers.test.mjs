/**
 * Unit tests for scripts/lint-dashboard-helpers.mjs — the pure classification
 * layer extracted from scripts/lint-dashboard.mjs. These tests exercise the
 * metric extraction, PromQL guard-regex, and dashboard/alert shape checks
 * without touching disk.
 */
import { describe, it, expect } from "vitest";
import {
  extractDeclaredMetrics,
  buildKnownMetricPattern,
  exprReferencesKnownMetric,
  validateDashboard,
  validateAlerts,
} from "./lint-dashboard-helpers.mjs";

describe("extractDeclaredMetrics", () => {
  it("pulls all name: \"...\" occurrences in declaration order", () => {
    const src = `
      export const requests = { name: "docs_requests_total", help: "..." };
      export const latency = { name: "docs_request_duration_seconds" };
      export const errors = { name: "docs_errors_total" };
    `;
    expect(extractDeclaredMetrics(src)).toEqual([
      "docs_requests_total",
      "docs_request_duration_seconds",
      "docs_errors_total",
    ]);
  });

  it("returns [] when the source has no name: entries", () => {
    expect(extractDeclaredMetrics("// no metrics here")).toEqual([]);
  });

  it("ignores name: entries with uppercase or dashes (schema is lower_snake)", () => {
    const src = `name: "Docs_Requests" name: "docs-request" name: "docs_ok"`;
    expect(extractDeclaredMetrics(src)).toEqual(["docs_ok"]);
  });

  it("tolerates variable whitespace between name: and the quoted value", () => {
    const src = `name:"a_metric" name:  "b_metric" name:\t"c_metric"`;
    expect(extractDeclaredMetrics(src)).toEqual(["a_metric", "b_metric", "c_metric"]);
  });
});

describe("buildKnownMetricPattern", () => {
  it("returns null for an empty metric list (runner treats that as fatal separately)", () => {
    expect(buildKnownMetricPattern([])).toBeNull();
    expect(buildKnownMetricPattern(null)).toBeNull();
    expect(buildKnownMetricPattern(undefined)).toBeNull();
  });

  it("matches a bare metric name with word boundaries", () => {
    const p = buildKnownMetricPattern(["docs_requests_total"]);
    expect(p.test("sum(docs_requests_total)")).toBe(true);
    expect(p.test("mydocs_requests_total")).toBe(false);
  });

  it("matches histogram suffixes _bucket / _sum / _count", () => {
    const p = buildKnownMetricPattern(["docs_request_duration_seconds"]);
    expect(p.test("docs_request_duration_seconds_bucket")).toBe(true);
    expect(p.test("docs_request_duration_seconds_sum")).toBe(true);
    expect(p.test("docs_request_duration_seconds_count")).toBe(true);
  });

  it("does not match a different suffix", () => {
    const p = buildKnownMetricPattern(["docs_requests_total"]);
    expect(p.test("docs_requests_total_avg")).toBe(false);
  });

  it("matches any of several declared metrics", () => {
    const p = buildKnownMetricPattern(["a_total", "b_seconds"]);
    expect(p.test("rate(a_total[5m])")).toBe(true);
    expect(p.test("histogram_quantile(0.9, b_seconds_bucket)")).toBe(true);
    expect(p.test("unknown_metric")).toBe(false);
  });
});

describe("exprReferencesKnownMetric", () => {
  const pattern = buildKnownMetricPattern(["docs_ok"]);
  it("returns true when expr mentions a known metric", () => {
    expect(exprReferencesKnownMetric("sum(docs_ok)", pattern)).toBe(true);
  });
  it("returns false when it does not", () => {
    expect(exprReferencesKnownMetric("sum(other)", pattern)).toBe(false);
  });
  it("returns false when the pattern is null", () => {
    expect(exprReferencesKnownMetric("anything", null)).toBe(false);
  });
});

describe("validateDashboard", () => {
  const pattern = buildKnownMetricPattern(["docs_ok"]);

  it("passes a valid dashboard with one panel + one target", () => {
    const dash = {
      panels: [{ title: "Requests", targets: [{ expr: "sum(docs_ok)" }] }],
    };
    expect(validateDashboard(dash, pattern, ["docs_ok"]).errors).toEqual([]);
  });

  it("errors when panels is missing or empty", () => {
    expect(validateDashboard({}, pattern).errors).toEqual([
      "dashboard.json has no panels",
    ]);
    expect(validateDashboard({ panels: [] }, pattern).errors).toEqual([
      "dashboard.json has no panels",
    ]);
  });

  it("errors on empty/missing target.expr and cites panel.title", () => {
    const dash = {
      panels: [{ title: "P1", targets: [{ expr: "" }, {}] }],
    };
    const { errors } = validateDashboard(dash, pattern, ["docs_ok"]);
    expect(errors).toEqual([
      'Panel "P1" has an empty/missing target.expr',
      'Panel "P1" has an empty/missing target.expr',
    ]);
  });

  it("falls back to panel.id when title is missing", () => {
    const dash = { panels: [{ id: 42, targets: [{ expr: "" }] }] };
    const { errors } = validateDashboard(dash, pattern);
    expect(errors[0]).toBe('Panel "42" has an empty/missing target.expr');
  });

  it("errors when expr does not reference a known metric and lists declared metrics", () => {
    const dash = {
      panels: [{ title: "Bad", targets: [{ expr: "sum(unknown)" }] }],
    };
    const { errors } = validateDashboard(dash, pattern, ["docs_ok", "docs_err"]);
    expect(errors).toEqual([
      'Panel "Bad" expr does not reference any known metric from metrics.ts (docs_ok, docs_err)',
    ]);
  });

  it("treats a panel with no targets array as empty (no errors)", () => {
    const dash = { panels: [{ title: "Text" }] };
    expect(validateDashboard(dash, pattern).errors).toEqual([]);
  });
});

describe("validateAlerts", () => {
  const pattern = buildKnownMetricPattern(["docs_ok"]);

  const wellFormed = {
    spec: {
      groups: [
        {
          name: "g1",
          rules: [
            {
              alert: "A1",
              expr: "sum(docs_ok) > 0",
              annotations: { summary: "s" },
            },
          ],
        },
      ],
    },
  };

  it("passes a well-formed alerts document", () => {
    expect(validateAlerts(wellFormed, pattern, ["docs_ok"]).errors).toEqual([]);
  });

  it("errors when spec.groups is missing/empty/not-array", () => {
    expect(validateAlerts({}, pattern).errors).toEqual(["alerts.yaml has no spec.groups"]);
    expect(validateAlerts({ spec: { groups: [] } }, pattern).errors).toEqual([
      "alerts.yaml has no spec.groups",
    ]);
    expect(validateAlerts({ spec: { groups: "nope" } }, pattern).errors).toEqual([
      "alerts.yaml has no spec.groups",
    ]);
  });

  it("errors on empty rules and cites the group name", () => {
    const doc = { spec: { groups: [{ name: "empty-group", rules: [] }] } };
    expect(validateAlerts(doc, pattern).errors).toEqual([
      'Group "empty-group" has no rules',
    ]);
  });

  it("errors when rule.expr is missing/empty and cites the alert name", () => {
    const doc = {
      spec: {
        groups: [
          {
            name: "g",
            rules: [
              { alert: "NoExpr", annotations: { summary: "s" } },
              { alert: "EmptyExpr", expr: "", annotations: { summary: "s" } },
            ],
          },
        ],
      },
    };
    const { errors } = validateAlerts(doc, pattern, ["docs_ok"]);
    expect(errors).toEqual([
      'Alert "NoExpr" has an empty/missing expr',
      'Alert "EmptyExpr" has an empty/missing expr',
    ]);
  });

  it("errors when rule.expr does not reference a known metric", () => {
    const doc = {
      spec: {
        groups: [
          {
            name: "g",
            rules: [
              {
                alert: "Bad",
                expr: "sum(unknown_metric) > 0",
                annotations: { summary: "s" },
              },
            ],
          },
        ],
      },
    };
    const { errors } = validateAlerts(doc, pattern, ["docs_ok"]);
    expect(errors).toEqual([
      'Alert "Bad" expr does not reference any known metric from metrics.ts (docs_ok)',
    ]);
  });

  it("errors when annotations.summary is missing (or annotations absent)", () => {
    const doc = {
      spec: {
        groups: [
          {
            name: "g",
            rules: [
              { alert: "NoAnnot", expr: "sum(docs_ok)" },
              { alert: "NoSummary", expr: "sum(docs_ok)", annotations: {} },
            ],
          },
        ],
      },
    };
    const { errors } = validateAlerts(doc, pattern, ["docs_ok"]);
    expect(errors).toEqual([
      'Alert "NoAnnot" is missing an annotations.summary',
      'Alert "NoSummary" is missing an annotations.summary',
    ]);
  });

  it("aggregates multiple errors across groups and rules", () => {
    const doc = {
      spec: {
        groups: [
          { name: "g1", rules: [] },
          {
            name: "g2",
            rules: [
              { alert: "A", expr: "sum(unknown)", annotations: { summary: "s" } },
              { alert: "B", expr: "sum(docs_ok)" },
            ],
          },
        ],
      },
    };
    const { errors } = validateAlerts(doc, pattern, ["docs_ok"]);
    expect(errors).toEqual([
      'Group "g1" has no rules',
      'Alert "A" expr does not reference any known metric from metrics.ts (docs_ok)',
      'Alert "B" is missing an annotations.summary',
    ]);
  });

  it("skips known-metric and summary checks for rules with empty expr (short-circuits like the runner)", () => {
    const doc = {
      spec: {
        groups: [
          {
            name: "g",
            rules: [{ alert: "X", expr: "" }],
          },
        ],
      },
    };
    const { errors } = validateAlerts(doc, pattern, ["docs_ok"]);
    expect(errors).toEqual(['Alert "X" has an empty/missing expr']);
  });
});
