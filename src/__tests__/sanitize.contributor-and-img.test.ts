import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx } from '../lib/sanitizeHtml'

/**
 * Unit tests for the contributor-table → contributor-cards conversion
 * and <img> normalization branches of sanitizeHtmlForMdx().
 *
 * Both paths were previously uncovered (see coverage gap on
 * src/lib/sanitizeHtml.ts lines ~151-176 and ~193-201). They rewrite
 * user-supplied HTML embedded in MDX, so a regression here would either
 * silently drop legitimate contributor markup or let malformed
 * attributes escape into rendered output.
 */

// ═════════════════════════════════════════════════════════════════════
// Contributor table → contributors-grid card conversion
// ═════════════════════════════════════════════════════════════════════

const contributorTd = (name: string, github: string, avatar = `https://avatars.githubusercontent.com/${github}?v=4`) =>
  `<td align="center"><a href="https://github.com/${github}"><img src="${avatar}" width="100px;" alt=""/><br /><sub><b>${name}</b></sub></a></td>`

describe('sanitizeHtmlForMdx — contributor table conversion', () => {
  it('converts a contributors <table> into a contributors-grid <div>', () => {
    const table = `<table><tr>${contributorTd('Alice', 'alice')}${contributorTd('Bob', 'bob')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result).toContain('<div className="contributors-grid">')
    expect(result).toContain('className="contributor-card"')
    expect(result).toContain('href="https://github.com/alice"')
    expect(result).toContain('href="https://github.com/bob"')
    expect(result).toContain('<span>Alice</span>')
    expect(result).toContain('<span>Bob</span>')
    // Original <table>/<tr>/<td> markup must be gone.
    expect(result).not.toContain('<table')
    expect(result).not.toContain('<tr')
    expect(result).not.toContain('<td')
  })

  it('emits an <img> for each contributor with its avatar URL and alt=name', () => {
    const table = `<table><tr>${contributorTd('Carol', 'carol', 'https://example.com/carol.png')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result).toContain('src="https://example.com/carol.png"')
    expect(result).toContain('alt="Carol"')
  })

  it('drops a contributors <table> that has no parseable rows', () => {
    // No <td>/<a>/<img>/<sub><b> structure — the extractor finds zero
    // contributors, so the whole table must collapse to '' (not leave
    // a bare "<div className='contributors-grid'></div>" behind).
    const table = '<table><tr><td>Just some text</td></tr></table>'
    const result = sanitizeHtmlForMdx(table)
    expect(result).not.toContain('contributors-grid')
    expect(result).not.toContain('<table')
    // Leftover <tr>/<td> that isn't converted is stripped by the
    // subsequent tr/td removal passes.
    expect(result).not.toContain('<tr')
    expect(result).not.toContain('<td')
  })

  it('extracts the GitHub username from the profile URL', () => {
    // The extractor's github field is derived from the profile URL. We can
    // verify it indirectly by ensuring the profile href round-trips
    // correctly for a real-world GitHub URL.
    const table = `<table><tr>${contributorTd('Dave', 'dave-user-123')}</tr></table>`
    const result = sanitizeHtmlForMdx(table)
    expect(result).toContain('href="https://github.com/dave-user-123"')
  })

  it('escapes special characters in contributor names and URLs', () => {
    // A name containing quote/angle chars must be HTML-escaped in both
    // the <span>name</span> and the alt="…" attribute so it cannot
    // break out of attribute context.
    const evil = `<td align="center"><a href="https://github.com/x&y"><img src="https://x/?a=1&b=2" width="1" alt=""/><br /><sub><b>Al"ice</b></sub></a></td>`
    const result = sanitizeHtmlForMdx(`<table><tr>${evil}</tr></table>`)
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
    // Raw unescaped double-quote must not appear inside the emitted name.
    expect(result).not.toMatch(/<span>[^<]*"[^<]*<\/span>/)
  })
})

// ═════════════════════════════════════════════════════════════════════
// <tr> / <td> leftover cleanup (outside contributor tables)
// ═════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — stray tr/td removal', () => {
  it('removes bare <tr>...</tr> not wrapped in a <table>', () => {
    const result = sanitizeHtmlForMdx('<p>ok</p><tr><td>x</td></tr><p>done</p>')
    expect(result).toContain('<p>ok</p>')
    expect(result).toContain('<p>done</p>')
    expect(result).not.toContain('<tr')
    expect(result).not.toContain('<td')
  })

  it('removes attribute-bearing <td …>…</td>', () => {
    const result = sanitizeHtmlForMdx('<td colspan="2" style="color:red">cell</td>')
    expect(result).not.toContain('<td')
    expect(result).not.toContain('cell')
  })
})

// ═════════════════════════════════════════════════════════════════════
// <img> tag normalization
// ═════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — img normalization', () => {
  it('normalizes <img src="…" alt="…"> into a self-closing tag', () => {
    const result = sanitizeHtmlForMdx('<img src="/a.png" alt="A">')
    expect(result).toBe('<img src="/a.png" alt="A" />')
  })

  it('normalizes an already-self-closing <img … />', () => {
    const result = sanitizeHtmlForMdx('<img src="/a.png" alt="A" />')
    expect(result).toBe('<img src="/a.png" alt="A" />')
  })

  it('preserves a title attribute when present', () => {
    const result = sanitizeHtmlForMdx('<img src="/a.png" alt="A" title="tip">')
    expect(result).toContain('title="tip"')
    expect(result).toContain('src="/a.png"')
    expect(result).toContain('alt="A"')
  })

  it('defaults alt="" when the source has no alt attribute', () => {
    const result = sanitizeHtmlForMdx('<img src="/a.png">')
    expect(result).toContain('src="/a.png"')
    expect(result).toContain('alt=""')
  })

  it('drops an <img> tag that has no src attribute', () => {
    const result = sanitizeHtmlForMdx('<p>hi</p><img alt="orphan"><p>bye</p>')
    expect(result).toContain('<p>hi</p>')
    expect(result).toContain('<p>bye</p>')
    expect(result).not.toContain('<img')
    expect(result).not.toContain('orphan')
  })

  it('escapes special characters in src, alt, and title attributes', () => {
    // A src or alt value that contains angle brackets or ampersands must
    // be HTML-encoded so it cannot re-introduce tags or break out of
    // the attribute context.
    const result = sanitizeHtmlForMdx('<img src="/a.png?x=1&y=2" alt="A & B">')
    expect(result).toContain('src="/a.png?x=1&amp;y=2"')
    expect(result).toContain('alt="A &amp; B"')
  })

  it('strips width/height/align attributes on the img tag', () => {
    // These attributes are stripped globally before img normalization
    // runs, so the normalized output must omit them entirely.
    const result = sanitizeHtmlForMdx('<img src="/a.png" alt="A" width="100" height="50" align="left">')
    expect(result).not.toMatch(/width=/i)
    expect(result).not.toMatch(/height=/i)
    expect(result).not.toMatch(/align=/i)
  })
})
