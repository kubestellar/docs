import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs'
import { docsContentPath } from '@/app/docs/page-map'
import { GET } from '@/app/api/healthz/route'
import { logger } from '@/lib/logger'

/**
 * Coverage for src/app/api/healthz/route.ts — the readiness probe that
 * verifies the docs content tree is present and readable before the
 * orchestrator routes traffic to this instance. Previously at 0%.
 */
describe('/api/healthz route', () => {
  let statSyncSpy: ReturnType<typeof vi.spyOn>
  let readdirSyncSpy: ReturnType<typeof vi.spyOn>
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    statSyncSpy = vi.spyOn(fs, 'statSync')
    readdirSyncSpy = vi.spyOn(fs, 'readdirSync')
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 200 { status: "ok" } when the docs content directory exists and is non-empty', async () => {
    statSyncSpy.mockReturnValueOnce({ isDirectory: () => true } as unknown as fs.Stats)
    readdirSyncSpy.mockReturnValueOnce(['intro.md', 'kubestellar'] as unknown as fs.Dirent[])

    const res = await GET()

    expect(res.status).toBe(200)
    expect(statSyncSpy).toHaveBeenCalledWith(docsContentPath)
    expect(readdirSyncSpy).toHaveBeenCalledWith(docsContentPath)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('returns 503 with a "not a directory" reason when the content path is a file, not a directory', async () => {
    statSyncSpy.mockReturnValueOnce({ isDirectory: () => false } as unknown as fs.Stats)

    const res = await GET()

    expect(res.status).toBe(503)
    expect(readdirSyncSpy).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body).toEqual({
      status: 'unhealthy',
      reason: 'docs content path is not a directory',
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith('healthz check failed', {
      route: 'healthz',
      method: 'GET',
      status: 503,
      error: 'docs content path is not a directory',
    })
  })

  it('returns 503 with an "empty" reason when the content directory has no entries', async () => {
    statSyncSpy.mockReturnValueOnce({ isDirectory: () => true } as unknown as fs.Stats)
    readdirSyncSpy.mockReturnValueOnce([] as unknown as fs.Dirent[])

    const res = await GET()

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({
      status: 'unhealthy',
      reason: 'docs content path is empty',
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith('healthz check failed', {
      route: 'healthz',
      method: 'GET',
      status: 503,
      error: 'docs content path is empty',
    })
  })

  it('returns 503 propagating the Error.message when statSync throws (missing directory)', async () => {
    statSyncSpy.mockImplementationOnce(() => {
      throw new Error('ENOENT: no such file or directory')
    })

    const res = await GET()

    expect(res.status).toBe(503)
    expect(readdirSyncSpy).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body).toEqual({
      status: 'unhealthy',
      reason: 'ENOENT: no such file or directory',
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith('healthz check failed', {
      route: 'healthz',
      method: 'GET',
      status: 503,
      error: 'ENOENT: no such file or directory',
    })
  })

  it('returns 503 with the generic fallback reason when the thrown value is not an Error', async () => {
    // Exercises the `err instanceof Error ? err.message : 'docs content path is unreadable'` false arm.
    statSyncSpy.mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'string thrown from native fs'
    })

    const res = await GET()

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({
      status: 'unhealthy',
      reason: 'docs content path is unreadable',
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith('healthz check failed', {
      route: 'healthz',
      method: 'GET',
      status: 503,
      error: 'docs content path is unreadable',
    })
  })

  it('returns 503 when readdirSync throws after statSync succeeds (permission error)', async () => {
    statSyncSpy.mockReturnValueOnce({ isDirectory: () => true } as unknown as fs.Stats)
    readdirSyncSpy.mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied')
    })

    const res = await GET()

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({
      status: 'unhealthy',
      reason: 'EACCES: permission denied',
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith('healthz check failed', {
      route: 'healthz',
      method: 'GET',
      status: 503,
      error: 'EACCES: permission denied',
    })
  })
})
