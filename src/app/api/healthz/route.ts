import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { docsContentPath } from '../../docs/page-map'
import { GENERAL_SECTIONS, NAV_FILE_NAME, loadNavFile, NavFileError } from '@/lib/nav'
import { getAllProjects } from '@/config/versions'
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
//
// Also validates every project's sidebar nav.yaml (PROJECTS[id].navPath) and
// the shared GENERAL_SECTIONS navs via loadNavFile() from src/lib/nav.ts.
// Since kubestellar/docs#7096, buildPageMap()/getNavStructure() load and
// parse these files at REQUEST time from SlugLayout (every /docs/<project>/*
// page render) and from /api/search — not just at build time, despite the
// "build error" framing in src/lib/nav.ts's module comment. A missing or
// malformed nav.yaml (bad deploy, partial checkout, hand-edit typo) throws
// NavFileError there uncaught: page renders hit only the client-side
// global-error.tsx boundary (console.error in the visitor's browser, no
// server log, no `docs_api_requests_total` sample, since that metric is only
// wired into /api/* route handlers), and the docs content directory itself
// is untouched, so the prior check above still reports "ok". Checking these
// files here closes that gap: the instance fails readiness instead of
// silently serving a broken sidebar/search on every request for an affected
// project. See runbooks/api-error-rate-latency.md.
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

    try {
      for (const project of getAllProjects()) {
        loadNavFile(path.join(process.cwd(), project.navPath))
      }
      for (const section of GENERAL_SECTIONS) {
        loadNavFile(path.join(docsContentPath, section, NAV_FILE_NAME))
      }
    } catch (navErr) {
      const reason = navErr instanceof NavFileError ? navErr.message : 'sidebar nav file is invalid'
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
