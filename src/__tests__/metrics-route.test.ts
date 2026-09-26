import { describe, it, expect, beforeEach } from "vitest"
import { GET } from "@/app/api/metrics/route"
import { metricsRegistry, recordApiRequest } from "@/lib/metrics"

describe("/api/metrics route", () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics()
  })

  it("serves the Prometheus registry snapshot with the correct content type", async () => {
    recordApiRequest("search", "GET", 200, 5)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/plain")
    const body = await response.text()
    expect(body).toContain("docs_api_requests_total")
  })
})
