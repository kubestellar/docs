import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx } from '../lib/sanitizeHtml'

/**
 * Coverage for the "profile URL is not a github.com URL" branch of the
 * contributor-table extractor in src/lib/sanitizeHtml.ts (around lines
 * 158-162). Existing sanitize.contributor-and-img.test.ts always uses
 * https://github.com/... URLs, so the ternary that yields '' when
 * profileUrl does NOT match the github.com/<login> pattern was never
 * exercised. If that branch ever throws (say, from a future refactor
 * that indexes into null), contributor rendering would fail silently
 * on GitHub Enterprise or self-hosted profile links.
 */
describe('sanitizeHtmlForMdx — contributor with non-github profile URL', () => {
  it('still emits a contributor card when the profile URL is not on github.com', () => {
    // Note: profile URL is https://example.com/... — the extractor's
    // profileUrl.match(/github\.com\/([^/]+)/) returns null and the
    // ternary yields github = '' without throwing.
    const td = `<td align="center"><a href="https://example.com/carol"><img src="https://example.com/carol.png" width="1" alt=""/><br /><sub><b>Carol</b></sub></a></td>`
    const result = sanitizeHtmlForMdx(`<table><tr>${td}</tr></table>`)

    expect(result).toContain('<div className="contributors-grid">')
    expect(result).toContain('className="contributor-card"')
    // Profile URL round-trips even though it isn't on github.com.
    expect(result).toContain('href="https://example.com/carol"')
    expect(result).toContain('<span>Carol</span>')
    expect(result).toContain('src="https://example.com/carol.png"')
    // No table remnants leak through.
    expect(result).not.toContain('<table')
    expect(result).not.toContain('<td')
  })

  it('mixes github and non-github contributors in the same table', () => {
    // Verifies the ternary picks the correct branch per-row, not just per
    // table. If a future refactor lifts the regex outside the loop this
    // test would fail.
    const rows = [
      `<td align="center"><a href="https://github.com/alice"><img src="https://avatars.githubusercontent.com/alice?v=4" width="1" alt=""/><br /><sub><b>Alice</b></sub></a></td>`,
      `<td align="center"><a href="https://gitlab.example/bob"><img src="https://gitlab.example/bob.png" width="1" alt=""/><br /><sub><b>Bob</b></sub></a></td>`,
    ].join('')
    const result = sanitizeHtmlForMdx(`<table><tr>${rows}</tr></table>`)
    expect(result).toContain('href="https://github.com/alice"')
    expect(result).toContain('href="https://gitlab.example/bob"')
    expect(result).toContain('<span>Alice</span>')
    expect(result).toContain('<span>Bob</span>')
  })
})
