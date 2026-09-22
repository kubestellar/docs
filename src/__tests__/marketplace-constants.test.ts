import { describe, it, expect, vi, afterEach } from 'vitest'

/**
 * Coverage for src/app/[locale]/marketplace/lib/constants.ts (baseline 0%).
 *
 * detectConsole() is the only executable logic in this file (TYPE_CONFIG and
 * the URL/port constants are static data). It probes a local KubeStellar
 * Console instance via a no-cors fetch and resolves true/false depending on
 * whether the request settles before the abort timeout fires.
 */

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('marketplace/lib/constants', () => {
  it('exposes the expected TYPE_CONFIG entries for dashboard, card-preset and theme', async () => {
    const { TYPE_CONFIG } = await import('@/app/[locale]/marketplace/lib/constants')
    expect(Object.keys(TYPE_CONFIG).sort()).toEqual(['card-preset', 'dashboard', 'theme'])
    expect(TYPE_CONFIG.dashboard.label).toBe('Dashboard')
    expect(TYPE_CONFIG['card-preset'].label).toBe('Card Preset')
    expect(TYPE_CONFIG.theme.label).toBe('Theme')
  })

  it('detectConsole resolves true when the fetch succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('fetch', fetchMock)

    const { detectConsole, CONSOLE_DEFAULT_PORT } = await import(
      '@/app/[locale]/marketplace/lib/constants'
    )
    const result = await detectConsole()

    expect(result).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:${CONSOLE_DEFAULT_PORT}/`,
      expect.objectContaining({ mode: 'no-cors' }),
    )
  })

  it('detectConsole resolves true using a custom port', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('fetch', fetchMock)

    const { detectConsole } = await import('@/app/[locale]/marketplace/lib/constants')
    await detectConsole(9090)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9090/',
      expect.objectContaining({ mode: 'no-cors' }),
    )
  })

  it('detectConsole resolves false when the fetch rejects (console not running)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'))
    vi.stubGlobal('fetch', fetchMock)

    const { detectConsole } = await import('@/app/[locale]/marketplace/lib/constants')
    const result = await detectConsole(8080)

    expect(result).toBe(false)
  })
})
