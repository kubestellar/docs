import { describe, it, expect } from 'vitest'
import { sanitizeHtmlForMdx, removeCommentPatterns } from '../lib/sanitizeHtmlForMdx'

/**
 * Unit tests for the exported sanitizeHtmlForMdx() function.
 *
 * This function is the primary XSS defense for user-supplied markdown
 * content rendered on the docs site. It MUST be tested for bypass vectors.
 *
 * Tests cover:
 * - Script tag removal (CodeQL #190: attribute-bearing close tags)
 * - Unclosed comment loop (CodeQL #188: incomplete multi-char sanitization)
 * - Style/meta/link/base/iframe removal
 * - Null byte and control character stripping
 * - CDATA/processing instruction/DOCTYPE removal
 * - Nested tag reconstruction bypass prevention (stripUntilStable)
 */

// ═══════════════════════════════════════════════════════════════════════
// Script tag removal (CodeQL #190: js/bad-tag-filter)
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — script removal', () => {
  it('strips basic <script>...</script>', () => {
    const result = sanitizeHtmlForMdx('<p>Hello</p><script>alert(1)</script><p>World</p>')
    expect(result).toContain('<p>Hello</p>')
    expect(result).toContain('<p>World</p>')
    expect(result).not.toContain('script')
    expect(result).not.toContain('alert')
  })

  it('strips script with attributes', () => {
    const result = sanitizeHtmlForMdx('<script type="text/javascript" src="evil.js"></script>')
    expect(result).not.toContain('script')
    expect(result).not.toContain('evil')
  })

  it('strips </script > with trailing whitespace in close tag', () => {
    const result = sanitizeHtmlForMdx('<script>x</script >')
    expect(result).not.toContain('script')
  })

  it('strips </script/foo> attribute-bearing close tag (CodeQL #190 bypass)', () => {
    // This is the specific bypass: browsers accept </script foo="bar">
    const result = sanitizeHtmlForMdx('<script>alert(1)</script foo="bar">')
    expect(result).not.toContain('script')
    expect(result).not.toContain('alert')
  })

  it('strips </script\\n> with newline in close tag', () => {
    const result = sanitizeHtmlForMdx('<script>x</script\n>')
    expect(result).not.toContain('script')
  })

  it('strips nested script reconstruction (stripUntilStable)', () => {
    const result = sanitizeHtmlForMdx('<scr<script>y</script>ipt>alert(1)</script>')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('script')
  })

  it('strips deeply nested reconstruction', () => {
    const result = sanitizeHtmlForMdx('<scr<scr<script></script>ipt></script>ipt>evil</script>')
    expect(result).not.toContain('evil')
    expect(result).not.toContain('script')
  })

  it('strips multiple script tags', () => {
    const result = sanitizeHtmlForMdx('<script>a()</script>text<script>b()</script>')
    expect(result).toBe('text')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Comment removal (CodeQL #188: incomplete multi-character sanitization)
// ═══════════════════════════════════════════════════════════════════════

describe('removeCommentPatterns — comment removal', () => {
  it('removes a normal closed comment', () => {
    const result = removeCommentPatterns('before<!-- comment -->after')
    expect(result).toBe('beforeafter')
  })

  it('removes an unclosed comment (residual opener) via loop', () => {
    const result = removeCommentPatterns('safe<!-- this never closes')
    expect(result).toBe('safe')
  })

  it('removes nested comment reconstruction', () => {
    // After removing <!--x-->, "<!-" remains; loop should catch residual opener
    const result = removeCommentPatterns('start<!-<!--x-->end')
    expect(result).not.toContain('<!--')
  })

  it('removes multiple comments', () => {
    const result = removeCommentPatterns('a<!-- one -->b<!-- two -->c')
    expect(result).toBe('abc')
  })

  it('removes multiline comments', () => {
    const result = removeCommentPatterns('before<!--\nmultiline\ncomment\n-->after')
    expect(result).toBe('beforeafter')
  })

  it('removes Jinja-style comments', () => {
    const result = removeCommentPatterns('text{# jinja comment #}more')
    expect(result).toBe('textmore')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Style tag removal
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — style removal', () => {
  it('strips <style>...</style>', () => {
    const result = sanitizeHtmlForMdx('<style>body{display:none}</style><p>text</p>')
    expect(result).not.toContain('style')
    expect(result).toContain('<p>text</p>')
  })

  it('strips nested style reconstruction', () => {
    const result = sanitizeHtmlForMdx('<sty<style>x</style>le>.evil{}</style>')
    expect(result).not.toContain('style')
    expect(result).not.toContain('.evil')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Null bytes and control characters
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — control character removal', () => {
  it('strips null bytes', () => {
    const result = sanitizeHtmlForMdx('he\x00llo')
    expect(result).toBe('hello')
  })

  it('strips control characters but preserves whitespace', () => {
    const result = sanitizeHtmlForMdx('line1\n\tline2\x01\x02')
    expect(result).toBe('line1\n\tline2')
  })

  it('strips DEL character (0x7F)', () => {
    const result = sanitizeHtmlForMdx('test\x7Fvalue')
    expect(result).toBe('testvalue')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CDATA, processing instructions, DOCTYPE
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — structural HTML removal', () => {
  it('strips CDATA sections', () => {
    const result = sanitizeHtmlForMdx('before<![CDATA[malicious content]]>after')
    expect(result).toBe('beforeafter')
  })

  it('strips processing instructions', () => {
    const result = sanitizeHtmlForMdx('before<?xml version="1.0"?>after')
    expect(result).toBe('beforeafter')
  })

  it('strips DOCTYPE declarations', () => {
    const result = sanitizeHtmlForMdx('<!DOCTYPE html><p>content</p>')
    expect(result).toContain('<p>content</p>')
    expect(result).not.toContain('DOCTYPE')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Meta, link, base tag removal
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — dangerous tag removal', () => {
  it('strips <meta> tags', () => {
    const result = sanitizeHtmlForMdx('<meta http-equiv="refresh" content="0;url=evil.com"><p>safe</p>')
    expect(result).not.toContain('meta')
    expect(result).toContain('<p>safe</p>')
  })

  it('strips <link> tags', () => {
    const result = sanitizeHtmlForMdx('<link rel="stylesheet" href="evil.css"><p>safe</p>')
    expect(result).not.toContain('link')
    expect(result).toContain('<p>safe</p>')
  })

  it('strips <base> tags', () => {
    const result = sanitizeHtmlForMdx('<base href="https://evil.com/"><a href="/login">Click</a>')
    expect(result).not.toContain('base')
    expect(result).toContain('<a href="/login">Click</a>')
  })

  it('strips <sub> tags (content preserved)', () => {
    const result = sanitizeHtmlForMdx('H<sub>2</sub>O')
    expect(result).toBe('H2O')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — edge cases', () => {
  it('handles empty input', () => {
    expect(sanitizeHtmlForMdx('')).toBe('')
  })

  it('passes through clean markdown-like content', () => {
    const clean = '# Hello\n\nThis is **bold** and *italic* text.\n\n- item 1\n- item 2'
    expect(sanitizeHtmlForMdx(clean)).toBe(clean)
  })

  it('handles mixed attack vectors in one payload', () => {
    // Mirrors the buildContent pipeline: removeCommentPatterns → sanitizeHtmlForMdx
    const payload = '<script>a()</script><!-- hidden --><style>.x{}</style><meta charset="utf-8">safe'
    const result = sanitizeHtmlForMdx(removeCommentPatterns(payload))
    expect(result).not.toContain('script')
    expect(result).not.toContain('<!--')
    expect(result).not.toContain('style')
    expect(result).not.toContain('meta')
    expect(result).toContain('safe')
  })

  it('preserves safe HTML tags', () => {
    const safe = '<p>paragraph</p><div>block</div><strong>bold</strong>'
    const result = sanitizeHtmlForMdx(safe)
    expect(result).toContain('<p>paragraph</p>')
    expect(result).toContain('<div>block</div>')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('handles very long content without hanging (performance)', () => {
    const longContent = '<p>safe</p>'.repeat(1000)
    const start = Date.now()
    const result = sanitizeHtmlForMdx(longContent)
    const elapsed = Date.now() - start
    expect(result).toContain('<p>safe</p>')
    expect(elapsed).toBeLessThan(5000) // Should complete in under 5s
  })
})
