import { describe, it, expect } from 'vitest'
import { getVersionUrl, PRODUCTION_URL } from '../config/versions'

// Covers the previously-uncovered `externalUrl` branch of
// getVersionUrl (src/config/versions.ts:640). The existing suite
// exercises the "latest -> production", "unknown -> production",
// and "Netlify branch deploy" arms but never a version whose
// VersionInfo carries an `externalUrl` — the only real user of
// that today is the "legacy" version, which the sidebar version
// switcher links out to. A regression that swapped the branch order
// (checked isDefault before externalUrl) would silently redirect
// legacy links to the current production docs.

describe('getVersionUrl — external URL branch', () => {
  it('returns the versions externalUrl for legacy (out-of-tree docs site)', () => {
    // The legacy VersionInfo has:
    //   externalUrl: "https://kubestellar.github.io/kubestellar"
    // and isDefault: false, so it must fall into the externalUrl
    // arm and NOT into the Netlify-branch-deploy formatting arm.
    const url = getVersionUrl('legacy', '/docs/anything')

    // The externalUrl is returned verbatim: no PRODUCTION_URL
    // prefix, no `.netlify.app` fabrication, no pathname
    // appended (the target site owns its own routing).
    expect(url).toBe('https://kubestellar.github.io/kubestellar')
    expect(url).not.toContain('.netlify.app')
    expect(url).not.toContain(PRODUCTION_URL)
    expect(url.endsWith('/docs/anything')).toBe(false)
  })

  it('externalUrl takes precedence regardless of pathname argument', () => {
    // Guard against a regression that concatenated `${externalUrl}${pathname}`
    // — the whole point of externalUrl is that the destination
    // site has its own URL space.
    const a = getVersionUrl('legacy', '/docs')
    const b = getVersionUrl('legacy', '/docs/a/b/c')
    const c = getVersionUrl('legacy', '/')
    expect(a).toBe(b)
    expect(b).toBe(c)
  })
})
