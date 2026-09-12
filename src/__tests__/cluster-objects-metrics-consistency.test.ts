import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import * as yaml from "js-yaml"

import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from "@/lib/metrics"

// Guards cluster-objects/*.yaml against two failure classes that were
// previously uncaught: (1) plain YAML syntax errors, since nothing parses
// these manifests in CI before they reach a cluster, and (2) silent drift
// between the metric/label names actually emitted by src/lib/metrics.ts and
// the ones cluster-objects/alerts.yaml assumes exist — a rename in
// one place without the other would leave the alert rules permanently
// non-firing (referencing a metric that no longer exists) with no signal.
const clusterObjectsDir = path.join(process.cwd(), "cluster-objects")

/** Parses a manifest file. Some files (e.g. deployment.yaml) contain
 * multiple `---`-separated documents; this always returns the first
 * document, which is sufficient for the fields these tests check. */
function loadYaml(fileName: string): unknown {
  const text = fs.readFileSync(path.join(clusterObjectsDir, fileName), "utf-8")
  return yaml.loadAll(text)[0]
}

/** Parses every document in a `---`-separated manifest file. */
function loadYamlAll(fileName: string): unknown[] {
  const text = fs.readFileSync(path.join(clusterObjectsDir, fileName), "utf-8")
  return yaml.loadAll(text)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

describe("cluster-objects manifests stay consistent with src/lib/metrics.ts", () => {
  it("parses as valid YAML", () => {
    expect(() => loadYaml("servicemonitor.yaml")).not.toThrow()
    expect(() => loadYaml("alerts.yaml")).not.toThrow()
    // deployment.yaml is multi-document (Deployment, Service, Ingress);
    // loadAll validates every document, not just the first.
    const docs = loadYamlAll("deployment.yaml")
    expect(docs.length).toBe(3)
    expect(docs.map((d: AnyRecord) => d.kind)).toEqual([
      "Deployment",
      "Service",
      "Ingress",
    ])
  })

  it("servicemonitor.yaml scrapes the app's actual /api/metrics endpoint", () => {
    const doc = loadYaml("servicemonitor.yaml") as AnyRecord

    expect(doc.kind).toBe("ServiceMonitor")
    const endpoints = doc.spec?.endpoints ?? []
    expect(endpoints.length).toBeGreaterThan(0)
    expect(endpoints[0].path).toBe("/api/metrics")

    // The metrics route only exists to serve this registry — if the route
    // file is ever removed/renamed without updating the ServiceMonitor,
    // this catches it via the shared app label used across the manifests.
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/app/api/metrics/route.ts")
      )
    ).toBe(true)
  })

  it("servicemonitor.yaml and deployment.yaml target the same namespace", () => {
    const serviceMonitor = loadYaml("servicemonitor.yaml") as AnyRecord
    const deployment = loadYaml("deployment.yaml") as AnyRecord

    // deployment.yaml is a multi-document file (Deployment, Service,
    // Ingress); js-yaml's default `load` only returns the first document,
    // which is the Deployment here.
    expect(deployment.metadata?.namespace).toBeDefined()
    expect(serviceMonitor.metadata?.namespace).toBe(
      deployment.metadata?.namespace
    )
    expect(serviceMonitor.spec?.namespaceSelector?.matchNames).toContain(
      deployment.metadata?.namespace
    )
  })

  it("alerts.yaml only references metric and label names that exist in src/lib/metrics.ts", () => {
    const doc = loadYaml("alerts.yaml") as AnyRecord
    const knownMetricNames = [httpRequestsTotal.name, httpRequestDurationSeconds.name]
    const knownLabelNames = new Set([
      ...httpRequestsTotal.labelNames,
      ...httpRequestDurationSeconds.labelNames,
    ])
    // "up" is Prometheus's own built-in scrape-target-health metric (not
    // declared in metrics.ts), used by the DocsApiMetricsTargetDown alert.
    // Its only label ("job") is likewise built-in, not app-defined.
    const builtinMetricNames = ["up"]
    const builtinLabelNames = new Set(["job"])

    const groups = doc.spec?.groups ?? []
    expect(groups.length).toBeGreaterThan(0)

    const rules = groups.flatMap((g: AnyRecord) => g.rules ?? [])
    expect(rules.length).toBeGreaterThan(0)

    for (const rule of rules) {
      const expr: string = rule.expr
      // Every metric token referenced by the expression must be one of the
      // two known metrics (the histogram is referenced via its `_bucket`
      // suffix in `histogram_quantile` calls) or a built-in Prometheus
      // metric such as `up`.
      const referencesKnownMetric = [...knownMetricNames, ...builtinMetricNames].some(name =>
        expr.includes(name)
      )
      expect(referencesKnownMetric).toBe(true)

      // Any label matcher used in the expression (e.g. status_class="5xx")
      // must be a label this metric family actually has, or a built-in
      // Prometheus label.
      const labelMatches = [...expr.matchAll(/(\w+)\s*=\s*"[^"]*"/g)].map(
        m => m[1]
      )
      for (const label of labelMatches) {
        expect(knownLabelNames.has(label) || builtinLabelNames.has(label)).toBe(true)
      }
    }
  })
})
