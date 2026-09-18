import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx } from '../lib/sanitizeHtml'

/**
 * Regression: the contributor-table extractor in sanitizeHtmlForMdx
 * previously passed the captured `href` / `img src` values straight through
 * `escapeAngle()`, which only escapes `& < > "`. A merged docs/content PR
 * containing a `<table>` with `href="javascript:..."` would render as a
 * live JavaScript-execution link (stored XSS gadget: the docs CSP allows
 * `script-src 'self' 'unsafe-inline'`, which does NOT block `javascript:`
 * URL activations from anchor clicks).
 *
 * The fix (safeUrl() in src/lib/sanitizeHtml.ts) rejects `javascript:`,
 * `data:`, `vbscript:`, `file:`, `blob:` and any URL containing embedded
 * ASCII control chars, and drops the whole contributor entry when the
 * scheme is rejected.
 */

const contribRow = (name: string, profileUrl: string, avatar: string) =>
  `<td align="center"><a href="${profileUrl}"><img src="${avatar}" width="100px;" alt=""/><br /><sub><b>${name}</b></sub></a></td>`

describe('sanitizeHtmlForMdx — contributor URL scheme allowlist', () => {
  it('drops a contributor whose href is javascript:', () => {
    const table = `<table><tr>${contribRow('Mallory', 'javascript:alert(document.domain)', 'https://example.com/m.png')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    // The javascript: URL must not survive anywhere in the output.
    expect(result.toLowerCase()).not.toContain('javascript:')
    // With no valid contributors the grid collapses to empty output.
    expect(result).not.toContain('contributor-card')
    expect(result).not.toContain('<span>Mallory</span>')
  })

  it('drops a contributor whose href is data:text/html', () => {
    const payload = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
    const table = `<table><tr>${contribRow('Trudy', payload, 'https://example.com/t.png')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result.toLowerCase()).not.toContain('data:text/html')
    expect(result).not.toContain('<span>Trudy</span>')
  })

  it('drops a contributor whose href hides its scheme behind a tab', () => {
    // Browsers strip leading whitespace/control chars before scheme parsing,
    // so "ja\tvascript:..." executes as javascript:. The allowlist must
    // reject any URL containing ASCII control chars.
    const table = `<table><tr>${contribRow('Eve', 'ja\tvascript:alert(1)', 'https://example.com/e.png')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result.toLowerCase()).not.toContain('javascript:')
    expect(result).not.toContain('<span>Eve</span>')
  })

  it('drops a contributor whose avatar src is a rejected scheme', () => {
    const table = `<table><tr>${contribRow('Peggy', 'https://github.com/peggy', 'javascript:void(0)')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result.toLowerCase()).not.toContain('javascript:')
    expect(result).not.toContain('<span>Peggy</span>')
  })

  it('keeps a mixed table row-set: emits the safe contributor, drops the malicious one', () => {
    const rows =
      contribRow('Alice', 'https://github.com/alice', 'https://avatars.githubusercontent.com/alice?v=4') +
      contribRow('Mallory', 'javascript:alert(1)', 'https://x/m.png')
    const result = sanitizeHtmlForMdx(`<table><tr>${rows}</tr></table>`)
    expect(result).toContain('<span>Alice</span>')
    expect(result).toContain('href="https://github.com/alice"')
    expect(result).not.toContain('<span>Mallory</span>')
    expect(result.toLowerCase()).not.toContain('javascript:')
  })

  it('still renders http/https/mailto contributor URLs unchanged', () => {
    const rows =
      contribRow('Bob', 'https://github.com/bob', 'https://x/b.png') +
      contribRow('Carol', 'http://example.org/carol', 'https://x/c.png') +
      contribRow('Dave', 'mailto:dave@example.org', 'https://x/d.png')
    const result = sanitizeHtmlForMdx(`<table><tr>${rows}</tr></table>`)
    expect(result).toContain('href="https://github.com/bob"')
    expect(result).toContain('href="http://example.org/carol"')
    expect(result).toContain('href="mailto:dave@example.org"')
  })
})
