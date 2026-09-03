import { describe, expect, it } from 'vitest'
import { GET } from '@/app/api/livez/route'

/**
 * Coverage for src/app/api/livez/route.ts — the liveness probe. Unlike
 * /api/healthz (readiness), this must not check the docs content
 * dependency, since a failed liveness check causes the orchestrator to
 * restart the container, which cannot fix a missing/misconfigured content
 * volume and would otherwise turn a readiness-level issue into a
 * simultaneous restart loop across every replica.
 */
describe('/api/livez route', () => {
  it('always returns 200 { status: "ok" } without touching the docs content path', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })
})
