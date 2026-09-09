/**
 * Targeted branch coverage for convertHtmlScriptsToJsxComments in
 * src/lib/transformMdx.ts. The existing suites
 * (transformMdx.test.ts, .escaped-bracket-fallback, .escaped-close,
 * .lt-paren, .tilde-fence-and-closer) exercise the primary paths
 * (class -> className, for -> htmlFor, script/style stripping, code
 * fence protection, void-element self-close) but leave several
 * per-attribute renamers and the HTML-entity variants of the Jinja2
 * `{% ... %}` stripper structurally untested.
 *
 * Each test targets one specific replace() call so a regression that
 * removes or narrows the pattern will fail exactly one assertion and
 * point at the offending line.
 */
import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments as t } from '@/lib/transformMdx'

describe('convertHtmlScriptsToJsxComments — attribute renames', () => {
  it('renames HTML frameborder to React frameBorder', () => {
    const out = t('<iframe src="x" frameborder="0"></iframe>')
    expect(out).toContain('frameBorder="0"')
    // The old spelling must be gone; React would warn on the raw HTML form.
    expect(out).not.toMatch(/\bframeborder\b/)
  })

  it('renames HTML allowfullscreen to React allowFullScreen', () => {
    // Boolean form (no `=`) — the attribute stays as a bare boolean prop.
    const out = t('<iframe src="x" allowfullscreen></iframe>')
    expect(out).toContain('allowFullScreen')
    expect(out).not.toMatch(/\ballowfullscreen\b/)
  })

  it('renames HTML tabindex to React tabIndex', () => {
    const out = t('<div tabindex="-1">focus me</div>')
    expect(out).toContain('tabIndex="-1"')
    expect(out).not.toMatch(/\btabindex\b/)
  })

  it('renames HTML crossorigin to React crossOrigin', () => {
    const out = t('<link rel="preload" href="/x" crossorigin="anonymous">')
    expect(out).toContain('crossOrigin="anonymous"')
    expect(out).not.toMatch(/\bcrossorigin\b/)
  })

  it('renames HTML srcset to React srcSet', () => {
    const out = t('<img src="a.png" srcset="a.png 1x, a@2x.png 2x">')
    expect(out).toContain('srcSet=')
    expect(out).not.toMatch(/\bsrcset\b/)
    // Also verify that the void <img> gets self-closed on the way out
    // — regressions in the void-element pass would strip this.
    expect(out).toMatch(/<img[^>]*\/>/)
  })

  it('renames HTML maxlength/minlength to React maxLength/minLength', () => {
    const out = t('<input type="text" maxlength="10" minlength="2">')
    expect(out).toContain('maxLength="10"')
    expect(out).toContain('minLength="2"')
    expect(out).not.toMatch(/\bmaxlength\b/)
    expect(out).not.toMatch(/\bminlength\b/)
  })
})

describe('convertHtmlScriptsToJsxComments — bare boolean media attributes', () => {
  // The final replace before <p>-wrapping normalises
  //   allowFullScreen|controls|loop|muted|autoPlay
  // to their bare boolean form, dropping any ="..." / ='...' / ={...} value.
  it('normalises controls="controls" to bare controls', () => {
    const out = t('<video src="x.mp4" controls="controls"></video>')
    expect(out).toContain('controls')
    expect(out).not.toContain('controls="controls"')
  })

  it('normalises loop="true" to bare loop', () => {
    const out = t('<video src="x.mp4" loop="true"></video>')
    expect(out).toMatch(/\bloop\b/)
    expect(out).not.toContain('loop="true"')
  })

  it('normalises muted={true} JSX-expression form to bare muted', () => {
    const out = t('<video src="x.mp4" muted={true}></video>')
    expect(out).toMatch(/\bmuted\b/)
    expect(out).not.toContain('muted={true}')
  })

  it('normalises autoPlay="autoplay" to bare autoPlay', () => {
    // Note: input is already the camelCased React name; the rename step
    // only rewrites lowercase HTML forms. This exercises the *value
    // stripping* branch of the media-attribute regex specifically.
    const out = t('<video src="x.mp4" autoPlay="autoplay"></video>')
    expect(out).toContain('autoPlay')
    expect(out).not.toContain('autoPlay="autoplay"')
  })
})

describe('convertHtmlScriptsToJsxComments — style stripper variants', () => {
  // Existing tests do not exercise all three style= forms distinctly,
  // and they must be applied in the JSX-double-brace -> JSX-brace ->
  // quoted order so that JSX object literals are handled cleanly and
  // don't leak into the Jinja {{ ... }} stripper.

  it('strips JSX double-brace style={{color:"red"}}', () => {
    const out = t('<div style={{color:"red"}}>x</div>')
    expect(out).not.toContain('style=')
    expect(out).toContain('>x</div>')
  })

  it('strips JSX single-brace style={someVar}', () => {
    const out = t('<div style={someVar}>x</div>')
    expect(out).not.toContain('style=')
  })

  it('strips quoted style="color:red"', () => {
    const out = t('<div style="color:red">x</div>')
    expect(out).not.toContain('style=')
  })

  it("strips single-quoted style='color:red'", () => {
    const out = t("<div style='color:red'>x</div>")
    expect(out).not.toContain('style=')
  })
})
