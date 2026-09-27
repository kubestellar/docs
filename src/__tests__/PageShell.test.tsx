// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import React from 'react'

/**
 * Unit tests for src/components/master-page/PageShell.tsx.
 *
 * PageShell is the shared page scaffold introduced for kubestellar/docs#7106
 * (twelve page.tsx files duplicated Navbar + GridLines + StarField + Footer
 * with drifted defaults). Tests exercise:
 *   - the canonical grid/stars defaults are forwarded to the widgets,
 *   - explicit overrides win over defaults,
 *   - `grid: false` and `stars: false` drop the respective layer,
 *   - `showFooter: false` suppresses the Footer,
 *   - children render between the Navbar and the Footer.
 *
 * Underlying widgets are mocked (three.js / raf-driven; also excluded
 * from coverage in vitest.config.ts), matching the pattern used by
 * src/__tests__/AboutSection.render.test.tsx.
 */

const gridSpy = vi.fn()
const starSpy = vi.fn()

vi.mock('@/components/index', () => ({
  Navbar: () => React.createElement('div', { 'data-testid': 'navbar' }),
  Footer: () => React.createElement('div', { 'data-testid': 'footer' }),
  GridLines: (props: Record<string, unknown>) => {
    gridSpy(props)
    return React.createElement('div', { 'data-testid': 'gridlines' })
  },
  StarField: (props: Record<string, unknown>) => {
    starSpy(props)
    return React.createElement('div', { 'data-testid': 'starfield' })
  },
}))
vi.mock('../components/index', () => ({
  Navbar: () => React.createElement('div', { 'data-testid': 'navbar' }),
  Footer: () => React.createElement('div', { 'data-testid': 'footer' }),
  GridLines: (props: Record<string, unknown>) => {
    gridSpy(props)
    return React.createElement('div', { 'data-testid': 'gridlines' })
  },
  StarField: (props: Record<string, unknown>) => {
    starSpy(props)
    return React.createElement('div', { 'data-testid': 'starfield' })
  },
}))

afterEach(() => {
  gridSpy.mockClear()
  starSpy.mockClear()
  cleanup()
})

async function importShell() {
  const mod = await import('../components/master-page/PageShell')
  return mod
}

