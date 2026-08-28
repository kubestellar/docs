import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

/**
 * transformMdx line 128 explicitly rewrites `<(` to `&lt;(`.
 *
 * Motivation: prose like "the operator <(x, y) returns…" would otherwise
 * make MDX attempt to parse `<(x, y)` as a JSX element and abort the whole
 * doc render. Guarding the rewrite catches an accidental regex-order swap
 * that would delete or corrupt this branch.
 */
describe('convertHtmlScriptsToJsxComments — <( escape (line 128)', () => {
  it('escapes a lone <( sequence in prose to &lt;(', () => {
    const out = convertHtmlScriptsToJsxComments('The syntax <(x, y) returns Ø.')
    expect(out).toContain('&lt;(x, y)')
    expect(out).not.toContain('<(')
  })

  it('escapes every <( occurrence in a paragraph', () => {
    const out = convertHtmlScriptsToJsxComments('op1 <(a,b); op2 <(c,d); op3 <(e,f).')
    expect(out).not.toContain('<(')
    // Every literal `(` still shows up after the escape.
    expect(out.match(/&lt;\(/g)).toHaveLength(3)
  })

  it('does not touch <letter or </letter sequences (regression guard)', () => {
    const out = convertHtmlScriptsToJsxComments('<div>ok</div> and <(x)')
    expect(out).toContain('<div>')
    expect(out).toContain('&lt;(x)')
  })
})
