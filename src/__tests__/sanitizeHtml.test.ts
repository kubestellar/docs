/**
 * Unit tests for `src/lib/sanitizeHtml.ts` — the primary XSS-defense module
 * used to sanitize user-supplied MDX before rendering.
 *
 * Focus: behavioral guarantees documented by comments in the source module —
 * multi-character bypass resistance, spacer-attack resistance, contributor
 * table conversion, iframe/script/style/inline-handler stripping, and the
 * various tag-normalization passes at the tail of sanitizeHtmlForMdx.
 */
import { describe, it, expect } from 'vitest'
import {
  stripUntilStable,
  removeCommentPatterns,
  sanitizeHtmlForMdx,
} from '@/lib/sanitizeHtml'

describe('stripUntilStable', () => {
  it('returns input unchanged when the pattern does not match', () => {
    expect(stripUntilStable('hello world', /xyz/g)).toBe('hello world')
  })

  it('removes all matches in a single call when they are independent', () => {
    expect(stripUntilStable('a-b-c-d', /-/g)).toBe('abcd')
  })

  it('loops until stable to catch multi-character bypass (interleaved pattern)', () => {
    // <scr<script>ipt> collapses to <script> after one pass; loop catches it.
    const out = stripUntilStable('<scr<script>ipt>', /<script>/g)
    expect(out).toBe('')
  })
})

describe('removeCommentPatterns', () => {
  it('removes complete HTML comments', () => {
    expect(removeCommentPatterns('foo<!-- hi -->bar')).toBe('foobar')
  })

  it('removes unclosed HTML comments (residual opener)', () => {
    expect(removeCommentPatterns('foo<!-- no close')).toBe('foo')
  })

  it('removes nested/spacer HTML comments across passes', () => {
    // The pair-pass strips <!-- a -->; the opener-pass strips the leftover.
    expect(removeCommentPatterns('x<!-- a --><!-- b y')).toBe('x')
  })

  it('removes Jinja-style comments', () => {
    expect(removeCommentPatterns('a{# hidden #}b')).toBe('ab')
  })

  it('removes JSX-style invalid comments {/ ... /}', () => {
    expect(removeCommentPatterns('a{/ block /}b')).toBe('ab')
  })

  it('leaves non-comment text alone', () => {
    expect(removeCommentPatterns('plain markdown text')).toBe('plain markdown text')
  })
})

describe('sanitizeHtmlForMdx — dangerous tag stripping', () => {
  it('strips a complete <script> pair', () => {
    const out = sanitizeHtmlForMdx('safe <script>alert(1)</script> tail')
    expect(out).not.toMatch(/script/i)
    expect(out).toMatch(/safe/)
    expect(out).toMatch(/tail/)
  })

  it('strips a lone <script> opener with no close', () => {
    const out = sanitizeHtmlForMdx('before <script type="x"> after')
    expect(out).not.toMatch(/<script/i)
  })

  it('strips a partial <script> opener with no closing bracket at all', () => {
    // Regression guard for the `partialRe` pass — an <script attribute never
    // completed with `>` still gets removed.
    const out = sanitizeHtmlForMdx('a <script type="tex')
    expect(out).not.toMatch(/<script/i)
  })

  it('strips <style> tags', () => {
    const out = sanitizeHtmlForMdx('<style>body{}</style>ok')
    expect(out).toContain('ok')
    expect(out).not.toMatch(/<style/i)
  })

  it('strips self-closing <iframe /> and full <iframe>…</iframe>', () => {
    expect(sanitizeHtmlForMdx('a<iframe src="x" />b')).toBe('ab')
    expect(sanitizeHtmlForMdx('a<iframe>content</iframe>b')).toBe('ab')
  })

  it('resists spacer bypass: <sty<script>…</script>le> → <style> → stripped', () => {
    // The single-outer-loop guarantee from stripDangerousPatterns() means the
    // reconstituted <style> is caught on the next iteration.
    const out = sanitizeHtmlForMdx('<sty<script>x</script>le>body{}</style>')
    expect(out).not.toMatch(/<style/i)
    expect(out).not.toMatch(/<script/i)
  })

  it('resists opener spacer: o<script>…</script>nclick="x" → onclick removed', () => {
    // Same guarantee applied to inline event handlers.
    const out = sanitizeHtmlForMdx('<a href="#" o<script>x</script>nclick="bad()">link</a>')
    expect(out).not.toMatch(/onclick/i)
    expect(out).not.toMatch(/<script/i)
  })

  it('strips inline on* event handlers with and without quotes', () => {
    const out = sanitizeHtmlForMdx('<div onclick="alert(1)" onmouseover=alert onload>hi</div>')
    expect(out).not.toMatch(/onclick|onmouseover|onload/i)
    expect(out).toContain('hi')
  })
})

