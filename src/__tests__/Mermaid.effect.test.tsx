// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { createElement } from 'react'

// Effect-side coverage for src/lib/Mermaid.tsx.
//
// The existing Mermaid.test.tsx uses renderToStaticMarkup — SSR only,
// so the `useEffect` init block (lines 17-20) that clears
// data-processed, sets textContent, and calls mermaid.run() never
// fires and is uncovered. Under jsdom (per-file opt-in) the effect
// runs against a real DOM node and we can assert the pre/post state.

const runMock = vi.fn().mockResolvedValue(undefined)
const initializeMock = vi.fn()

vi.mock('mermaid', () => ({
  default: {
    initialize: initializeMock,
    run: runMock,
  },
}))

beforeEach(() => {
  runMock.mockClear()
  initializeMock.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('MermaidComponent — useEffect body under jsdom', () => {
  it('mounts a <div class="mermaid ..."> and drives mermaid.run against it', async () => {
    const { MermaidComponent } = await import('@/lib/Mermaid')
    const chart = 'graph TD; A-->B'

    const { container } = render(createElement(MermaidComponent, { children: chart }))

    const div = container.querySelector('div.mermaid') as HTMLDivElement | null
    expect(div).not.toBeNull()
    // useEffect sets textContent to the chart source.
    expect(div!.textContent).toBe(chart)
    // dark-mode classes preserved.
    expect(div!.className).toContain('dark:invert')
    expect(div!.className).toContain('dark:hue-rotate-180')

    // mermaid.run() was called with the mounted node.
    expect(runMock).toHaveBeenCalledTimes(1)
    const [arg] = runMock.mock.calls[0]
    expect(arg).toEqual({ nodes: [div] })
  })

  it('removes any stale data-processed attribute before re-running mermaid', async () => {
    const { MermaidComponent } = await import('@/lib/Mermaid')
    const chart = 'sequenceDiagram; A->>B: Hi'

    const { container } = render(createElement(MermaidComponent, { children: chart }))
    const div = container.querySelector('div.mermaid') as HTMLDivElement

    // Simulate mermaid having already annotated the node from a previous run.
    div.setAttribute('data-processed', 'true')
    // Force a re-render with a new chart -> useEffect runs again and must strip
    // the stale marker before invoking mermaid.run() so the diagram re-renders.
    runMock.mockClear()
    render(createElement(MermaidComponent, { children: 'graph LR; X-->Y' }), { container })

    // After the effect fires, the marker should be gone from the freshly-mounted node.
    const freshDiv = container.querySelector('div.mermaid') as HTMLDivElement
    expect(freshDiv.hasAttribute('data-processed')).toBe(false)
    expect(runMock).toHaveBeenCalled()
  })

  it('does not touch mermaid.run when children is empty (early null return)', async () => {
    const { MermaidComponent } = await import('@/lib/Mermaid')

    const { container } = render(createElement(MermaidComponent, { children: '' }))

    // With no chart, the component returns null: no DOM node, no effect body.
    expect(container.querySelector('div.mermaid')).toBeNull()
    expect(runMock).not.toHaveBeenCalled()
  })

  it('swallows mermaid.run rejections via .catch(console.error)', async () => {
    // The effect chains .catch(console.error) so a failed render does not
    // become an unhandled rejection. Verify by making run() reject and
    // asserting no throw escapes the render call.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    runMock.mockRejectedValueOnce(new Error('mermaid parse failed'))

    const { MermaidComponent } = await import('@/lib/Mermaid')
    expect(() =>
      render(createElement(MermaidComponent, { children: 'not a real chart' })),
    ).not.toThrow()

    // Flush the microtask queue so the .catch handler runs.
    await Promise.resolve()
    await Promise.resolve()

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error))
    errorSpy.mockRestore()
  })
})
