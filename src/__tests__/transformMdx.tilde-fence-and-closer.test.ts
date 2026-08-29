/**
 * Extra branch-coverage tests for convertHtmlScriptsToJsxComments.
 *
 * Two callbacks in this function were unreachable from the existing
 * transformMdx.*.test.ts suite:
 *
 *   1. The `~~~ ... ~~~` tilde-fence code-block preservation branch
 *      (parallel to the standard backtick-fence branch on the previous
 *      line). CommonMark allows tilde fences, and material generators
 *      still emit them, so a regression that swallows tildes would
 *      quietly HTML-escape their contents and break rendering.
 *
 *   2. The closing-tag self-escape variant `</foo\>`. The paired
 *      `<foo\>` opener case is already covered by
 *      transformMdx.escaped-close.test.ts, but the closing-tag branch
 *      of the same rewrite was unreached — meaning a rewrite that
 *      dropped or broke the closing-tag rule would slip through CI.
 */
import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

describe('convertHtmlScriptsToJsxComments — tilde-fenced code blocks', () => {
  it('preserves a ~~~ fenced block verbatim (does not HTML-escape its <> braces)', () => {
    const input =
      'Prose.\n\n~~~\n<script>alert("still ok inside fence")</script>\n~~~\n\nMore prose.'
    const out = convertHtmlScriptsToJsxComments(input)
    // The whole fence — including the raw <script>...</script> — must
    // pass through untouched because it's a code sample, not real markup.
    expect(out).toContain('~~~\n<script>alert("still ok inside fence")</script>\n~~~')
    // And it must not have been escaped or emptied.
    expect(out).not.toContain('&lt;script')
  })

  it('preserves a language-tagged tilde fence containing brace-heavy content', () => {
    // Brace stripping runs later; content inside the fence must survive it.
    const input = '~~~yaml\nkey: {{ template }}\n~~~'
    const out = convertHtmlScriptsToJsxComments(input)
    expect(out).toContain('~~~yaml\nkey: {{ template }}\n~~~')
    // Confirm the {{ }} were not rewritten to &#123;&#123; inside the fence.
    expect(out).not.toContain('&#123;&#123;')
  })

  it('preserves a tilde fence of 4+ tildes (CommonMark allows any run ≥3)', () => {
    const input = '~~~~\n<div>raw</div>\n~~~~'
    const out = convertHtmlScriptsToJsxComments(input)
    expect(out).toContain('~~~~\n<div>raw</div>\n~~~~')
  })

  it('still processes tags outside the tilde fence', () => {
    // Sanity: fence preserves; surrounding markup is still transformed.
    const input = '<my-tag>before</my-tag>\n~~~\n<my-tag>inside</my-tag>\n~~~\n<my-tag>after</my-tag>'
    const out = convertHtmlScriptsToJsxComments(input)
    // Custom tags outside the fence get escaped by the hyphenated-name rule.
    expect(out).toContain('&lt;my-tag&gt;before&lt;/my-tag&gt;')
    expect(out).toContain('&lt;my-tag&gt;after&lt;/my-tag&gt;')
    // But the same tag inside the fence survives raw.
    expect(out).toContain('~~~\n<my-tag>inside</my-tag>\n~~~')
  })
})

describe('convertHtmlScriptsToJsxComments — closing-tag backslash-close escape', () => {
  it('escapes a closing tag whose author self-closed with a trailing backslash: </foo\\>', () => {
    // MkDocs/mkdocs-material users sometimes escape a literal closing
    // bracket with a backslash to keep MDX from parsing the tag. The
    // opener rule (<foo\>) is already tested; this exercises the paired
    // closer rule so both branches of the pair are locked in.
    const input = '<div>foo</div\\>'
    const out = convertHtmlScriptsToJsxComments(input)
    // The malformed closer is rewritten to escaped text (no raw </div).
    expect(out).toMatch(/&lt;\/div&gt;/)
    expect(out).not.toContain('</div\\>')
  })

  it('handles a closing custom-element tag with backslash close', () => {
    const input = '</my-element\\>'
    const out = convertHtmlScriptsToJsxComments(input)
    expect(out).toContain('&lt;/my-element&gt;')
    expect(out).not.toContain('\\>')
  })
})
