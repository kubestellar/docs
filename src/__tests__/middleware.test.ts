import { describe, it, expect, vi } from 'vitest'

/**
 * Unit tests for middleware redirect logic.
 * We mock NextResponse and NextRequest to test the routing decisions
 * without needing a full Next.js server.
 */

// Mock NextResponse.redirect
const mockRedirect = vi.fn((url: string, status: number) => ({
  type: 'redirect',
  url,
  status,
}))

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: string, status: number) => mockRedirect(url, status),
  },
}))

vi.mock('next-intl/middleware', () => ({
  default: () => () => ({ type: 'intl' }),
}))

vi.mock('../i18n/settings', () => ({
  locales: ['en'],
  defaultLocale: 'en',
}))

// Helper to create a mock NextRequest
interface MockNextRequest {
  nextUrl: {
    hostname: string
    pathname: string
    clone: () => { hostname: string; pathname: string }
  }
}

function createMockRequest(hostname: string, pathname: string): MockNextRequest {
  return {
    nextUrl: {
      hostname,
      pathname,
      clone: () => ({ hostname, pathname }),
    },
  }
}

// Helper that returns a request whose cloned URL captures pathname
// assignments made inside middleware() so tests can inspect the rewrite.
function createLocaleMockRequest(hostname: string, pathname: string) {
  const cloned: { hostname: string; pathname: string } = { hostname, pathname }
  return {
    nextUrl: {
      hostname,
      pathname,
      clone: () => cloned,
    },
    _cloned: cloned,
  }
}


describe('middleware redirects', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
  })

  describe('docs.kubestellar.io path preservation (fix #4499)', () => {
    it('redirects docs.kubestellar.io root to kubestellar.io/docs', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createMockRequest('docs.kubestellar.io', '/')
      middleware(req)
      expect(mockRedirect).toHaveBeenCalledWith('https://kubestellar.io/docs', 301)
    })

    it('preserves path for docs.kubestellar.io subpaths', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createMockRequest('docs.kubestellar.io', '/stable/Community/_index/')
      middleware(req)
      expect(mockRedirect).toHaveBeenCalledWith(
        'https://kubestellar.io/docs/stable/Community/_index/',
        301
      )
    })

    it('preserves deep nested paths on docs.kubestellar.io', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createMockRequest('docs.kubestellar.io', '/v0.25/getting-started/quickstart')
      middleware(req)
      expect(mockRedirect).toHaveBeenCalledWith(
        'https://kubestellar.io/docs/v0.25/getting-started/quickstart',
        301
      )
    })
  })

  describe('console-docs.kubestellar.io redirects', () => {
    it('redirects root to console readme', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createMockRequest('console-docs.kubestellar.io', '/')
      middleware(req)
      expect(mockRedirect).toHaveBeenCalledWith(
        'https://kubestellar.io/docs/console/readme',
        301
      )
    })

    it('preserves subpaths under console-docs', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createMockRequest('console-docs.kubestellar.io', '/getting-started')
      middleware(req)
      expect(mockRedirect).toHaveBeenCalledWith(
        'https://kubestellar.io/docs/console/getting-started',
        301
      )
    })
  })

  describe('/community redirect no longer loops', () => {
    it('next.config redirects /community to Slack (not docs.kubestellar.io)', async () => {
      // This test validates the next.config.ts redirect definition
      // by importing and checking the redirects array
      const { default: nextConfigFactory } = await import('../../next.config')
      // next.config.ts exports a NextConfig or a function that returns one
      const config = typeof nextConfigFactory === 'function'
        ? nextConfigFactory('', {})
        : nextConfigFactory
      const redirects = await (config as Record<string, () => Promise<Array<{ source: string; destination: string }>>>).redirects()
      const communityRedirect = redirects.find(
        (r: { source: string; destination: string }) => r.source === '/community'
      )
      expect(communityRedirect).toBeDefined()
      expect(communityRedirect.destination).toBe(
        'https://cloud-native.slack.com/archives/C097094RZ3M'
      )
      // Must NOT point to docs.kubestellar.io (that caused the loop)
      expect(communityRedirect.destination).not.toContain('docs.kubestellar.io')
    })
  })

  describe('localized docs path stripping', () => {
    it('strips 2-letter locale prefix from /es/docs/... to /docs/...', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createLocaleMockRequest('kubestellar.io', '/es/docs/getting-started/quickstart')
      middleware(req as unknown as MockNextRequest)
      // Redirect target is the cloned URL object, whose pathname was rewritten.
      expect(mockRedirect).toHaveBeenCalled()
      const [urlArg, statusArg] = mockRedirect.mock.calls[0]
      expect((urlArg as { pathname: string }).pathname).toBe('/docs/getting-started/quickstart')
      expect(statusArg).toBe(307)
    })

    it('strips locale+country prefix from /pt-BR/docs/... to /docs/...', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createLocaleMockRequest('kubestellar.io', '/pt-BR/docs/intro')
      middleware(req as unknown as MockNextRequest)
      expect(mockRedirect).toHaveBeenCalled()
      const [urlArg] = mockRedirect.mock.calls[0]
      expect((urlArg as { pathname: string }).pathname).toBe('/docs/intro')
    })

    it('strips SC prefix from /SC/docs/... to /docs/...', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createLocaleMockRequest('kubestellar.io', '/SC/docs/intro')
      middleware(req as unknown as MockNextRequest)
      expect(mockRedirect).toHaveBeenCalled()
      const [urlArg] = mockRedirect.mock.calls[0]
      expect((urlArg as { pathname: string }).pathname).toBe('/docs/intro')
    })

    it('does not strip locale from a non-/docs path (regex requires /docs/)', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createLocaleMockRequest('kubestellar.io', '/es/about')
      const result = middleware(req as unknown as MockNextRequest)
      // Neither the docs-path branch nor the root branch fires; the request
      // falls through to intlMiddleware (mocked to return {type:'intl'}).
      expect(result).toEqual({ type: 'intl' })
    })
  })

  describe('root path fallback', () => {
    it('redirects "/" to the default locale prefix with 307', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createLocaleMockRequest('kubestellar.io', '/')
      middleware(req as unknown as MockNextRequest)
      expect(mockRedirect).toHaveBeenCalled()
      const [urlArg, statusArg] = mockRedirect.mock.calls[0]
      expect((urlArg as { pathname: string }).pathname).toBe('/en')
      expect(statusArg).toBe(307)
    })
  })

  describe('intlMiddleware fallthrough', () => {
    it('delegates unmatched paths to next-intl middleware', async () => {
      const { default: middleware } = await import('../middleware')
      const req = createMockRequest('kubestellar.io', '/en/some/other/page')
      const result = middleware(req)
      expect(result).toEqual({ type: 'intl' })
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })
})
