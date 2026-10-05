import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx } from '../lib/sanitizeHtml'

/**
 * Regression: safeUrl() in src/lib/sanitizeHtml.ts was previously only
 * invoked on href/src values extracted while converting a contributor
 * `<table>` into contributor cards. Any other raw `<a href="...">` tag in
 * MDX content — i.e. anywhere outside a contributor table — passed through
 * sanitizeHtmlForMdx unchanged, so a `javascript:` href survived and could
 * execute attacker JavaScript same-origin when clicked (the docs CSP allows
 * `script-src 'self' 'unsafe-inline'`, which does not block `javascript:`
 * link navigation). See kubestellar/docs#7256.
 */
describe('sanitizeHtmlForMdx generic anchor href scheme validation', () => {
  it('neutralizes a javascript: href on a plain anchor outside any table', () => {
    const input = 'Click <a href="javascript:alert(document.cookie)">here</a> for details.'
    const result = sanitizeHtmlForMdx(input)
    expect(result.toLowerCase()).not.toContain('javascript:')
    expect(result).toContain('>here</a>')
  })

  it('neutralizes a data: href on a plain anchor', () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">link</a>'
    const result = sanitizeHtmlForMdx(input)
    expect(result.toLowerCase()).not.toContain('data:')
  })

  it('neutralizes a scheme-hiding href using an embedded control character', () => {
    const input = '<a href="ja\tvascript:alert(1)">link</a>'
    const result = sanitizeHtmlForMdx(input)
    expect(result.toLowerCase()).not.toContain('javascript:')
  })

  it('preserves a safe https href unchanged', () => {
    const input = '<a href="https://example.com/docs">link</a>'
    const result = sanitizeHtmlForMdx(input)
    expect(result).toContain('href="https://example.com/docs"')
  })

  it('preserves safe single-quoted href unchanged', () => {
    const input = "<a href='https://example.com/docs'>link</a>"
    const result = sanitizeHtmlForMdx(input)
    expect(result).toContain("href='https://example.com/docs'")
  })
})
