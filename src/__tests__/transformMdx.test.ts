import { describe, expect, it } from 'vitest'
import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

describe('convertHtmlScriptsToJsxComments sanitization', () => {
  it('removes reconstructed nested script tags', () => {
    const input =
      '<div><scr<script></script>ipt>alert(1)</scr<script></script>ipt></div>'
    const output = convertHtmlScriptsToJsxComments(input)

    expect(output).not.toContain('<script')
    expect(output).not.toContain('alert(1)')
  })

  it('removes reconstructed nested style tags', () => {
    const input =
      '<div><st<style></style>yle>body{color:red}</st<style></style>yle></div>'
    const output = convertHtmlScriptsToJsxComments(input)

    expect(output).not.toContain('<style')
    expect(output).not.toContain('color:red')
  })

  it('removes event handler attributes reconstructed after script stripping', () => {
    const input = '<img src=x onlo<script></script>ad="alert(1)">'
    const output = convertHtmlScriptsToJsxComments(input)

    expect(output).not.toContain('onload=')
    expect(output).toContain('src="x"')
  })
})
