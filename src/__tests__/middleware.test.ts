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
function createMockRequest(hostname: string, pathname: string) {
  return {
    nextUrl: {
      hostname,
      pathname,
      clone: () => ({ hostname, pathname }),
    },
  } as any
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
      const redirects = await (config as any).redirects()
      const communityRedirect = redirects.find(
        (r: any) => r.source === '/community'
      )
      expect(communityRedirect).toBeDefined()
      expect(communityRedirect.destination).toBe(
        'https://cloud-native.slack.com/archives/C097094RZ3M'
      )
      // Must NOT point to docs.kubestellar.io (that caused the loop)
      expect(communityRedirect.destination).not.toContain('docs.kubestellar.io')
    })
  })
})
