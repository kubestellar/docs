// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, act } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/app/[locale]/marketplace/components/InstallModal.tsx
 * (baseline 0%).
 *
 * Exercises:
 *   - console detection resolves to the "running" branch and shows the port
 *   - the copy-to-clipboard control flips the copied indicator
 *   - the close (X) button invokes onClose exactly once per click
 *   - console detection resolves to the "not-running" branch (install
 *     instructions shown instead of the "Install to Console" button)
 */

vi.mock('@/app/[locale]/marketplace/lib/constants', async () => {
  const actual = await vi.importActual<
    typeof import('@/app/[locale]/marketplace/lib/constants')
  >('@/app/[locale]/marketplace/lib/constants')
  return {
    ...actual,
    detectConsole: vi.fn(),
  }
})

import { detectConsole } from '@/app/[locale]/marketplace/lib/constants'
import type { MarketplaceItem } from '@/app/[locale]/marketplace/lib/types'
import { InstallModal } from '@/app/[locale]/marketplace/components/InstallModal'

const item: MarketplaceItem = {
  id: 'dash-1',
  name: 'Cluster Overview',
  description: 'A dashboard for cluster health.',
  author: 'jane-doe',
  version: '1.2.0',
  downloadUrl: 'https://example.com/dash-1.json',
  tags: ['clusters'],
  cardCount: 3,
  type: 'dashboard',
}

beforeEach(() => {
  vi.mocked(detectConsole).mockResolvedValue(true)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('InstallModal', () => {
  it('shows the running status and the "Install to Console" action once detection resolves', async () => {
    render(<InstallModal item={item} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/Running on port 8080/)).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: /Install to Console/i })).toBeTruthy()
  })

  it('shows install instructions when the console is not detected', async () => {
    vi.mocked(detectConsole).mockResolvedValue(false)
    render(<InstallModal item={item} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/Not detected/)).toBeTruthy()
    })
    expect(screen.getByText(/Quick Install/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Install to Console/i })).toBeNull()
  })

  it('copies the quick-install command and flips the copied indicator', async () => {
    vi.mocked(detectConsole).mockResolvedValue(false)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<InstallModal item={item} onClose={() => {}} />)

    await waitFor(() => expect(screen.getByText(/Quick Install/)).toBeTruthy())

    // Switch to fake timers only after the initial detectConsole effect has
    // settled, so the 2s "copied" reset timeout can be flushed deterministically.
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const copyButton = screen.getByText('Quick Install').parentElement!.querySelector('button')!
    await act(async () => {
      fireEvent.click(copyButton)
    })

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('curl -sSL https://raw.githubusercontent.com/kubestellar/console'),
    )

    // Flush the 2s "copied" reset timeout inside act() so the state update
    // it triggers doesn't leak into a later test as an unwrapped update.
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    vi.useRealTimers()
  })

  it('invokes onClose exactly once when the close button is clicked', async () => {
    const onClose = vi.fn()
    const { container } = render(<InstallModal item={item} onClose={onClose} />)

    await waitFor(() => expect(screen.getByText(/Running on port/)).toBeTruthy())

    // The close (X) button is the first <button> rendered in the modal header.
    const closeButton = container.querySelector('button')!
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('POSTs the dashboard payload to the console and shows the success state', async () => {
    const fetchMock = vi
      .fn()
      // download item JSON
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'dash-1' }) })
      // POST to /api/dashboards/import
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    render(<InstallModal item={item} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Running on port/)).toBeTruthy())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Install to Console/i }))
    })

    await waitFor(() =>
      expect(screen.getByText(/Sent to Console/)).toBeTruthy(),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/dashboards/import',
      expect.objectContaining({ method: 'POST' }),
    )

    vi.unstubAllGlobals()
  })

  it('falls back to opening the console URL when the install fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', fetchMock)
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<InstallModal item={item} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Running on port/)).toBeTruthy())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Install to Console/i }))
    })

    await waitFor(() => expect(screen.getByText(/Sent to Console/)).toBeTruthy())
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:8080/?marketplace-install=dash-1'),
      '_blank',
    )

    openSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('re-runs detection with the new port when the port input changes and Retry is clicked', async () => {
    render(<InstallModal item={item} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Running on port 8080/)).toBeTruthy())

    vi.mocked(detectConsole).mockClear()
    vi.mocked(detectConsole).mockResolvedValue(false)

    const portInput = screen.getByDisplayValue('8080')
    fireEvent.change(portInput, { target: { value: '9090' } })

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => expect(screen.getByText(/Not detected/)).toBeTruthy())
    expect(detectConsole).toHaveBeenCalledWith(9090)
  })
})
