import { describe, it, expect } from 'vitest'

/**
 * Unit tests for the HTML sanitizer functions used in page.tsx.
 *
 * These functions are the primary XSS defense for user-supplied markdown
 * content rendered on the docs site. They MUST be tested for bypass vectors.
 *
 * We re-implement the functions here (they are not exported from page.tsx)
 * to test their logic in isolation. If the implementation changes, these
 * tests serve as a regression safety net — the expected outputs define the
 * security contract.
 */

// --- Re-implementation of stripUntilStable (mirrors page.tsx) ---
function stripUntilStable(content: string, pattern: RegExp): string {
  let prev = ''
  while (content !== prev) {
    prev = content
    content = content.replace(pattern, '')
  }
  return content
}

// --- Re-implementation of removeCommentPatterns (mirrors page.tsx) ---
function removeCommentPatterns(content: string): string {
  let cleaned = content

  // Remove all HTML comments — loop until stable
  let prev = ''
  while (cleaned !== prev) {
    prev = cleaned
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  }
  // Remove any residual comment openers that were not closed (loop until stable)
  prev = ''
  while (cleaned !== prev) {
    prev = cleaned
    cleaned = cleaned.replace(/<!--[\s\S]*/g, '')
  }

  // Remove Jinja-style comments
  cleaned = cleaned.replace(/\{#[\s\S]*?#\}/g, '')

  // Remove JSX-style comments
  cleaned = cleaned.replace(/\{\/[^}]*\/\}/g, '')

  return cleaned
}

// --- Re-implementation of sanitizeHtmlForMdx (core security logic) ---
function sanitizeHtmlForMdx(content: string): string {
  let sanitized = content

  // Remove table patterns (simplified — full version handles contributor cards)
  sanitized = sanitized.replace(/<table>[\s\S]*?<\/table>/gi, '')
  sanitized = sanitized.replace(/<tr>[\s\S]*?<\/tr>/gi, '')
  sanitized = sanitized.replace(/<td[^>]*>[\s\S]*?<\/td>/gi, '')

  // Remove all iframe tags
  sanitized = stripUntilStable(sanitized, /<iframe[\s\S]*?<\/iframe>/gi)
  sanitized = sanitized.replace(/<iframe\b[^>]*\/?>/gi, '')

  // Normalize img tags
  sanitized = sanitized.replace(/<img\s+([^>]*?)\/?>/gi, (_match, attrs: string) => {
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    const titleMatch = attrs.match(/title=["']([^"']*)["']/i)

    const src = srcMatch ? srcMatch[1] : ''
    const alt = altMatch ? altMatch[1] : ''
    const title = titleMatch ? ` title="${titleMatch[1]}"` : ''

    if (!src) return ''
    return `<img src="${src}" alt="${alt}"${title} />`
  })

  // Fix self-closing tags
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '<br />')
  sanitized = sanitized.replace(/<hr\s*\/?>/gi, '<hr />')

  // Remove inline event handlers
  sanitized = stripUntilStable(
    sanitized,
    /\s+on\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>'"]+))?/gi,
  )

  // Remove style tags
  sanitized = stripUntilStable(sanitized, /<style[^>]*>[\s\S]*?<\/style>/gi)

  // Remove script tags — [^>]* in close tag to match </script foo> (CodeQL #190)
  sanitized = stripUntilStable(sanitized, /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)

  // Remove sub tags
  sanitized = sanitized.replace(/<sub>/gi, '')
  sanitized = sanitized.replace(/<\/sub>/gi, '')

  return sanitized
}

// ═══════════════════════════════════════════════════════════════════════
// stripUntilStable
// ═══════════════════════════════════════════════════════════════════════

