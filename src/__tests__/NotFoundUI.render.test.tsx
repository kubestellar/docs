// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Locks the NotFoundUI component's rendering invariants. This component
// intentionally uses INLINE STYLES ONLY (no Tailwind), because the 404
// page is precisely what users see during deploy propagation windows
// when the previous deploy's hashed CSS bundle can 404 — and it must
// render correctly with no external assets. These tests defend the
// invariants that make that guarantee true.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `t:${key}`,
}))

// usePathname is exercised in one test (with a pathname) and cleared in
// another (no pathname → the "requested path" box must not render).
const pathnameMock = vi.fn<[], string | null>()
vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, style }: {
    href: string
    children: React.ReactNode
    style?: React.CSSProperties
  }) => (
    <a href={href} style={style} data-testid={`link-${href}`}>{children}</a>
  ),
}))

import NotFoundUI from '../components/NotFoundUI'

describe('NotFoundUI', () => {
  it('renders the 404 code, brand mark, and inline reset <style> when a pathname is present', () => {
    pathnameMock.mockReturnValue('/docs/nope')
    const { container } = render(<NotFoundUI />)

    // 404 heading
    expect(screen.getByText('404')).toBeTruthy()

    // Translation keys (mock returns "t:<key>") appear for every t(...) call:
    // description, requestedPath, message, homeButton, docsButton.
    expect(screen.getByText('t:description')).toBeTruthy()
    expect(screen.getByText('t:requestedPath')).toBeTruthy()
    expect(screen.getByText('t:message')).toBeTruthy()
    expect(screen.getByText('t:homeButton')).toBeTruthy()
    expect(screen.getByText('t:docsButton')).toBeTruthy()

    // Requested path is displayed inside a <code> element (pathBox arm).
    const codeEl = container.querySelector('code')
    expect(codeEl?.textContent).toBe('/docs/nope')

    // Inline <style> reset: html,body must be zeroed and get the dark bg.
    // This is what keeps the page correct when the CSS bundle 404s.
    const styleEls = container.querySelectorAll('style')
    expect(styleEls.length).toBeGreaterThan(0)
    const styleText = Array.from(styleEls).map(s => s.textContent).join('')
    expect(styleText).toContain('html')
    expect(styleText).toContain('body')
    expect(styleText).toContain('margin:0')
    expect(styleText).toContain('#0a0a0a')

    // Brand mark: img must have explicit width/height attributes so
    // it can never render unsized during a CSS-bundle 404 (the "giant
    // blue glyph" incident guard).
    const img = container.querySelector('img[alt="KubeStellar"]')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('width')).toBe('28')
    expect(img?.getAttribute('height')).toBe('28')
    // Data URI so no external asset request is required.
    expect(img?.getAttribute('src')?.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('omits the requested-path box when usePathname returns null', () => {
    pathnameMock.mockReturnValue(null)
    const { container } = render(<NotFoundUI />)

    // The pathBox branch is guarded by `pathname && (...)`. With null,
    // no <code> element, and the requestedPath translation is absent.
    expect(container.querySelector('code')).toBeNull()
    expect(screen.queryByText('t:requestedPath')).toBeNull()

    // The rest of the page still renders.
    expect(screen.getByText('404')).toBeTruthy()
    expect(screen.getByText('t:homeButton')).toBeTruthy()
  })

  it('links / and /docs internally and opens the GitHub link in a new tab with rel=noopener', () => {
    pathnameMock.mockReturnValue('/x')
    const { container } = render(<NotFoundUI />)

    // Two internal Link mocks: the brand link and the "home" button both
    // point at "/"; the docs button points at "/docs".
    const rootLinks = container.querySelectorAll('[data-testid="link-/"]')
    expect(rootLinks.length).toBe(2) // brand + primary home button
    expect(container.querySelector('[data-testid="link-/docs"]')).not.toBeNull()

    // GitHub is an external <a> — must have rel="noopener noreferrer"
    // and target="_blank" to prevent tabnabbing.
    const gh = container.querySelector('a[href="https://github.com/kubestellar"]') as HTMLAnchorElement | null
    expect(gh).not.toBeNull()
    expect(gh?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(gh?.getAttribute('target')).toBe('_blank')
  })
})
