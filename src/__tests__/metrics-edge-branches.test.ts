import { describe, it, expect, beforeEach } from "vitest"
import { metricsRegistry, recordApiRequest } from "@/lib/metrics"

/**
 * Extends the existing metrics.test.ts by covering the two edge branches
 * that today's suite doesn't touch:
 *
 *   - src/lib/metrics.ts:43  `return "other"` — the fallback in
 *     statusClass() when a status code is < 200 or >= 600. Without this
 *     coverage, a regression that let cardinality explode (e.g. by
 *     returning `String(status)` instead of "other" for out-of-range
 *     codes) would slip past CI. The whole point of statusClass is to
 *     keep label cardinality bounded — that guarantee is worth locking.
 *
 *   - `Math.max(0, durationMs)` negative-input clamp inside
 *     recordApiRequest. Prom-client would throw on a negative histogram
 *     observation, so this clamp is the sole safety net when a
 *     monotonic timer produces a spurious negative delta (which does
 *     happen on some CI runners across clock adjustments). If someone
 *     removed the Math.max, the histogram observation would throw and
 *     the /api/metrics handler would 500. Asserting no throw here
 *     documents the contract.
 */
describe("metrics — out-of-range status + negative-duration clamps", () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics()
  })

  it('classifies status < 200 as "other" (bounded-cardinality fallback)', async () => {
    recordApiRequest("search", "GET", 100, 5)
    recordApiRequest("search", "GET", 0, 5)

    const text = await metricsRegistry.metrics()

    expect(text).toContain('status_class="other"')
    // Regression guard: raw status codes must NEVER surface as label
    // values. If a refactor started stringifying `status` directly,
    // this would fail.
    expect(text).not.toMatch(/status_class="100"/)
    expect(text).not.toMatch(/status_class="0"/)
  })

  it('classifies status >= 600 as "other"', async () => {
    recordApiRequest("docs-image", "GET", 600, 5)
    recordApiRequest("docs-image", "GET", 999, 5)

    const text = await metricsRegistry.metrics()
    expect(text).toContain('status_class="other"')
    expect(text).not.toMatch(/status_class="600"/)
    expect(text).not.toMatch(/status_class="999"/)
  })

  it("clamps negative durationMs to 0 without throwing (prom-client would reject negatives)", async () => {
    expect(() =>
      recordApiRequest("search", "GET", 200, -50)
    ).not.toThrow()

    const text = await metricsRegistry.metrics()
    // The observation must land in the smallest bucket (le=0.01) and
    // in +Inf, both with count >= 1 for a 0-second observation.
    expect(text).toMatch(
      /docs_api_request_duration_seconds_bucket\{[^}]*le="0\.01"[^}]*\} 1/,
    )
    // Sum must equal exactly 0 for a single clamped observation.
    expect(text).toMatch(
      /docs_api_request_duration_seconds_sum\{[^}]*route="search"[^}]*\} 0\b/,
    )
  })

  it("records method label verbatim (contract: caller controls method cardinality)", async () => {
    // Existing suite only ever passes "GET". Lock down that method is
    // passed through unmodified — otherwise instrumentation of POST
    // endpoints later would silently lose data if a regression
    // upper-cased or normalized method.
    recordApiRequest("search", "POST", 201, 8)

    const text = await metricsRegistry.metrics()
    expect(text).toMatch(/method="POST"/)
    expect(text).toContain('status_class="2xx"')
  })
})
