import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx } from '../lib/sanitizeHtml'

/**
 * Targets the falsy arm of the `githubMatch ? githubMatch[1] : ''`
 * ternary inside sanitizeHtmlForMdx's contributor-table extractor
 * (src/lib/sanitizeHtml.ts ~line 160). Every existing test uses a
 * github.com profile URL, so the `''` fallback — which fires when the
 * contributor's <a href> is *not* a github.com URL — was previously
 * uncovered. Contributor tables are user-supplied MDX; a non-github
 * profile URL is a realistic corner case, and a regression that
 * threw here (e.g. `githubMatch[1]` on undefined) would silently
 * break rendering of the whole page's contributor grid.
 */

describe('sanitizeHtmlForMdx — contributor with non-github profile URL', () => {
  const nonGithubTd = (name: string, profileUrl: string, avatar: string) =>
    `<td align="center"><a href="${profileUrl}"><img src="${avatar}" width="100px;" alt=""/><br /><sub><b>${name}</b></sub></a></td>`

  it('emits a contributor card when the profile URL is not github.com', () => {
    const table = `<table><tr>${nonGithubTd('Eve', 'https://gitlab.com/eve', 'https://example.com/eve.png')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    // The grid still renders — the contributor is not dropped just because
    // the profile URL is off-platform.
    expect(result).toContain('<div className="contributors-grid">')
    expect(result).toContain('className="contributor-card"')
    expect(result).toContain('href="https://gitlab.com/eve"')
    expect(result).toContain('<span>Eve</span>')
    expect(result).toContain('src="https://example.com/eve.png"')
    expect(result).toContain('alt="Eve"')
  })

  it('mixes github and non-github contributors in a single table', () => {
    const rows =
      nonGithubTd('Frank', 'https://gitlab.com/frank', 'https://example.com/frank.png') +
      `<td align="center"><a href="https://github.com/grace"><img src="https://avatars.githubusercontent.com/grace?v=4" width="100px;" alt=""/><br /><sub><b>Grace</b></sub></a></td>`
    const result = sanitizeHtmlForMdx(`<table><tr>${rows}</tr></table>`)
    // Both contributors survive.
    expect(result).toContain('<span>Frank</span>')
    expect(result).toContain('<span>Grace</span>')
    expect(result).toContain('href="https://gitlab.com/frank"')
    expect(result).toContain('href="https://github.com/grace"')
  })

  it('handles a bare hostname (no path) profile URL without throwing', () => {
    // The `github.com/([^/]+)` regex requires a slash after github.com;
    // a bare "https://example.org" href hits the `: ''` fallback arm.
    const table = `<table><tr>${nonGithubTd('Heidi', 'https://example.org', 'https://example.org/h.png')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result).toContain('<span>Heidi</span>')
    expect(result).toContain('href="https://example.org"')
    // No stray "undefined" or "null" leaked into the emitted card.
    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })
})
