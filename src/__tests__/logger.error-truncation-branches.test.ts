import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger } from "@/lib/logger"

/**
 * Branch coverage for logger.error()'s truncation guard in src/lib/logger.ts:
 *
 *   const truncated =
 *     fields.error && fields.error.length > 300
 *       ? `${fields.error.slice(0, 300)}...`
 *       : fields.error
 *
 * logger.test.ts locks the > 300 branch (a 1000-char error is trimmed and
 * suffixed with "..."). It does NOT lock the other two paths:
 *
 *   1. fields.error is undefined       -> short-circuits at `fields.error &&`
 *   2. fields.error is present but     -> length check is false, error is
 *      length <= 300                      passed through verbatim
 *   3. fields.error is exactly 300     -> boundary of the > comparison
 *   4. fields.error is exactly 301     -> just above the boundary
 *
 * These branches are relevant because most real errors under 300 chars would
 * silently gain a "..." suffix if the boundary condition were ever inverted
 * (a common refactor bug: > vs >=). Locking the exact-boundary behavior
 * prevents that.
 */
describe("logger.error — truncation branches", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it("passes fields.error through untouched when the field is undefined", () => {
    logger.error("boom", {
      route: "search",
      method: "GET",
      status: 500,
    })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.level).toBe("error")
    expect(parsed.message).toBe("boom")
    expect(parsed.route).toBe("search")
    // JSON.stringify drops `error: undefined`, so the field must be absent
    // (not present with value null or empty string).
    expect(Object.prototype.hasOwnProperty.call(parsed, "error")).toBe(false)
  })

  it("does NOT truncate a short error (length < 300)", () => {
    const short = "connection refused: 127.0.0.1:5432"
    logger.error("db unreachable", {
      route: "search",
      method: "GET",
      status: 500,
      error: short,
    })

    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.error).toBe(short)
    expect(parsed.error.endsWith("...")).toBe(false)
  })

  it("does NOT truncate an error at the exact 300-char boundary (> is strict)", () => {
    const exactly300 = "e".repeat(300)
    logger.error("edge", {
      route: "search",
      method: "GET",
      status: 500,
      error: exactly300,
    })

    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.error.length).toBe(300)
    expect(parsed.error).toBe(exactly300)
    expect(parsed.error.endsWith("...")).toBe(false)
  })

  it("truncates an error one char past the boundary (301 chars → 303 with '...')", () => {
    const exactly301 = "f".repeat(301)
    logger.error("edge+1", {
      route: "search",
      method: "GET",
      status: 500,
      error: exactly301,
    })

    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    // Truncation slices to 300 then appends "..." → length 303.
    expect(parsed.error.length).toBe(303)
    expect(parsed.error.endsWith("...")).toBe(true)
    expect(parsed.error.slice(0, 300)).toBe("f".repeat(300))
  })

  it("passes fields.error through untouched when it is an empty string (falsy short-circuit)", () => {
    // Empty string is falsy so `fields.error && ...` short-circuits and the
    // ternary's else branch reassigns the empty string verbatim.
    logger.error("empty error", {
      route: "search",
      method: "GET",
      status: 500,
      error: "",
    })

    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.error).toBe("")
  })
})
