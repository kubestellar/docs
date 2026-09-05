// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

/**
 * Coverage for the bounded GA4 click signal added to EditPageLink.
 *
 * Only `project_id` (fixed ProjectId union) and `variant` ('full' | 'icon')
 * are ever sent — never the file path or resolved edit URL — to avoid
 * unbounded event params. Mirrors the pattern already used for
 * docs_search / docs_search_result_click in DocsNavbar.
 */

const gtagEventMock = vi.fn()

vi.mock('@/components/GoogleAnalytics', () => ({
  gtagEvent: (...args: unknown[]) => gtagEventMock(...args),
}))

vi.mock('@/hooks/useSharedConfig', () => ({
  useSharedConfig: () => ({ config: null }),
}))

import { EditPageLink } from '../components/docs/EditPageLink'

describe('EditPageLink GA4 click tracking', () => {
  beforeEach(() => {
    gtagEventMock.mockClear()
  })

  it('fires docs_edit_page_click with bounded params for the full variant', () => {
    render(
      <EditPageLink filePath="console/getting-started.md" projectId="console" variant="full" />
    )

    fireEvent.click(screen.getByText('Edit this page on GitHub'))

    expect(gtagEventMock).toHaveBeenCalledWith('docs_edit_page_click', {
      project_id: 'console',
      variant: 'full',
    })
  })

  it('fires docs_edit_page_click with bounded params for the icon variant', () => {
    render(
      <EditPageLink filePath="console/getting-started.md" projectId="console" variant="icon" />
    )

    fireEvent.click(screen.getByTitle('Edit this page on GitHub'))

    expect(gtagEventMock).toHaveBeenCalledWith('docs_edit_page_click', {
      project_id: 'console',
      variant: 'icon',
    })
  })
})
