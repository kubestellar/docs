import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Complementary unit tests for src/lib/url.ts covering the exports that
 * `url.test.ts` does not exercise:
 *
 *   - CURRENT_BRANCH  (module-init read of NEXT_PUBLIC_BRANCH)
 *   - getKubestellarEditBaseUrl()
 *   - getLocalizedUrl()
 *
 * The existing `url.test.ts` focuses on the getBaseUrl() hostname allow-list
 * (PR #5844 CWE-20 mitigation). This file fills the remaining branches so
 * regressions in the edit-on-GitHub link or the kubestellar.io URL rewrite
 * cannot land silently.
 */

const originalWindow = globalThis.window

function restoreWindow() {
  if (originalWindow === undefined) {
    // @ts-expect-error - removing window for SSR-style tests
    delete globalThis.window
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    })
  }
}

function mockWindow(host: string, protocol = 'https:') {
  Object.defineProperty(globalThis, 'window', {
    value: { location: { host, protocol } },
    writable: true,
    configurable: true,
  })
}

// ═════════════════════════════════════════════════════════════════════
// CURRENT_BRANCH — frozen at module load from NEXT_PUBLIC_BRANCH
// ═════════════════════════════════════════════════════════════════════

describe('CURRENT_BRANCH', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to "main" when NEXT_PUBLIC_BRANCH is unset/empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', '')
    const mod = await import('../lib/url')
    expect(mod.CURRENT_BRANCH).toBe('main')
  })

  it('uses the value of NEXT_PUBLIC_BRANCH when set (e.g. version-pinned branch)', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', 'docs/0.29.0')
    const mod = await import('../lib/url')
    expect(mod.CURRENT_BRANCH).toBe('docs/0.29.0')
  })

  it('passes a non-default branch value through verbatim', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', 'feature/new-thing')
    const mod = await import('../lib/url')
    expect(mod.CURRENT_BRANCH).toBe('feature/new-thing')
  })
})

// ═════════════════════════════════════════════════════════════════════
// getKubestellarEditBaseUrl — must target CURRENT_BRANCH, not hard-coded main
// ═════════════════════════════════════════════════════════════════════

describe('getKubestellarEditBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('points at main when NEXT_PUBLIC_BRANCH is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', '')
    const mod = await import('../lib/url')
    expect(mod.getKubestellarEditBaseUrl()).toBe(
      'https://github.com/kubestellar/docs/edit/main/docs/content',
    )
  })

  it('points at the version-pinned branch when NEXT_PUBLIC_BRANCH is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', 'docs/0.29.0')
    const mod = await import('../lib/url')
    expect(mod.getKubestellarEditBaseUrl()).toBe(
      'https://github.com/kubestellar/docs/edit/docs/0.29.0/docs/content',
    )
  })

  it('always targets kubestellar/docs and docs/content', async () => {
    vi.stubEnv('NEXT_PUBLIC_BRANCH', 'anything')
    const mod = await import('../lib/url')
    const url = mod.getKubestellarEditBaseUrl()
    expect(url.startsWith('https://github.com/kubestellar/docs/edit/')).toBe(true)
    expect(url.endsWith('/docs/content')).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════
// getLocalizedUrl — relative pass-through, kubestellar.io rewrite,
// external URLs, CWE-20 look-alike hosts, and parse-failure fallback.
// ═════════════════════════════════════════════════════════════════════

describe('getLocalizedUrl', () => {
  beforeEach(() => {
    vi.resetModules()
    restoreWindow()
  })

  afterEach(() => {
    restoreWindow()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns absolute paths (/foo) unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('/docs/intro')).toBe('/docs/intro')
  })

  it('returns bare relative paths unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('docs/intro')).toBe('docs/intro')
  })

  it('returns anchor-only URLs unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('#section')).toBe('#section')
  })

  it('rewrites kubestellar.io URLs to the current client base', async () => {
    mockWindow('localhost:3000', 'http:')
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('https://kubestellar.io/docs/intro?x=1#h')).toBe(
      'http://localhost:3000/docs/intro?x=1#h',
    )
  })

  it('rewrites docs.kubestellar.io URLs to the current client base', async () => {
    mockWindow('pr-42.previews.kubestellar.io', 'https:')
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('https://docs.kubestellar.io/guide')).toBe(
      'https://pr-42.previews.kubestellar.io/guide',
    )
  })

  it('preserves query string and hash when rewriting', async () => {
    mockWindow('localhost:3000', 'http:')
    const { getLocalizedUrl } = await import('../lib/url')
    expect(getLocalizedUrl('https://kubestellar.io/a/b?foo=bar&baz=qux#section')).toBe(
      'http://localhost:3000/a/b?foo=bar&baz=qux#section',
    )
  })

  it('leaves external (github.com) URLs unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    const external = 'https://github.com/kubestellar/docs'
    expect(getLocalizedUrl(external)).toBe(external)
  })

  it('leaves http:// external URLs unchanged', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    const external = 'http://example.com/path'
    expect(getLocalizedUrl(external)).toBe(external)
  })

  it('CWE-20: does not rewrite look-alike hostnames like kubestellar.io.attacker.com', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    const evil = 'https://kubestellar.io.attacker.com/steal'
    expect(getLocalizedUrl(evil)).toBe(evil)
  })

  it('CWE-20: does not rewrite fake docs.kubestellar.io subdomains like docs.kubestellar.io.attacker.com', async () => {
    const { getLocalizedUrl } = await import('../lib/url')
    const evil = 'https://docs.kubestellar.io.attacker.com/steal'
    expect(getLocalizedUrl(evil)).toBe(evil)
  })

  it('returns the original URL and logs when URL parsing throws', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getLocalizedUrl } = await import('../lib/url')
    // Passes the absolute-URL guard (starts with "https://") but throws in
    // the URL constructor because there is no hostname.
    const bad = 'https://'
    expect(getLocalizedUrl(bad)).toBe(bad)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
