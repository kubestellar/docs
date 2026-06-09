import { describe, it, expect } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

describe('convertHtmlScriptsToJsxComments', () => {
  describe('script tag stripping', () => {
    it('removes inline script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('removes self-closing script tags', () => {
      const input = '<p>Safe</p><script src="evil.js"/><p>Content</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('evil.js')
    })

    it('prevents nested-tag bypass (CWE-116)', () => {
      // Crafted input where removing inner <script> reconstitutes outer
      const input = '<scr<script>ipt>alert("xss")</scr</script>ipt>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert')
    })

    it('removes script tags with attributes', () => {
      const input = '<script type="text/javascript" async>code()</script>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('code()')
    })
  })

  describe('style tag stripping', () => {
    it('removes style blocks', () => {
      const input = '<style>.evil { display: none }</style><p>Content</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('<style')
      expect(result).not.toContain('.evil')
      expect(result).toContain('Content')
    })

    it('prevents nested style tag bypass', () => {
      const input = '<sty<style>le>.x{}</sty</style>le>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('<style')
    })
  })

  describe('event handler attribute removal', () => {
    it('removes onclick handler', () => {
      const input = '<div onclick="alert(1)">Click</div>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('alert')
      expect(result).toContain('Click')
    })

    it('removes onload handler', () => {
      const input = '<img src="x.png" onload="steal()" />'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('onload')
      expect(result).not.toContain('steal')
    })

    it('removes onerror handler with single quotes', () => {
      const input = "<img src=\"x\" onerror='hack()' />"
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('hack')
    })

    it('removes JSX-style event handlers', () => {
      const input = '<div onMouseOver={handleHover}>Hover</div>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('onMouseOver')
    })

    it('does not remove words starting with "on" in content', () => {
      const input = '<p>Once upon a time, only one remained</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('Once upon a time')
      expect(result).toContain('only one remained')
    })
  })

  describe('inline style attribute stripping', () => {
    it('removes style attribute with double quotes', () => {
      const input = '<div style="color: red">Text</div>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('style=')
      expect(result).not.toContain('color: red')
      expect(result).toContain('Text')
    })

    it('removes JSX-style object style attribute', () => {
      const input = '<div style={{color: "red"}}>Text</div>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('style=')
    })
  })

  describe('code fence preservation', () => {
    it('does not transform content inside triple backticks', () => {
      const input = '```\n<script>alert("safe")</script>\n```'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('<script>alert("safe")</script>')
    })

    it('does not transform content inside inline backticks', () => {
      const input = 'Use `<script>` tags for scripts'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('`<script>`')
    })

    it('does not transform content inside <pre> tags', () => {
      const input = '<pre><script>example()</script></pre>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('<script>example()</script>')
    })
  })

  describe('HTML comment conversion', () => {
    it('converts HTML comments to JSX comments', () => {
      const input = '<!-- This is a comment -->'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('{/*This is a comment*/}')
    })

    it('handles multi-line comments', () => {
      const input = '<!--\n  Multi-line\n  comment\n-->'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('{/*')
      expect(result).toContain('*/}')
      expect(result).not.toContain('<!--')
    })
  })

  describe('void element self-closing', () => {
    it('converts <br> to <br />', () => {
      const input = '<p>Line 1<br>Line 2</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('<br />')
      expect(result).not.toMatch(/<br>/)
    })

    it('converts <img> with attributes to self-closing', () => {
      const input = '<img src="photo.jpg" alt="Photo">'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('<img')
      expect(result).toContain('/>')
    })

    it('removes closing void tags like </br>', () => {
      const input = '<br></br>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('</br>')
    })
  })

  describe('JSX attribute conversion', () => {
    it('converts class to className', () => {
      const input = '<div class="container">Content</div>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('className="container"')
      expect(result).not.toMatch(/\bclass=/)
    })

    it('converts for to htmlFor', () => {
      const input = '<label for="email">Email</label>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('htmlFor="email"')
      expect(result).not.toMatch(/\bfor=/)
    })

    it('converts tabindex to tabIndex', () => {
      const input = '<div tabindex="0">Focusable</div>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('tabIndex')
    })
  })

  describe('template literal escaping', () => {
    it('strips Jinja2 {% %} blocks', () => {
      const input = '<p>{% if true %}show{% endif %}</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('{%')
      expect(result).not.toContain('%}')
    })

    it('strips Jinja2 {{ }} expressions', () => {
      const input = '<p>Hello {{ username }}</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).not.toContain('{{ username }}')
    })

    it('escapes remaining curly braces', () => {
      const input = '<p>Object: {key: value}</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('&#123;')
      expect(result).toContain('&#125;')
    })
  })

  describe('bare angle bracket escaping', () => {
    it('escapes < not followed by tag characters', () => {
      const input = '<p>x < y and y > z</p>'
      const result = convertHtmlScriptsToJsxComments(input)
      expect(result).toContain('&lt;')
    })
  })
})
