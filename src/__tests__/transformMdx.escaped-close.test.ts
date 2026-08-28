import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

// Regression guard for the escaped-closing-tag branch at transformMdx.ts line
// 128 — `</name\>` (backslash-escaped `>`) must be rewritten to `&lt;/name&gt;`
// so MDX does not try to parse it as a JSX closing element.
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
})
