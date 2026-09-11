import { NextResponse } from 'next/server'
import fs from 'fs'
import { docsContentPath } from '../../docs/page-map'
import { logger } from '@/lib/logger'
import { recordApiRequest } from '@/lib/metrics'

// Readiness check for the docs app.
//
// The app's core dependency for serving traffic is the local docs content
// tree (see src/app/docs/page-map.ts). Every page render and the /api/search
// route read markdown files from `docsContentPath` at request time. If that
// directory is missing, empty, or unreadable (e.g. a bad container image
// build, a failed volume mount, or an incomplete version-branch checkout),
// the app can still return 200 on its normal routes while serving broken or
// empty documentation. This endpoint checks that dependency directly so an
// orchestrator or deploy pipeline can detect that condition before routing
// traffic to this instance.
//
// Outcomes are also recorded via the existing bounded `docs_api_*` metrics
// (route="healthz"), so readiness pass/fail rates are visible to
// Prometheus/alerting, not just grep-able from structured logs on failure.
export async function GET() {
  const startedAt = performance.now()
  let status = 200
  try {
    const stat = fs.statSync(docsContentPath)
    if (!stat.isDirectory()) {
      const reason = 'docs content path is not a directory'
      status = 503
      logger.error('healthz check failed', { route: 'healthz', method: 'GET', status, error: reason })
      return NextResponse.json({ status: 'unhealthy', reason }, { status })
    }

    const entries = fs.readdirSync(docsContentPath)
    if (entries.length === 0) {
      const reason = 'docs content path is empty'
      status = 503
      logger.error('healthz check failed', { route: 'healthz', method: 'GET', status, error: reason })
      return NextResponse.json({ status: 'unhealthy', reason }, { status })
    }

    return NextResponse.json({ status: 'ok' }, { status })
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'docs content path is unreadable'
    status = 503
    logger.error('healthz check failed', { route: 'healthz', method: 'GET', status, error: reason })
    return NextResponse.json({ status: 'unhealthy', reason }, { status })
  } finally {
    const durationMs = performance.now() - startedAt
    recordApiRequest('healthz', 'GET', status, durationMs)
  }
}
