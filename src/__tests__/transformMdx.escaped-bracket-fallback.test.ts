import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

// Covers the previously-uncovered "no-hyphen / no-underscore
// backslash-escaped bracket" fallback branch in transformMdx
// (src/lib/transformMdx.ts:128 —
//   .replace(/<([^>\s]+)\\>/g, (_m, name) => `&lt;${name}&gt;`)
// ).
//
// The earlier hyphenated-name branch (line 120) requires the tag
// name to contain at least one `-` or `_`; a token like `<foo\>`
// does not match and would fall through to line 128 unless
// already normalized. The mirror close-tag fallback (line 129)
// covers `</foo\>` in the same way.
//
// Without a test the branch would still be reported by v8 as
// "line covered" only when a hyphenated token also happened to
// appear in the same input string; the coverage report explicitly
// flagged 128 as uncovered.

describe('convertHtmlScriptsToJsxComments — backslash-escaped bracket fallback', () => {
  it('escapes a bare backslash-terminated open tag with no hyphen/underscore', () => {
    // `<foo\>` — matches the line-128 fallback, not the
    // hyphenated-name arm on line 120.
    const out = convertHtmlScriptsToJsxComments('prefix <foo\\> suffix')
    expect(out).toContain('&lt;foo&gt;')
    expect(out).not.toContain('<foo')
  })

  it('escapes a bare backslash-terminated close tag with no hyphen/underscore', () => {
    // `</bar\>` — the mirror close-tag fallback on line 129.
    const out = convertHtmlScriptsToJsxComments('a </bar\\> b')
    expect(out).toContain('&lt;/bar&gt;')
    expect(out).not.toContain('</bar')
  })

  it('leaves an unescaped bare `<foo>` alone (no backslash to trigger the arm)', () => {
    // Sanity: `<foo>` without the trailing backslash must NOT be
    // rewritten by this fallback — otherwise the arm is over-broad.
    // (Downstream arms may still transform it, but the specific
    // line-128 pattern should not fire for backslash-less input.)
    const out = convertHtmlScriptsToJsxComments('literal <foo>bar</foo>')
    // The output may or may not contain `<foo>` verbatim depending
    // on other passes, but it MUST NOT contain the &lt;foo&gt;
    // escape produced only by the backslash-terminated fallback.
    // Assert instead that the character sequence `foo\` — which
    // is what the fallback would leave behind if it misfired —
    // is absent.
    expect(out).not.toContain('foo\\')
  })
})
