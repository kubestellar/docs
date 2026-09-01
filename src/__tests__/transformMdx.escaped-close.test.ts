import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

// Regression guard for the escaped-closing-tag path in transformMdx.ts.
//
// `</name\>` (backslash-escaped `>`) must be rewritten to `&lt;/name&gt;` so MDX does
// not try to parse it as a JSX closing element. That rewrite is done by the single
// `<([^>\s]+)\\>` branch, whose greedy character class also accepts a leading slash —
// there is deliberately no separate closing-tag branch, because it would be dead.
describe('convertHtmlScriptsToJsxComments — escaped closing tag', () => {
  it('escapes a backslash-terminated closing tag with no hyphen/underscore', () => {
    const input = '<p>keep</p></foo\\>tail'
    const result = convertHtmlScriptsToJsxComments(input)
    expect(result).toContain('&lt;/foo&gt;')
    expect(result).not.toContain('</foo\\>')
    expect(result).toContain('tail')
  })

  it('handles multiple escaped closing tags in the same input', () => {
    const input = '</alpha\\> and </beta\\>'
    const result = convertHtmlScriptsToJsxComments(input)
    expect(result).toContain('&lt;/alpha&gt;')
    expect(result).toContain('&lt;/beta&gt;')
  })

  // Differential guard. The two tests above pass under EITHER of these shapes:
  //
  //   one branch  : /<([^>\s]+)\\>/          <- what the code does
  //   two branches: /<([^/>\s][^>\s]*)\\>/ + /<\/([^>\s]+)\\>/
  //
  // so neither of them would notice the chain being "symmetrised" into two branches.
  // This input does notice: `</\>` has nothing between `</` and `\>`, so a
  // closing-only `[^>\s]+` cannot match it and an opening-only branch rejects the
  // leading slash — it would escape the pipeline unescaped. The single greedy branch
  // captures it as `/` and escapes it.
  it('escapes an empty-named escaped closing tag', () => {
    const result = convertHtmlScriptsToJsxComments('</\\>')
    expect(result).toBe('&lt;/&gt;')
    expect(result).not.toContain('</\\>')
  })
})
