/**
 * Coverage for the branches of DocPage that the existing smoke test
 * (docs-page-render.test.ts) does not reach:
 *
 *  - `getProjectFromSlug` known-project branch: a leading slug segment
 *    that matches a project id (e.g. `console`, `kubestellar-mcp`) strips
 *    the segment and routes to the project-scoped content path.
 *  - `notFound()` path: an unknown slug that resolves neither via the
 *    filesystem nor via the routeMap must fall through to Next.js's
 *    `notFound()`, which throws NEXT_HTTP_ERROR_FALLBACK;NOT_FOUND.
 *  - `replaceTemplateVariables` handlebar substitution: the rendered
 *    page must actually resolve `{{ config.ks_branch }}` etc. before the
 *    MDX compile step, so no raw `{{ ... }}` markers reach the output.
 *
 * These branches all live inside async DocPage rendering, so they can only
 * be reached through the same evaluate() JSX-runtime shim as the existing
 * docs-page-render.test.ts. The mocks below are copied verbatim from that
 * file so the two behave identically.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'fs'
import path from 'path'

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
    usePathname: () => '/docs/introduction',
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

const RENDER_TIMEOUT_MS = 60_000

describe('docs page branch coverage', () => {
  it(
    'routes a project-scoped slug through the getProjectFromSlug known-project branch',
    async () => {
      // Pick any .md file under docs/content/console/ — its route is
      // /docs/console/<name>, and DocPage should strip the `console`
      // segment via getProjectFromSlug and read the file from the
      // console-scoped contentPath.
      const consoleContent = path.join(process.cwd(), 'docs/content/console')
      const entries = fs
        .readdirSync(consoleContent, { withFileTypes: true })
        .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
      expect(entries.length).toBeGreaterThan(0)
      const first = entries[0].name.replace(/\.mdx?$/, '')

      const html = await renderDocsRoute(['console', first])
      // The DocsLayout wrapper still fires — proves the file was found via
      // the project-scoped content path rather than falling to notFound().
      expect(html).toMatch(/<article[^>]+class="[^"]*\bprose\b[^"]*"/)
    },
    RENDER_TIMEOUT_MS,
  )

  it(
    'falls through to notFound() for an unknown slug',
    async () => {
      // notFound() throws NEXT_HTTP_ERROR_FALLBACK;NOT_FOUND when neither
      // filesystem lookup nor the routeMap yields a page.
      await expect(
        renderDocsRoute(['this-slug-does-not-exist-anywhere-xyz-123']),
      ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK|NOT_FOUND/)
    },
    RENDER_TIMEOUT_MS,
  )

  describe('replaceTemplateVariables in rendered output', () => {
    let html = ''
    beforeAll(async () => {
      html = await renderDocsRoute(['introduction'])
    }, RENDER_TIMEOUT_MS)

    it('substitutes known {{ config.* }} variables before MDX compile', () => {
      // Whatever introduction.md contains, the rendered HTML must not
      // ship raw {{ config.* }} markers — replaceTemplateVariables ran and
      // either substituted them or the trailing catch-all stripped them.
      expect(html).not.toMatch(/\{\{\s*config\./)
    })
  })
})
