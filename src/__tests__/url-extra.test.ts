import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit tests for the uncovered branches of src/lib/url.ts.
 *
 * The existing url.test.ts covers getBaseUrl() hostname validation.
 * This file fills in:
 *   - getBaseUrl() production fallback (line 41)
 *   - getLocalizedUrl() (lines 74-100) — kubestellar.io rewrite,
 *     external URL passthrough, relative URL passthrough, malformed URL
 *   - getKubestellarEditBaseUrl() branch-pinning
 */

const originalWindow = globalThis.window

function mockWindow(host: string, protocol = 'https:') {
  Object.defineProperty(globalThis, 'window', {
    value: { location: { host, protocol } },
    writable: true,
    configurable: true,
  })
}

function restoreWindow() {
  if (originalWindow === undefined) {
    // @ts-expect-error - removing window for SSR tests
    delete globalThis.window
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    })
  }
}

describe('getBaseUrl — production fallback (server-side)', () => {
  beforeEach(() => {
    vi.resetModules()
    restoreWindow()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('falls back to the production URL when neither NODE_ENV=development nor NEXT_PUBLIC_BASE_URL is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    const mod = await import('../lib/url')
    expect(mod.getBaseUrl()).toBe('https://kubestellar.io')
  })
})

describe('getKubestellarEditBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses NEXT_PUBLIC_BRANCH when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', 'docs/0.29.0')
    const mod = await import('../lib/url')
    expect(mod.getKubestellarEditBaseUrl()).toBe(
      'https://github.com/kubestellar/docs/edit/docs/0.29.0/docs/content'
    )
  })

  it('falls back to main when NEXT_PUBLIC_BRANCH is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', '')
    const mod = await import('../lib/url')
    expect(mod.getKubestellarEditBaseUrl()).toBe(
      'https://github.com/kubestellar/docs/edit/main/docs/content'
    )
  })
})

describe('getLocalizedUrl', () => {
  beforeEach(() => {
    vi.resetModules()
    restoreWindow()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    restoreWindow()
  })

  it('returns relative URLs unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('/docs/getting-started')).toBe('/docs/getting-started')
    expect(getLocalizedUrl('mailto:info@example.com')).toBe('mailto:info@example.com')
    expect(getLocalizedUrl('')).toBe('')
  })

  it('leaves external (non-kubestellar) absolute URLs unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('https://github.com/kubestellar/docs')).toBe(
      'https://github.com/kubestellar/docs'
    )
    expect(getLocalizedUrl('https://example.com/path?q=1#frag')).toBe(
      'https://example.com/path?q=1#frag'
    )
  })

  it('rewrites kubestellar.io URLs to the current base URL, preserving path/query/hash', async () => {
    // Force a preview base URL via client-side branch
    mockWindow('deploy-preview-42--kubestellar-docs.netlify.app', 'https:')
    const { getLocalizedUrl } = await import('../lib/url')
    expect(
      getLocalizedUrl('https://kubestellar.io/docs/getting-started?tab=k8s#install')
    ).toBe(
      'https://deploy-preview-42--kubestellar-docs.netlify.app/docs/getting-started?tab=k8s#install'
    )
  })

  it('also rewrites docs.kubestellar.io URLs', async () => {
    mockWindow('previews.kubestellar.io', 'https:')
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('https://docs.kubestellar.io/reference')).toBe(
      'https://previews.kubestellar.io/reference'
    )
  })

  it('keeps kubestellar.io URLs on the production host in production', async () => {
    // Server-side production fallback
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('https://kubestellar.io/docs')).toBe(
      'https://kubestellar.io/docs'
    )
  })

  it('returns the original string when URL parsing fails', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    // Silence expected console.error output from the parsing branch
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // The startsWith("http://") check passes but URL() throws on this input
    const bad = 'http://'
    // URL() actually accepts "http://" as invalid ("Invalid URL") in Node
    const result = getLocalizedUrl(bad)
    expect(result).toBe(bad)
    errSpy.mockRestore()
  })
})
