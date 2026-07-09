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
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// nextra's evaluate() injects react/jsx-dev-runtime whenever NODE_ENV is not
// "production", while the MDX compiled by compileMdx emits production _jsx()
// calls. Under vitest NODE_ENV is "test", so the two disagree and rendering
// fails with "_jsx is not a function". Next.js never hits this because its
// NODE_ENV is always "production" or "development". Re-implement evaluate's
// tiny runtime-injection shim with the production JSX runtime that matches
// compileMdx's output; the compile step and the DocsLayout wrapper under test
// stay fully real.
vi.mock('nextra/evaluate', async () => {
  const runtime = await import('react/jsx-runtime')
  return {
    evaluate(rawJs: string, components = {}, scope: Record<string, unknown> = {}) {
      const keys = Object.keys(scope)
      const values = Object.values(scope)
      const hydrateFn = Reflect.construct(Function, ['$', ...keys, rawJs])
      return hydrateFn({ ...runtime, useMDXComponents: () => components }, ...values)
    },
  }
})

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

// The first MDX compile is slow (~10s cold start in CI), well past vitest's
// 5s default timeout, so render once up front with a generous budget and
// assert against the shared result.
const RENDER_TIMEOUT_MS = 60_000

describe('docs page rendering (smoke test)', () => {
  let html = ''

  beforeAll(async () => {
    html = await renderDocsRoute(['introduction'])
  }, RENDER_TIMEOUT_MS)

  it('wraps rendered markdown in the prose layout article', () => {
    // The DocsLayout wrapper must produce the <article class="prose ...">
    // element that all documentation typography in globals.css targets.
    // Without it, headings, lists, tables, and code render as flat text.
    expect(html).toMatch(/<article[^>]+class="[^"]*\bprose\b[^"]*"/)
  })

  it('renders markdown headings as heading elements, not the plain-text fallback', () => {
    // introduction.md starts with an h1; if MDX compilation silently fails,
    // the page falls back to a <pre> dump with no heading elements at all.
    expect(html).toMatch(/<h1[^>]*>/)
    expect(html).toMatch(/<h2[^>]*>/)
  })

  it('renders the table of contents for the page', () => {
    // The toc extracted by nextra's evaluate() must reach the layout: the
    // TOC renders anchor links pointing at in-page heading ids.
    expect(html).toMatch(/href="#[a-z0-9-]+"/)
  })
})
