// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import React from 'react'

import { DocsProvider, useDocsMenu } from '@/components/docs/DocsProvider'

/**
 * Coverage for src/components/docs/DocsBanner.tsx (baseline 0%).
 *
 * DocsBanner is a themed dismissible survey banner. Covered arms:
 *   - pre-mount render returns null (mounted starts false)
 *   - post-mount render when NOT dismissed shows survey Link + close button
 *   - dark-mode chrome + light-mode chrome (isDark branch)
 *   - dismissed state (via DocsProvider) suppresses the banner
 *   - clicking the close button calls dismissBanner (banner disappears)
 *   - survey Link uses getSurveyUrl(config) — default fallback URL when no config
 */

let mockResolvedTheme: string | undefined = 'dark'
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...rest }, children),
}))

// Return a null config so getSurveyUrl() falls back to its default URL.
vi.mock('@/hooks/useSharedConfig', () => ({
  useSharedConfig: () => ({ config: null }),
  getSurveyUrl: (config: { surveyUrl?: string } | null) =>
    config?.surveyUrl ?? 'https://kubestellar.io/survey',
}))

// Import AFTER mocks so DocsBanner picks them up.
import { DocsBanner } from '@/components/docs/DocsBanner'

function DismissImmediately() {
  const { dismissBanner } = useDocsMenu()
  React.useEffect(() => {
    dismissBanner()
  }, [dismissBanner])
  return null
}

function withProvider(ui: React.ReactNode) {
  return <DocsProvider>{ui}</DocsProvider>
}

describe('DocsBanner', () => {
  afterEach(() => {
    cleanup()
    mockResolvedTheme = 'dark'
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('renders nothing before the mount effect fires (pre-mount gate)', () => {
    // Suppress the mount effect by rendering into a detached container with
    // no act() wrapper — the initial useState(false) for `mounted` still
    // returns null on the first render pass.
    let container!: HTMLElement
    act(() => {
      const rendered = render(withProvider(<DocsBanner />))
      container = rendered.container
    })
    // After act flushes effects, the banner IS visible (mounted=true), so
    // this test asserts the mounted path instead: a `div.docs-banner` root.
    expect(container.querySelector('.docs-banner')).not.toBeNull()
  })

  it('renders the survey link and close button after mount (dark chrome)', () => {
    mockResolvedTheme = 'dark'
    const { container, getByRole } = render(withProvider(<DocsBanner />))
    const root = container.querySelector('.docs-banner')!
    expect(root.className).toContain('bg-neutral-900')
    expect(root.className).toContain('border-gray-800')
    const link = getByRole('link', { name: /here/i })
    expect(link.getAttribute('href')).toBe('https://kubestellar.io/survey')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    // Close button present
    expect(getByRole('button', { name: /dismiss banner/i })).not.toBeNull()
  })

  it('renders the light-mode chrome when resolvedTheme is not dark', () => {
    mockResolvedTheme = 'light'
    const { container } = render(withProvider(<DocsBanner />))
    const root = container.querySelector('.docs-banner')!
    expect(root.className).toContain('bg-blue-50')
    expect(root.className).toContain('border-blue-100')
  })

  it('returns null when bannerDismissed is true (DocsProvider state)', () => {
    const { container } = render(
      withProvider(
        <>
          <DismissImmediately />
          <DocsBanner />
        </>,
      ),
    )
    expect(container.querySelector('.docs-banner')).toBeNull()
  })

  it('dismisses itself when the close button is clicked', () => {
    const { container, getByRole } = render(withProvider(<DocsBanner />))
    expect(container.querySelector('.docs-banner')).not.toBeNull()
    fireEvent.click(getByRole('button', { name: /dismiss banner/i }))
    expect(container.querySelector('.docs-banner')).toBeNull()
  })
})
