/**
 * Render smoke test for docs pages.
 *
 * Regression guard for the June 2026 incident (fixed in PR #6261) where an
 * automated commit dropped the DocsLayout wrapper from the docs [...slug]
 * page. Every docs page shipped as unstyled markup for a month: the compiled
 * CSS still contained all `.prose` typography rules, but the rendered HTML no
 * longer had the `<article class="prose ...">` element they target — and no
 * test asserted anything about rendered docs markup, so CI stayed green.
 *
 * This test renders a real docs route end-to-end (content file -> MDX
 * compile -> evaluate -> DocsLayout wrapper) and fails if the prose article
 * wrapper, the heading markup, or the table of contents ever disappear again.
 */
import { describe, expect, it, vi } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// The DocsLayout tree contains client components that use next/navigation's
// usePathname (breadcrumb in MobileHeader). Outside a running Next.js app the
// hook returns null and the breadcrumb code would crash, so pin a pathname.
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return {
    ...actual,
    usePathname: () => '/docs/introduction',
  }
})

// next/link expects Next.js router context; render a plain anchor instead.
vi.mock('next/link', async () => {
  const { createElement: h } = await import('react')
  return {
    default: ({
      href,
      children,
      ...rest
    }: { href?: unknown; children?: ReactNode } & Record<string, unknown>) =>
      h('a', { ...rest, href: typeof href === 'string' ? href : undefined }, children),
  }
})

import { DocsProvider } from '../components/docs/DocsProvider'
import DocPage from '../app/docs/[...slug]/page'

async function renderDocsRoute(slug: string[]): Promise<string> {
  const page = await DocPage({ params: Promise.resolve({ slug }) })
  return renderToStaticMarkup(createElement(DocsProvider, null, page))
}

describe('docs page rendering (smoke test)', () => {
  it('wraps rendered markdown in the prose layout article', async () => {
    const html = await renderDocsRoute(['introduction'])

    // The DocsLayout wrapper must produce the <article class="prose ...">
    // element that all documentation typography in globals.css targets.
    // Without it, headings, lists, tables, and code render as flat text.
    expect(html).toMatch(/<article[^>]+class="[^"]*\bprose\b[^"]*"/)
  })

  it('renders markdown headings as heading elements, not the plain-text fallback', async () => {
    const html = await renderDocsRoute(['introduction'])

    // introduction.md starts with an h1; if MDX compilation silently fails,
    // the page falls back to a <pre> dump with no heading elements at all.
    expect(html).toMatch(/<h1[^>]*>/)
    expect(html).toMatch(/<h2[^>]*>/)
  })

  it('renders the table of contents for the page', async () => {
    const html = await renderDocsRoute(['introduction'])

    // The toc extracted by nextra's evaluate() must reach the layout: the
    // TOC renders anchor links pointing at in-page heading ids.
    expect(html).toMatch(/href="#[a-z0-9-]+"/)
  })
})