describe('PageShell', () => {
  it('renders Navbar, children, Footer, background wrapper, base layer, and both animated layers by default', async () => {
    const { default: PageShell } = await importShell()
    const { getByTestId } = render(
      <PageShell>
        <p data-testid="child">hello</p>
      </PageShell>,
    )

    expect(getByTestId('navbar')).not.toBeNull()
    expect(getByTestId('footer')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('child')).not.toBeNull()
    expect(getByTestId('page-shell-background')).not.toBeNull()
    expect(getByTestId('page-shell-base-layer')).not.toBeNull()
    expect(getByTestId('page-shell-content')).not.toBeNull()
  })

  it('applies the canonical default Tailwind classes on outer, background wrapper, base, and content', async () => {
    const {
      default: PageShell,
      DEFAULT_OUTER_CLASS,
      DEFAULT_BACKGROUND_WRAPPER_CLASS,
      DEFAULT_BASE_LAYER_CLASS,
      DEFAULT_CONTENT_CLASS,
    } = await importShell()
    const { getByTestId } = render(<PageShell>content</PageShell>)

    expect(getByTestId('page-shell').className).toBe(DEFAULT_OUTER_CLASS)
    expect(getByTestId('page-shell-background').className).toBe(
      DEFAULT_BACKGROUND_WRAPPER_CLASS,
    )
    expect(getByTestId('page-shell-base-layer').className).toBe(
      DEFAULT_BASE_LAYER_CLASS,
    )
    expect(getByTestId('page-shell-content').className).toBe(DEFAULT_CONTENT_CLASS)
  })

  it('forwards the canonical GridLines/StarField defaults', async () => {
    const { default: PageShell, DEFAULT_GRID, DEFAULT_STARS } = await importShell()
    render(<PageShell>content</PageShell>)

    expect(gridSpy).toHaveBeenCalledOnce()
    expect(gridSpy.mock.calls[0][0]).toEqual(DEFAULT_GRID)

    expect(starSpy).toHaveBeenCalledOnce()
    expect(starSpy.mock.calls[0][0]).toEqual(DEFAULT_STARS)
  })

  it('lets background.grid overrides merge over defaults without dropping unmentioned keys', async () => {
    const { default: PageShell, DEFAULT_GRID } = await importShell()
    render(
      <PageShell background={{ grid: { horizontalLines: 30, strokeColor: '#fff' } }}>
        content
      </PageShell>,
    )

    expect(gridSpy.mock.calls[0][0]).toEqual({
      ...DEFAULT_GRID,
      horizontalLines: 30,
      strokeColor: '#fff',
    })
  })

  it('lets background.stars overrides merge over defaults (contribute-handbook shape)', async () => {
    const { default: PageShell, DEFAULT_STARS } = await importShell()
    render(
      <PageShell background={{ stars: { density: 'high', cometCount: 5 } }}>
        content
      </PageShell>,
    )

    expect(starSpy.mock.calls[0][0]).toEqual({
      ...DEFAULT_STARS,
      density: 'high',
      cometCount: 5,
    })
  })

  it('omits GridLines when background.grid === false but keeps stars and the base layer', async () => {
    const { default: PageShell } = await importShell()
    const { queryByTestId } = render(
      <PageShell background={{ grid: false }}>content</PageShell>,
    )

    expect(queryByTestId('gridlines')).toBeNull()
    expect(queryByTestId('starfield')).not.toBeNull()
    // background wrapper still present because stars + base remain
    expect(queryByTestId('page-shell-background')).not.toBeNull()
    expect(queryByTestId('page-shell-base-layer')).not.toBeNull()
  })

  it('omits StarField when background.stars === false', async () => {
    const { default: PageShell } = await importShell()
    const { queryByTestId } = render(
      <PageShell background={{ stars: false }}>content</PageShell>,
    )

    expect(queryByTestId('starfield')).toBeNull()
    expect(queryByTestId('gridlines')).not.toBeNull()
  })

  it('omits the base layer when background.baseLayerClassName === false', async () => {
    const { default: PageShell } = await importShell()
    const { queryByTestId } = render(
      <PageShell background={{ baseLayerClassName: false }}>content</PageShell>,
    )

    expect(queryByTestId('page-shell-base-layer')).toBeNull()
    // stars + grid still render, so wrapper is still present
    expect(queryByTestId('page-shell-background')).not.toBeNull()
  })

  it('omits the background wrapper entirely when every layer is disabled', async () => {
    const { default: PageShell } = await importShell()
    const { queryByTestId } = render(
      <PageShell
        background={{ grid: false, stars: false, baseLayerClassName: false }}
      >
        content
      </PageShell>,
    )

    expect(queryByTestId('gridlines')).toBeNull()
    expect(queryByTestId('starfield')).toBeNull()
    expect(queryByTestId('page-shell-base-layer')).toBeNull()
    expect(queryByTestId('page-shell-background')).toBeNull()
  })

  it('honors contentClassName override', async () => {
    const { default: PageShell } = await importShell()
    const { getByTestId } = render(
      <PageShell contentClassName="content-x">content</PageShell>,
    )
    expect(getByTestId('page-shell-content').className).toBe('content-x')
  })

  it('omits the content wrapper when contentClassName === null (page brings its own)', async () => {
    const { default: PageShell } = await importShell()
    const { queryByTestId, getByText } = render(
      <PageShell contentClassName={null}>
        <div>bespoke hero</div>
      </PageShell>,
    )
    expect(queryByTestId('page-shell-content')).toBeNull()
    expect(getByText('bespoke hero')).not.toBeNull()
  })

  it('honors showFooter=false', async () => {
    const { default: PageShell } = await importShell()
    const { queryByTestId } = render(
      <PageShell showFooter={false}>content</PageShell>,
    )

    expect(queryByTestId('footer')).toBeNull()
    expect(queryByTestId('navbar')).not.toBeNull()
  })

  it('applies className to the outer wrapper and a custom wrapperClassName to the background', async () => {
    const { default: PageShell } = await importShell()
    const { getByTestId } = render(
      <PageShell
        className="outer-x"
        background={{ wrapperClassName: 'bg-x' }}
      >
        content
      </PageShell>,
    )

    expect(getByTestId('page-shell').className).toBe('outer-x')
    expect(getByTestId('page-shell-background').className).toBe('bg-x')
  })
})
