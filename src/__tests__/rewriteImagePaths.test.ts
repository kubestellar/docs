import { describe, it, expect } from 'vitest'
import { rewriteRelativeImagePaths } from '@/lib/rewriteImagePaths'

describe('rewriteRelativeImagePaths', () => {
  it('rewrites a bare relative image path with a baseDir', () => {
    const md = '![Main Dashboard](images/main-dashboard.png)'
    expect(rewriteRelativeImagePaths(md, 'console')).toBe(
      '![Main Dashboard](/docs-images/console/images/main-dashboard.png)'
    )
  })

  it('rewrites a ./ relative image path', () => {
    const md = '![Figure 1 - High Level Architecture](./images/high-level-architecture.svg)'
    expect(rewriteRelativeImagePaths(md, 'kubestellar')).toBe(
      '![Figure 1 - High Level Architecture](/docs-images/kubestellar/images/high-level-architecture.svg)'
    )
  })

  it('rewrites multiple images in the same document', () => {
    const md = [
      '![Figure 1](./images/fig1.svg)',
      'Some text in between.',
      '![Figure 2](./images/fig2.svg)',
    ].join('\n')
    const result = rewriteRelativeImagePaths(md, 'kubestellar')
    expect(result).toContain('/docs-images/kubestellar/images/fig1.svg')
    expect(result).toContain('/docs-images/kubestellar/images/fig2.svg')
  })

  it('leaves absolute /docs-images paths untouched', () => {
    const md = '![Foo](/docs-images/console/images/foo.png)'
    expect(rewriteRelativeImagePaths(md, 'console')).toBe(md)
  })

  it('leaves https:// URLs untouched', () => {
    const md = '![Ext](https://example.com/img.png)'
    expect(rewriteRelativeImagePaths(md, 'console')).toBe(md)
  })

  it('leaves http:// URLs untouched', () => {
    const md = '![Ext](http://example.com/img.png)'
    expect(rewriteRelativeImagePaths(md, 'console')).toBe(md)
  })

  it('leaves data: URIs untouched', () => {
    const md = '![Inline](data:image/png;base64,abc123)'
    expect(rewriteRelativeImagePaths(md, 'console')).toBe(md)
  })

  it('leaves anchor-only hrefs untouched', () => {
    const md = '![link](#section)'
    expect(rewriteRelativeImagePaths(md, 'console')).toBe(md)
  })

  it('works with an empty baseDir (file at docs/content root)', () => {
    const md = '![Logo](images/logo.png)'
    expect(rewriteRelativeImagePaths(md, '')).toBe(
      '![Logo](/docs-images/images/logo.png)'
    )
  })

  it('handles subdirectory filePath in baseDir', () => {
    const md = '![Diagram](diagrams/overview.svg)'
    expect(rewriteRelativeImagePaths(md, 'kubestellar/setup')).toBe(
      '![Diagram](/docs-images/kubestellar/setup/diagrams/overview.svg)'
    )
  })

  it('does not double-rewrite already-absolute paths on a second pass', () => {
    const md = '![Foo](images/foo.png)'
    const once = rewriteRelativeImagePaths(md, 'console')
    const twice = rewriteRelativeImagePaths(once, 'console')
    expect(twice).toBe(once)
  })
})