describe('sanitizeHtmlForMdx — contributors table conversion', () => {
  it('converts a well-formed contributors <table> to a contributors-grid', () => {
    const html = `<table><tr>
<td align="center"><a href="https://github.com/octocat"><img src="https://avatars/octocat.png" width="80"/><br /><sub><b>Octo Cat</b></sub></a></td>
</tr></table>`
    const out = sanitizeHtmlForMdx(html)
    expect(out).toContain('contributors-grid')
    expect(out).toContain('contributor-card')
    expect(out).toContain('https://github.com/octocat')
    expect(out).toContain('Octo Cat')
  })

  it('drops a table with no matching <td> contributor cells (returns empty)', () => {
    // The `contributors.length === 0` branch — table exists but has no
    // recognisable contributor cell shape.
    const html = '<table><tr><td>just text, no anchor</td></tr></table>'
    const out = sanitizeHtmlForMdx(html)
    expect(out).not.toContain('contributors-grid')
    expect(out).not.toContain('<table')
  })

  it('escapes angle brackets and quotes in contributor name/avatar/profile', () => {
    // Ensures escapeAngle() runs on all three fields.
    const html = `<table><tr>
<td><a href="https://github.com/&lt;/a&gt;"><img src="https://a/&quot;.png"/><br /><sub><b>Name&amp;Co</b></sub></a></td>
</tr></table>`
    const out = sanitizeHtmlForMdx(html)
    // The `<` in the profileUrl came from &lt; in HTML source; when re-emitted
    // it must be re-escaped to &lt; in the output attribute.
    expect(out).not.toMatch(/href="https:\/\/github\.com\/</)
  })
})

describe('sanitizeHtmlForMdx — img normalization', () => {
  it('drops <img> tags with no src attribute', () => {
    const out = sanitizeHtmlForMdx('before <img alt="oops" /> after')
    expect(out).not.toMatch(/<img/)
    expect(out).toContain('before')
    expect(out).toContain('after')
  })

  it('normalizes <img src alt> pair and preserves title when present', () => {
    const out = sanitizeHtmlForMdx('<img src="/a.png" alt="A" title="T">')
    expect(out).toContain('src="/a.png"')
    expect(out).toContain('alt="A"')
    expect(out).toContain('title="T"')
    expect(out).toMatch(/\/>\s*$/)
  })

  it('emits empty alt="" when alt attribute is absent', () => {
    const out = sanitizeHtmlForMdx('<img src="/a.png">')
    expect(out).toContain('alt=""')
  })
})

describe('sanitizeHtmlForMdx — normalization tail', () => {
  it('normalizes <br> and <br/> to <br />', () => {
    expect(sanitizeHtmlForMdx('a<br>b<br/>c')).toBe('a<br />b<br />c')
  })

  it('normalizes <hr> and <hr/> to <hr />', () => {
    expect(sanitizeHtmlForMdx('<hr><hr/>')).toBe('<hr /><hr />')
  })

  it('strips align/width/height/frameborder/scrolling/allowfullscreen attrs', () => {
    const out = sanitizeHtmlForMdx(
      '<div align="left" width="10" height=20 frameborder="0" scrolling=no allowfullscreen>x</div>',
    )
    expect(out).not.toMatch(/align|width|height|frameborder|scrolling|allowfullscreen/i)
    expect(out).toContain('x')
  })

  it('renames class= to className=', () => {
    const out = sanitizeHtmlForMdx('<div class="foo">x</div>')
    expect(out).toContain('className="foo"')
    expect(out).not.toMatch(/\sclass=/)
  })

  it('strips inline style attributes', () => {
    const out = sanitizeHtmlForMdx('<div style="color:red">x</div>')
    expect(out).not.toMatch(/style=/i)
    expect(out).toContain('x')
  })

  it('strips <meta>, <link>, <base>', () => {
    const out = sanitizeHtmlForMdx('<meta charset="x"><link rel="y"/><base href="/">z')
    expect(out).toBe('z')
  })

  it('strips CDATA, processing instructions, and DOCTYPE declarations', () => {
    const out = sanitizeHtmlForMdx(
      '<!DOCTYPE html><![CDATA[data]]><?xml version="1.0"?>OK',
    )
    expect(out.trim()).toBe('OK')
  })

  it('unwraps <sub> and </sub> tags (leaves inner content)', () => {
    const out = sanitizeHtmlForMdx('a<sub>x</sub>b')
    expect(out).toBe('axb')
  })

  it('strips null bytes and C0 control characters (preserves \\t\\n\\r)', () => {
    const out = sanitizeHtmlForMdx('a\x00b\x01c\td\ne')
    expect(out).toBe('abc\td\ne')
  })

  it('is idempotent — sanitizing already-sanitized output is a fixed point', () => {
    const dirty = '<script>x</script><div onclick="a">hi<br></div>'
    const once = sanitizeHtmlForMdx(dirty)
    const twice = sanitizeHtmlForMdx(once)
    expect(twice).toBe(once)
  })
})
