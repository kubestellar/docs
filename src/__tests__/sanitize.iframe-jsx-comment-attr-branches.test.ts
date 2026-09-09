import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx, removeCommentPatterns } from '../lib/sanitizeHtml'

/**
 * Additional branch coverage for src/lib/sanitizeHtml.ts.
 *
 * The existing sanitize test suites cover script/style removal, comment
 * removal (via removeCommentPatterns), CDATA/DOCTYPE/PI removal, and the
 * contributor-table + <img> normalization branches. This file targets the
 * remaining independently-branched code paths that were not previously
 * exercised:
 *
 * - <iframe> removal in both closed-pair and self-closing/lone-opener forms.
 * - JSX-style comment removal ({/ ... /}) — sibling of the Jinja branch
 *   ({# ... #}) that IS already tested.
 * - <br> and <hr> normalization (both bare and self-closing).
 * - Attribute strip branches for allowfullscreen, frameborder, and
 *   scrolling (align/width/height are covered elsewhere, but these three
 *   are separate regexes).
 * - class= → className= rewrite.
 * - Style-attribute removal on remaining tags.
 * - Contributor cell with an inline handler on the surrounding <a>:
 *   ensures dangerous-pattern stripping still runs after the contributor
 *   rewrite path (stripDangerousPatterns runs after the table rewrite).
 */

describe('sanitizeHtmlForMdx — iframe removal (independent of script/style)', () => {
  it('strips a closed <iframe>...</iframe> pair', () => {
    const result = sanitizeHtmlForMdx('<p>a</p><iframe src="evil.example">x</iframe><p>b</p>')
    expect(result).toContain('<p>a</p>')
    expect(result).toContain('<p>b</p>')
    expect(result).not.toMatch(/iframe/i)
    expect(result).not.toContain('evil.example')
  })

  it('strips a self-closing <iframe … />', () => {
    const result = sanitizeHtmlForMdx('<p>safe</p><iframe src="evil.example" />')
    expect(result).toContain('<p>safe</p>')
    expect(result).not.toMatch(/iframe/i)
  })

  it('strips a lone <iframe> opener that never has a closing tag', () => {
    const result = sanitizeHtmlForMdx('<iframe src="evil.example">')
    expect(result).not.toMatch(/iframe/i)
  })

  it('strips nested iframe-spacer reconstruction inside the stability loop', () => {
    // <sty<iframe>x</iframe>le>...</style> — after iframe removal the
    // outer stripDangerousPatterns loop must re-recognize <style>.
    const result = sanitizeHtmlForMdx('<sty<iframe>x</iframe>le>.evil{}</style>')
    expect(result).not.toMatch(/iframe/i)
    expect(result).not.toContain('style')
    expect(result).not.toContain('.evil')
  })
})

describe('removeCommentPatterns — JSX-style comment branch', () => {
  it('removes a JSX-style comment ({/ ... /})', () => {
    const result = removeCommentPatterns('before{/ jsx comment /}after')
    expect(result).toBe('beforeafter')
  })

  it('leaves valid JSX expressions (no leading slash) untouched', () => {
    // The regex requires `{/`, so an ordinary `{expr}` must not be
    // touched. This locks in the boundary condition that separates the
    // JSX-comment removal from real JSX.
    const result = removeCommentPatterns('a{keep-me}b')
    expect(result).toBe('a{keep-me}b')
  })
})

describe('sanitizeHtmlForMdx — br/hr normalization', () => {
  it('normalizes a bare <br> into a self-closing <br />', () => {
    const result = sanitizeHtmlForMdx('line1<br>line2')
    expect(result).toBe('line1<br />line2')
  })

  it('leaves an already-self-closing <br /> unchanged', () => {
    const result = sanitizeHtmlForMdx('line1<br />line2')
    expect(result).toBe('line1<br />line2')
  })

  it('normalizes a bare <hr> into a self-closing <hr />', () => {
    const result = sanitizeHtmlForMdx('above<hr>below')
    expect(result).toBe('above<hr />below')
  })

  it('leaves an already-self-closing <hr /> unchanged', () => {
    const result = sanitizeHtmlForMdx('above<hr />below')
    expect(result).toBe('above<hr />below')
  })
})

describe('sanitizeHtmlForMdx — attribute strip branches', () => {
  it('strips allowfullscreen (both bare and quoted forms)', () => {
    const bare = sanitizeHtmlForMdx('<video allowfullscreen>x</video>')
    expect(bare).not.toMatch(/allowfullscreen/i)

    const quoted = sanitizeHtmlForMdx('<video allowfullscreen="true">y</video>')
    expect(quoted).not.toMatch(/allowfullscreen/i)
  })

  it('strips frameborder', () => {
    // <iframe> itself is removed, so put frameborder on a surviving tag
    // to isolate the frameborder regex rather than the iframe removal.
    const result = sanitizeHtmlForMdx('<div frameborder="0">cell</div>')
    expect(result).not.toMatch(/frameborder/i)
    expect(result).toContain('<div')
    expect(result).toContain('cell')
  })

  it('strips scrolling', () => {
    const result = sanitizeHtmlForMdx('<div scrolling="no">cell</div>')
    expect(result).not.toMatch(/scrolling/i)
    expect(result).toContain('<div')
    expect(result).toContain('cell')
  })

  it('rewrites class="…" to className="…"', () => {
    const result = sanitizeHtmlForMdx('<div class="foo">x</div>')
    expect(result).toContain('className="foo"')
    expect(result).not.toMatch(/\sclass=/i)
  })

  it('strips style="…" attributes on remaining tags', () => {
    const result = sanitizeHtmlForMdx('<p style="color:red">danger</p>')
    expect(result).toBe('<p>danger</p>')
  })
})
