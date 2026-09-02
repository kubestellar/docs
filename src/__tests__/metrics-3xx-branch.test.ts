import { describe, it, expect, beforeEach } from "vitest"
import { metricsRegistry, recordApiRequest } from "@/lib/metrics"

/**
 * Locks in the 3xx branch of statusClass() in src/lib/metrics.ts (line 40).
 *
 * The existing metrics.test.ts + metrics-edge-branches.test.ts cover 2xx,
 * 4xx, 5xx, and the "other" fallback, but the 3xx arm was never exercised.
 * Redirect responses (301, 302, 304) are perfectly normal for a docs site
 * (Cloudflare/CDN behaviour, i18n locale rewrites), so a regression that
 * mislabelled them would degrade the Prometheus dashboard silently — the
 * point of statusClass is precisely to keep label cardinality bounded, and
 * only a fully-covered arm can guard that guarantee.
 */
describe("metrics — 3xx branch of statusClass", () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics()
  })

  it('classifies 301, 302, 304 (redirects / not-modified) as "3xx"', async () => {
    recordApiRequest("search", "GET", 301, 1)
    recordApiRequest("search", "GET", 302, 1)
    recordApiRequest("docs-image", "GET", 304, 1)

    const text = await metricsRegistry.metrics()

    expect(text).toContain('status_class="3xx"')
    // Regression guard: raw 3xx codes must not leak into label values.
    expect(text).not.toMatch(/status_class="301"/)
    expect(text).not.toMatch(/status_class="302"/)
    expect(text).not.toMatch(/status_class="304"/)
  })

  it('classifies boundary values 300 and 399 correctly (300 -> "3xx", 400 -> "4xx")', async () => {
    recordApiRequest("search", "GET", 300, 1)
    recordApiRequest("search", "GET", 399, 1)
    recordApiRequest("search", "GET", 400, 1)

    const text = await metricsRegistry.metrics()

    expect(text).toContain('status_class="3xx"')
    expect(text).toContain('status_class="4xx"')
  })
})
