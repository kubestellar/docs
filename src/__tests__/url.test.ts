import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit tests for getBaseUrl() hostname validation.
 *
 * Covers the security fix in PR #5844 which replaced substring includes()
 * checks with exact-match / proper suffix checks to prevent URL bypass via
 * crafted hostnames (CWE-20, CodeQL js/incomplete-url-substring-sanitization).
 */

// We need to control window.location for client-side tests
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

describe('getBaseUrl — client-side hostname validation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    restoreWindow()
  })

  async function loadGetBaseUrl() {
    const mod = await import('../lib/url')
    return mod.getBaseUrl
  }

  // --- Legitimate preview/local hostnames (should return current host) ---

  it('returns current host for localhost', async () => {
    mockWindow('localhost:3000', 'http:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('http://localhost:3000')
  })

  it('returns current host for 127.0.0.1', async () => {
    mockWindow('127.0.0.1:3000', 'http:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('http://127.0.0.1:3000')
  })

  it('returns current host for *.netlify.app', async () => {
    mockWindow('deploy-preview-42--kubestellar-docs.netlify.app', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('https://deploy-preview-42--kubestellar-docs.netlify.app')
  })

  it('returns current host for previews.kubestellar.io', async () => {
    mockWindow('previews.kubestellar.io', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('https://previews.kubestellar.io')
  })

  it('returns current host for sub.previews.kubestellar.io', async () => {
    mockWindow('pr-123.previews.kubestellar.io', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('https://pr-123.previews.kubestellar.io')
  })

  // --- Malicious hostnames that should NOT be treated as preview ---

  it('does NOT match evil-previews.kubestellar.io (prefix attack)', async () => {
    mockWindow('evil-previews.kubestellar.io', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    // Should fall through to production URL, NOT return current host
    expect(getBaseUrl()).not.toBe('https://evil-previews.kubestellar.io')
  })

  it('does NOT match localhost.evil.com (suffix attack)', async () => {
    mockWindow('localhost.evil.com', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).not.toBe('https://localhost.evil.com')
  })

  it('does NOT match evil-netlify.app (not a subdomain)', async () => {
    mockWindow('evil-netlify.app', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).not.toBe('https://evil-netlify.app')
  })

  it('does NOT match 127.0.0.1.evil.com', async () => {
    mockWindow('127.0.0.1.evil.com', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).not.toBe('https://127.0.0.1.evil.com')
  })

  // --- Port stripping ---

  it('strips port before hostname comparison (localhost:5174)', async () => {
    mockWindow('localhost:5174', 'http:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('http://localhost:5174')
  })

  // --- Production fallback ---

  it('returns production URL for kubestellar.io', async () => {
    mockWindow('kubestellar.io', 'https:')
    const getBaseUrl = await loadGetBaseUrl()
    expect(getBaseUrl()).toBe('https://kubestellar.io')
  })
})

describe('getBaseUrl — server-side (no window)', () => {
  beforeEach(() => {
    vi.resetModules()
    restoreWindow()
  })

  it('returns localhost:3000 in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '')
    const mod = await import('../lib/url')
    expect(mod.getBaseUrl()).toBe('http://localhost:3000')
    vi.unstubAllEnvs()
  })

  it('returns NEXT_PUBLIC_BASE_URL when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://custom.example.com')
    const mod = await import('../lib/url')
    expect(mod.getBaseUrl()).toBe('https://custom.example.com')
    vi.unstubAllEnvs()
  })
})
