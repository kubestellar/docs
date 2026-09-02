import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger } from "@/lib/logger"

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it("emits a single-line JSON record with the expected bounded fields", () => {
    logger.info("request handled", {
      route: "search",
      method: "GET",
      status: 200,
      durationMs: 4,
    })

    // info-level records go through console.warn (repo lint only allows
    // console.warn/console.error), not console.log.
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string)
    expect(parsed).toMatchObject({
      level: "info",
      message: "request handled",
      route: "search",
      method: "GET",
      status: 200,
      durationMs: 4,
    })
    expect(typeof parsed.time).toBe("string")
  })
  it("logs errors via console.error and truncates long error messages", () => {
    const longError = "x".repeat(1000)
    logger.error("search request failed", {
      route: "search",
      method: "GET",
      status: 500,
      error: longError,
    })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.level).toBe("error")
    expect(parsed.error.length).toBeLessThan(320)
    expect(parsed.error.endsWith("...")).toBe(true)
  })
})
