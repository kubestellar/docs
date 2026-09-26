/**
 * Unit tests for useGithubStats() in src/components/navbar/useGithubStats.ts.
 *
 * The hook lives on every marketing page and drives the navbar's
 * stars/forks/watchers badge. If shields.io is slow, blocked, or the
 * user is on the server-rendered pass, the badge must fall back to
 * hard-coded sensible defaults — otherwise the header renders "" and
 * layout jumps once the fetch completes.
 *
 * The docs repo tests React via renderToStaticMarkup (see Mermaid.test.tsx
 * and docs-page-render.test.ts), so we render a tiny probe component that
 * echoes the hook's return value into the SSR markup. useEffect does not
 * fire during SSR, which is precisely the pre-hydration state we care
 * about: the badge must show the fallback values, and the hook must not
 * touch fetch at all.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { useGithubStats } from '../components/navbar/useGithubStats'

function Probe() {
  const stats = useGithubStats()
  return createElement(
    'span',
    { 'data-stars': stats.stars, 'data-forks': stats.forks, 'data-watchers': stats.watchers },
    `${stats.stars}|${stats.forks}|${stats.watchers}`,
  )
}

describe('useGithubStats (initial / SSR fallback)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    // Guard against accidental network I/O — any fetch invocation during
    // the SSR pass would be a bug (useEffect must not fire).
    globalThis.fetch = vi.fn(() => {
      throw new Error('fetch should not be called during SSR')
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('exposes the documented default stars/forks/watchers fallback on first render', () => {
    const html = renderToStaticMarkup(createElement(Probe))
    expect(html).toContain('data-stars="30"')
    expect(html).toContain('data-forks="25"')
    expect(html).toContain('data-watchers="1"')
    expect(html).toContain('30|25|1')
  })

  it('does not invoke fetch during the SSR pass (useEffect deferred to client)', () => {
    renderToStaticMarkup(createElement(Probe))
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('returns string values for every stat (badge templates rely on string concat)', () => {
    // Assert the type contract by rendering and re-parsing the attribute
    // values, which must be non-empty strings on first paint.
    const html = renderToStaticMarkup(createElement(Probe))
    const match = html.match(/(\d+)\|(\d+)\|(\d+)/)
    expect(match).not.toBeNull()
    const [, stars, forks, watchers] = match!
    expect(typeof stars).toBe('string')
    expect(typeof forks).toBe('string')
    expect(typeof watchers).toBe('string')
    // And the defaults are non-zero — a "0 stars" fallback would look
    // like a broken repo in the header.
    expect(Number(stars)).toBeGreaterThan(0)
    expect(Number(forks)).toBeGreaterThan(0)
    expect(Number(watchers)).toBeGreaterThan(0)
  })
})
