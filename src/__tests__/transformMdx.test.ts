import { describe, expect, it } from 'vitest'

import { convertHtmlScriptsToJsxComments } from '@/lib/transformMdx'

describe('convertHtmlScriptsToJsxComments', () => {
  it('removes event handlers that are revealed after an earlier event handler is stripped', () => {
    // `nerror` intentionally becomes `onerror` after `onclick="..."` is removed.
    const input = '<img o onclick="alert(1)"nerror="alert(2)" src=/logo.png>'

    expect(convertHtmlScriptsToJsxComments(input)).toBe('<img src="/logo.png" />')
  })

  it('removes event handlers that are revealed after style attributes are stripped', () => {
    // `nerror` intentionally becomes `onerror` after `style="..."` is removed.
    const input = '<img o style="color:red"nerror="alert(2)" src=/logo.png>'

    expect(convertHtmlScriptsToJsxComments(input)).toBe('<img src="/logo.png" />')
  })
})
