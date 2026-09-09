import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('MermaidComponent', () => {
  it('returns null when children is an empty string', async () => {
    const { MermaidComponent } = await import('@/lib/Mermaid')
    const html = renderToStaticMarkup(
      createElement(MermaidComponent, { children: '' }),
    )
    expect(html).toBe('')
  })

  it('renders a mermaid div with the dark-mode invert classes when a chart is provided', async () => {
    const { MermaidComponent } = await import('@/lib/Mermaid')
    const html = renderToStaticMarkup(
      createElement(MermaidComponent, { children: 'graph TD; A-->B;' }),
    )
    expect(html).toContain('<div')
    expect(html).toContain('class="mermaid dark:invert dark:hue-rotate-180"')
    // Chart body is written imperatively in useEffect, not into the SSR markup.
    expect(html).not.toContain('graph TD')
  })

  it('calls mermaid.initialize with startOnLoad disabled on module load', async () => {
    // This project's vitest.config.ts doesn't set `clearMocks`, so it picks up
    // Vitest 5's new default of `clearMocks: true`, which runs
    // `vi.clearAllMocks()` in a beforeEach — wiping any call recorded before
    // the current test's own body runs. Mermaid.tsx calls `mermaid.initialize`
    // once, at module scope, on first import; if that import happens at
    // collection time (a static top-level import, as this file used to have),
    // the call is always cleared before any test body executes and this
    // assertion can never see it, regardless of import order or test-file
    // isolation. `vi.resetModules()` forces a fresh evaluation of both the
    // mock and the component within this test, i.e. strictly after this
    // test's own beforeEach clear, so the recorded call survives to the
    // assertion below.
    vi.resetModules()
    const mermaid = (await import('mermaid')).default
    await import('@/lib/Mermaid')
    expect(mermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: 'default',
    })
  })
})
