import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn().mockResolvedValue(undefined),
  },
}))

import { MermaidComponent } from '@/lib/Mermaid'

describe('MermaidComponent', () => {
  it('returns null when children is an empty string', () => {
    const html = renderToStaticMarkup(
      createElement(MermaidComponent, { children: '' }),
    )
    expect(html).toBe('')
  })

  it('renders a mermaid div with the dark-mode invert classes when a chart is provided', () => {
    const html = renderToStaticMarkup(
      createElement(MermaidComponent, { children: 'graph TD; A-->B;' }),
    )
    expect(html).toContain('<div')
    expect(html).toContain('class="mermaid dark:invert dark:hue-rotate-180"')
    // Chart body is written imperatively in useEffect, not into the SSR markup.
    expect(html).not.toContain('graph TD')
  })

  it('calls mermaid.initialize with startOnLoad disabled on module load', async () => {
    const mermaid = (await import('mermaid')).default
    expect(mermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: 'default',
    })
  })
})
