/**
 * Bounded, in-process request metrics for API routes, exposed via
 * `/api/metrics` in Prometheus text format.
 *
 * Scope note: this module only registers a local Prometheus registry and
 * exports it for local scraping (pull-based, on-box). It does not push
 * data anywhere or configure any exporter/backend — no observability
 * backend is confirmed for this repo, so nothing leaves the process.
 *
 * Cardinality safety: `route` is restricted to the fixed `ApiRoute` union
 * below (one label value per known route handler) and `status_class` is
 * one of "2xx"/"3xx"/"4xx"/"5xx". Neither label is ever populated from
 * user input (query strings, path segments, headers), so the label
 * cardinality is bounded by the number of routes we instrument.
 */
import { Counter, Histogram, Registry } from "prom-client"

export const ApiRoutes = ["search", "docs-image"] as const
export type ApiRoute = (typeof ApiRoutes)[number]

export const metricsRegistry = new Registry()

export const httpRequestsTotal = new Counter({
  name: "docs_api_requests_total",
  help: "Total number of docs site API requests handled, by route and status class.",
  labelNames: ["route", "method", "status_class"] as const,
  registers: [metricsRegistry],
})

export const httpRequestDurationSeconds = new Histogram({
  name: "docs_api_request_duration_seconds",
  help: "Docs site API request duration in seconds, by route.",
  labelNames: ["route", "method"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
})

export const HealthChecks = ["healthz", "livez"] as const
export type HealthCheck = (typeof HealthChecks)[number]

export const HealthCheckResults = ["ok", "unhealthy"] as const
export type HealthCheckResult = (typeof HealthCheckResults)[number]

/**
 * Outcome counter for the Kubernetes readiness (/api/healthz) and liveness
 * (/api/livez) probes. `check` and `result` are both fixed, small unions
 * (2 checks x 2 results = 4 series max), so cardinality stays bounded the
 * same way `route`/`status_class` do above. This closes the gap where
 * probe failures were only visible via structured logs, not via the
 * Prometheus registry already scraped from /api/metrics.
 */
export const healthCheckTotal = new Counter({
  name: "docs_health_check_total",
  help: "Total number of readiness/liveness probe checks, by check and result.",
  labelNames: ["check", "result"] as const,
  registers: [metricsRegistry],
})

/** Records one completed readiness/liveness probe invocation. */
export function recordHealthCheck(check: HealthCheck, result: HealthCheckResult) {
  healthCheckTotal.inc({ check, result })
}

function statusClass(status: number): "2xx" | "3xx" | "4xx" | "5xx" | "other" {
  if (status >= 200 && status < 300) return "2xx"
  if (status >= 300 && status < 400) return "3xx"
  if (status >= 400 && status < 500) return "4xx"
  if (status >= 500 && status < 600) return "5xx"
  return "other"
}

/** Records one completed request. `durationMs` comes from a monotonic timer at the call site. */
export function recordApiRequest(
  route: ApiRoute,
  method: string,
  status: number,
  durationMs: number
) {
  const labels = { route, method, status_class: statusClass(status) }
  httpRequestsTotal.inc(labels)
  httpRequestDurationSeconds.observe(
    { route, method },
    Math.max(0, durationMs) / 1000
  )
}
