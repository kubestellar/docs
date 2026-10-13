/**
 * Coverage for two DocPage code paths left untested by
 * docs-page-render.test.ts and docs-page-render.branches.test.ts:
 *
 *  - generateStaticParams(): walks docs/content on disk and returns one
 *    { slug } entry per .md/.mdx file. Pure filesystem traversal, never
 *    exercised by any render test.
 *  - the compilationFailed fallback branch in DocPage: when compileMdx()
 *    throws, the page must still render via the DocsLayout Wrapper, but
 *    with a <pre> dump of the raw (template-substituted, sanitized)
 *    content instead of compiled MDX, and must log the failure through
 *    the shared logger instead of failing silently.
 */
import { describe, expect, it, vi } from 'vitest'
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

// Force the real compile step to fail so the compilationFailed fallback
// branch (the <pre> dump) runs instead of the normal MDX-evaluate path.
vi.mock('nextra/compile', () => ({
  compileMdx: vi.fn().mockRejectedValue(new Error('forced compile failure for test')),
}))

import { logger } from '../lib/logger'
import { DocsProvider } from '../components/docs/DocsProvider'
import DocPage, { generateStaticParams } from '../app/docs/[...slug]/page'
import { docsContentPath } from '../app/docs/page-map'

async function renderDocsRoute(slug: string[]): Promise<string> {
  const page = await DocPage({ params: Promise.resolve({ slug }) })
  return renderToStaticMarkup(createElement(DocsProvider, null, page))
}

const RENDER_TIMEOUT_MS = 120_000

describe('generateStaticParams', () => {
  it('returns one { slug } entry per .md/.mdx file under docs/content, matching the real tree', () => {
    const expected: string[][] = []
    function walk(dir: string, prefix: string[] = []) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), [...prefix, entry.name])
        } else if (/\.mdx?$/.test(entry.name)) {
          expected.push([...prefix, entry.name.replace(/\.mdx?$/, '')])
        }
      }
    }
    walk(docsContentPath)

    const params = generateStaticParams()

    return params.then((result) => {
      expect(result.length).toBe(expected.length)
      expect(result.length).toBeGreaterThan(0)
      // Order is deterministic (readdirSync order); compare as sets of
      // joined paths so the assertion doesn't depend on traversal order.
      const resultSlugs = result.map((p) => p.slug.join('/')).sort()
      const expectedSlugs = expected.map((s) => s.join('/')).sort()
      expect(resultSlugs).toEqual(expectedSlugs)
    })
  })
})

describe('DocPage compilationFailed fallback', () => {
  // All three assertions run against a single render pass. The spy's
  // recorded calls are read immediately after that render (rather than
  // from a later `it`, whose fresh test context does not share the
  // beforeAll-scoped mock's call history), so the mock state can't drift.
  it(
    'renders the <pre> fallback, keeps the prose wrapper, and logs the failure',
    async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
      try {
        const html = await renderDocsRoute(['introduction'])

        // The Wrapper must still fire with an empty toc/metadata even
        // though MDX compilation failed — only the inner content becomes
        // a <pre> dump.
        expect(html).toMatch(/<article[^>]+class="[^"]*\bprose\b[^"]*"/)
        expect(html).toMatch(/<pre>/)
        // introduction.md's content must survive into the fallback text.
        expect(html).toMatch(/kubestellar/i)

        expect(errorSpy).toHaveBeenCalledWith(
          'mdx compilation failed, falling back to plain text',
          expect.objectContaining({
            route: 'docs-page',
            error: 'forced compile failure for test',
          }),
        )
      } finally {
        errorSpy.mockRestore()
      }
    },
    RENDER_TIMEOUT_MS,
  )
})
