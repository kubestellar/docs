/**
 * Coverage for the project-root fallback branches in
 * src/app/docs/[...slug]/page.tsx that no existing render test reaches:
 *
 *  - `readLocalFile`'s "not found in the project-specific content path,
 *    fall back to the main KubeStellar content path" branch (used for
 *    general sections — Contributing, Community, News — which only live
 *    under docs/content/, not under a per-project content directory).
 *  - `getPageContent`'s routeMap fallback: when the direct .md/.mdx guess
 *    derived from the slug does not exist on disk, but a nav entry maps
 *    that route to a different relative file (e.g. a nav item titled
 *    "Overview" pointing at contributing/contribute.md), the page must
 *    still resolve via routeMap instead of 404ing.
 *
 * Both routes below are exercised through the same evaluate() JSX-runtime
 * shim as docs-page-render.branches.test.ts, since the branches live
 * inside async DocPage rendering.
 */
import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'

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

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return {
    ...actual,
    usePathname: () => '/docs/console/contributing/overview',
  }
})

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

// Isolated runtime for these project-scoped rendering paths is ~40s (real
// filesystem read + Next.js SSR + Nextra MDX pipeline); bump the 60s
// default so the full-suite concurrency load doesn't false-fail it.
const RENDER_TIMEOUT_MS = 120_000

describe('docs page readLocalFile / routeMap fallback branches', () => {
  it(
    'resolves a general-section file under a project slug via the main content-path fallback',
    async () => {
      // contributing/contribute.md exists under docs/content/ (the general
      // "Contributing" section) but not under docs/content/console/. The
      // 'console' project-scoped contentPath lookup must miss and fall
      // through to docsContentPath for readLocalFile to succeed.
      const html = await renderDocsRoute(['console', 'contributing', 'contribute'])
      expect(html).toMatch(/<article[^>]+class="[^"]*\bprose\b[^"]*"/)
    },
    RENDER_TIMEOUT_MS,
  )

  it(
    'resolves a nav-only route via the routeMap fallback when no direct file matches the slug',
    async () => {
      // contributing/nav.yaml maps nav title "Contributing to Code"
      // (slugified to "contributing-to-code") to contributing/CONTRIBUTINGKS.md.
      // There is no contributing/contributing-to-code.md(x) anywhere, so the
      // direct .md/.mdx guess in getPageContent must miss and the
      // routeMap-derived mappedFile lookup (itself resolved through the
      // same project -> main fallback) must be what actually renders the
      // page.
      const html = await renderDocsRoute(['console', 'contributing', 'contributing-to-code'])
      expect(html).toMatch(/<article[^>]+class="[^"]*\bprose\b[^"]*"/)
    },
    RENDER_TIMEOUT_MS,
  )
})
