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
