import { NextResponse } from "next/server"
import { metricsRegistry } from "@/lib/metrics"

/**
 * Prometheus scrape endpoint for docs site API metrics.
 *
 * Pull-only: this handler serves the current in-process registry snapshot
 * and does not forward metrics to any external system.
 */
export async function GET() {
  const body = await metricsRegistry.metrics()
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": metricsRegistry.contentType,
    },
  })
}
