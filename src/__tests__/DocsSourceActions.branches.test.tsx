// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * Branch coverage for src/components/docs/DocsSourceActions.tsx.
 *
 * The component currently has no dedicated test file — the coverage report
 * shows 7 uncovered branches spanning:
 *
 *   - buildGitHubEditUrl (lines 40, 42): the non-kubestellar arm of the
 *     baseUrl ternary AND the ?? fallback when editBaseUrls is supplied vs.
 *     not supplied
 *   - buildGitHubEditUrl (line 44): the early null return when baseUrl
 *     cannot be resolved for a projectId
 *   - DocsSourceActions (line 99): the guarded null return when the
 *     resolved edit URL is not a valid GitHub edit URL
 *   - DocsSourceActions (line 108, ActionLink line 162): the `variant ===
 *     "compact"` arm of both container and ActionLink className ternaries
 *
 * These are all render-visible branches — no I/O, no side effects — so
 * table-driven RTL asserts cover them cleanly.
 */

vi.mock('@/hooks/useSharedConfig', () => ({
  useSharedConfig: () => ({ config: null }),
}))

import { DocsSourceActions } from '../components/docs/DocsSourceActions'

describe('DocsSourceActions — projectId + variant branch coverage', () => {
  it('renders the three action links for a non-kubestellar project using STATIC_EDIT_BASE_URLS (line 40 else arm, line 42 right arm)', () => {
    // projectId="console" -> not kubestellar, no editBaseUrls override, so
    // baseUrl falls through to STATIC_EDIT_BASE_URLS['console'].
    render(
      <DocsSourceActions
        filePath="console/getting-started.md"
        projectId="console"
        pageTitle="Getting Started"
      />
    )
    const composePR = screen.getByTitle('Compose a PR') as HTMLAnchorElement
    expect(composePR.href).toContain('github.com/kubestellar/console/edit/main/docs/console/getting-started.md')
    expect(composePR.href).toContain('fork=true')
    expect(screen.getByTitle('View Source')).toBeTruthy()
    expect(screen.getByTitle('Open Issue')).toBeTruthy()
  })

  it('returns null when the resolved base URL cannot be produced for the projectId (line 44 guard, line 99 guard)', () => {
    // Cast an unknown projectId at runtime — STATIC_EDIT_BASE_URLS lookup
    // returns undefined, the ?? fallback also yields undefined, baseUrl is
    // falsy so buildGitHubEditUrl returns null, and DocsSourceActions in
    // turn returns null.
    const { container } = render(
      <DocsSourceActions
        filePath="foo.md"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projectId={'nonexistent-project' as any}
        pageTitle="Foo"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the compact variant, exercising both container and ActionLink compact arms (line 108, 162)', () => {
    const { container } = render(
      <DocsSourceActions
        filePath="a2a/index.md"
        projectId="a2a"
        pageTitle="A2A"
        variant="compact"
      />
    )
    // Container ternary compact arm -> "flex gap-2" (no "flex-wrap").
    const outer = container.firstChild as HTMLElement
    expect(outer.className).toContain('flex gap-2')
    expect(outer.className).not.toContain('flex-wrap')

    // ActionLink compact arm -> "h-11 w-11" square button classes.
    const link = screen.getByTitle('Compose a PR')
    expect(link.className).toContain('h-11 w-11')
    // And NOT the full-variant "min-w-[150px]" class.
    expect(link.className).not.toContain('min-w-[150px]')
    // Compact variant hides the label text (only the icon renders).
    expect(link.textContent?.trim()).toBe('')
  })

  it('honours a config.editBaseUrls override for a non-kubestellar project (line 42 left arm)', () => {
    // Re-import with a config that supplies an override for one project.
    vi.resetModules()
    vi.doMock('@/hooks/useSharedConfig', () => ({
      useSharedConfig: () => ({
        config: {
          editBaseUrls: {
            a2a: 'https://github.com/kubestellar/a2a/edit/dev/docs',
          },
        },
      }),
    }))
    return import('../components/docs/DocsSourceActions').then(mod => {
      const { DocsSourceActions: RemockedDSA } = mod
      render(<RemockedDSA filePath="a2a/intro.md" projectId="a2a" pageTitle="A2A" />)
      const composePR = screen.getByTitle('Compose a PR') as HTMLAnchorElement
      expect(composePR.href).toContain('github.com/kubestellar/a2a/edit/dev/docs/a2a/intro.md')
      vi.doUnmock('@/hooks/useSharedConfig')
    })
  })

  it('always uses the branch-aware STATIC url for kubestellar even when an editBaseUrls override is present (line 40 true arm)', () => {
    vi.resetModules()
    vi.doMock('@/hooks/useSharedConfig', () => ({
      useSharedConfig: () => ({
        config: {
          editBaseUrls: {
            // An override that must be IGNORED for kubestellar.
            kubestellar: 'https://github.com/kubestellar/docs/edit/malicious/docs',
          },
        },
      }),
    }))
    return import('../components/docs/DocsSourceActions').then(mod => {
      const { DocsSourceActions: RemockedDSA } = mod
      render(
        <RemockedDSA filePath="kubestellar/intro.md" projectId="kubestellar" pageTitle="KS" />
      )
      const composePR = screen.getByTitle('Compose a PR') as HTMLAnchorElement
      expect(composePR.href).not.toContain('malicious')
      vi.doUnmock('@/hooks/useSharedConfig')
    })
  })
})
