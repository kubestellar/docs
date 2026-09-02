import { describe, it, expect, beforeEach } from "vitest"
import { metricsRegistry, recordApiRequest } from "@/lib/metrics"

describe("metrics", () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics()
  })

  it("exposes request counters and duration histogram in Prometheus text format", async () => {
    recordApiRequest("search", "GET", 200, 12.5)
    recordApiRequest("docs-image", "GET", 404, 3)

    const text = await metricsRegistry.metrics()

    expect(text).toContain("docs_api_requests_total")
    expect(text).toContain('route="search"')
    expect(text).toContain('status_class="2xx"')
    expect(text).toContain('route="docs-image"')
    expect(text).toContain('status_class="4xx"')
    expect(text).toContain("docs_api_request_duration_seconds")
  })

  it("keeps label cardinality bounded to known routes and status classes", async () => {
    recordApiRequest("search", "GET", 500, 1)
    const text = await metricsRegistry.metrics()

    expect(text).toContain('status_class="5xx"')
    // Only the two known route labels should ever appear.
    const routeMatches = [...text.matchAll(/route="([^"]+)"/g)].map(m => m[1])
    for (const route of routeMatches) {
      expect(["search", "docs-image"]).toContain(route)
    }
  })
})