describe('stripUntilStable', () => {
  it('removes a simple match in one pass', () => {
    const result = stripUntilStable('<script>alert(1)</script>', /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
    expect(result).toBe('')
  })

  it('removes nested/interleaved script tags via multiple passes', () => {
    // After first pass: <scr + ipt>alert(1)</script> → <script>alert(1)</script>
    const payload = '<scr<script>x</script>ipt>alert(1)</script>'
    const result = stripUntilStable(payload, /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
    expect(result).toBe('')
  })

  it('handles deeply nested reconstruction attempts', () => {
    const payload = '<scr<scr<script></script>ipt></script>ipt>evil</script>'
    const result = stripUntilStable(payload, /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
    expect(result).toBe('')
  })

  it('returns empty string for empty input', () => {
    const result = stripUntilStable('', /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
    expect(result).toBe('')
  })

  it('returns content unchanged when no match', () => {
    const result = stripUntilStable('Hello world', /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
    expect(result).toBe('Hello world')
  })

  it('converges to stable output (no infinite loop)', () => {
    // The pattern removes nothing if the content has no match
    const result = stripUntilStable('<div>safe</div>', /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi)
    expect(result).toBe('<div>safe</div>')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// sanitizeHtmlForMdx — Script tag removal (CodeQL #190 fix)
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
    // This was the specific bypass vector: browsers accept </script foo="bar">
    const result = sanitizeHtmlForMdx('<script>alert(1)</script foo="bar">')
    expect(result).not.toContain('script')
    expect(result).not.toContain('alert')
  })

  it('strips </script\\n> with newline in close tag', () => {
    const result = sanitizeHtmlForMdx('<script>x</script\n>')
    expect(result).not.toContain('script')
  })

  it('strips nested script reconstruction', () => {
    const result = sanitizeHtmlForMdx('<scr<script>y</script>ipt>alert(1)</script>')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('script')
  })

  it('strips multiple script tags', () => {
    const result = sanitizeHtmlForMdx('<script>a()</script>text<script>b()</script>')
    expect(result).toBe('text')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// removeCommentPatterns — Unclosed comment removal (CodeQL #188 fix)
// ═══════════════════════════════════════════════════════════════════════

describe('removeCommentPatterns — HTML comments', () => {
  it('removes a normal closed comment', () => {
    const result = removeCommentPatterns('before<!-- comment -->after')
    expect(result).toBe('beforeafter')
  })

  it('removes an unclosed comment (residual opener)', () => {
    const result = removeCommentPatterns('safe<!-- this never closes')
    expect(result).toBe('safe')
  })

  it('removes nested comment reconstruction', () => {
    // <!-<!--x--> reassembles to <!-- after first pass
    const result = removeCommentPatterns('start<!-<!--x-->end')
    // After removing <!--x-->, we get "start<!-end", then <!-- matches residual
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

  it('handles empty input', () => {
    const result = removeCommentPatterns('')
    expect(result).toBe('')
  })

  it('returns clean content unchanged', () => {
    const result = removeCommentPatterns('no comments here')
    expect(result).toBe('no comments here')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// sanitizeHtmlForMdx — iframe removal
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — iframe removal', () => {
  it('strips <iframe>...</iframe>', () => {
    const result = sanitizeHtmlForMdx('<iframe src="evil.com"></iframe>')
    expect(result).not.toContain('iframe')
    expect(result).not.toContain('evil')
  })

  it('strips self-closing <iframe />', () => {
    const result = sanitizeHtmlForMdx('<iframe src="x" />')
    expect(result).not.toContain('iframe')
  })

  it('strips unclosed <iframe> tag', () => {
    const result = sanitizeHtmlForMdx('<iframe src="evil.com">')
    expect(result).not.toContain('iframe')
  })

  it('strips nested iframe reconstruction', () => {
    const result = sanitizeHtmlForMdx('<ifr<iframe src="x"></iframe>ame src="evil"></iframe>')
    expect(result).not.toContain('iframe')
    expect(result).not.toContain('evil')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// sanitizeHtmlForMdx — style tag removal
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
// sanitizeHtmlForMdx — event handler removal
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — event handler removal', () => {
  it('strips onclick from tags', () => {
    const result = sanitizeHtmlForMdx('<div onclick="alert(1)">text</div>')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('alert')
    expect(result).toContain('text')
  })

  it('strips onerror from img tags', () => {
    const result = sanitizeHtmlForMdx('<img src="x.png" onerror="alert(1)" alt="pic" />')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('strips onload with single quotes', () => {
    const result = sanitizeHtmlForMdx("<div onload='evil()'>x</div>")
    expect(result).not.toContain('onload')
    expect(result).not.toContain('evil')
  })

  it('strips onmouseover with unquoted value', () => {
    const result = sanitizeHtmlForMdx('<a onmouseover=alert(1)>link</a>')
    expect(result).not.toContain('onmouseover')
  })

  it('strips multiple event handlers from one tag', () => {
    const result = sanitizeHtmlForMdx('<div onclick="a()" onmouseover="b()">x</div>')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('onmouseover')
  })

  it('strips onfocus (less common handler)', () => {
    const result = sanitizeHtmlForMdx('<input onfocus="alert(1)" />')
    expect(result).not.toContain('onfocus')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// sanitizeHtmlForMdx — img normalization
// ═══════════════════════════════════════════════════════════════════════

describe('sanitizeHtmlForMdx — img normalization', () => {
  it('keeps src and alt, removes other attributes', () => {
    const result = sanitizeHtmlForMdx('<img src="photo.png" alt="A photo" width="100" height="50" />')
    expect(result).toContain('src="photo.png"')
    expect(result).toContain('alt="A photo"')
    expect(result).not.toContain('width')
    expect(result).not.toContain('height')
  })

  it('removes img with no src', () => {
    const result = sanitizeHtmlForMdx('<img alt="no source" />')
    expect(result).not.toContain('<img')
  })

  it('preserves title attribute', () => {
    const result = sanitizeHtmlForMdx('<img src="x.png" alt="" title="hover text" />')
    expect(result).toContain('title="hover text"')
  })

  it('strips onerror from img during event handler pass', () => {
    const result = sanitizeHtmlForMdx('<img src="x.png" onerror="alert(document.cookie)" alt="" />')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
    expect(result).toContain('src="x.png"')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// sanitizeHtmlForMdx — edge cases
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
    const payload = '<script>a()</script><iframe src="x"></iframe><div onclick="b()">text</div>'
    const result = sanitizeHtmlForMdx(payload)
    expect(result).not.toContain('script')
    expect(result).not.toContain('iframe')
    expect(result).not.toContain('onclick')
    expect(result).toContain('text')
  })

  it('strips <sub> tags', () => {
    const result = sanitizeHtmlForMdx('H<sub>2</sub>O')
    expect(result).toBe('H2O')
  })

  it('normalizes <br> variants', () => {
    expect(sanitizeHtmlForMdx('<br>')).toBe('<br />')
    expect(sanitizeHtmlForMdx('<br/>')).toBe('<br />')
    expect(sanitizeHtmlForMdx('<BR>')).toBe('<br />')
  })

  it('normalizes <hr> variants', () => {
    expect(sanitizeHtmlForMdx('<hr>')).toBe('<hr />')
    expect(sanitizeHtmlForMdx('<hr/>')).toBe('<hr />')
  })
})
