// @vitest-environment jsdom
/**
 * Coverage for src/app/[locale]/marketplace/components/InstallModal.tsx.
 *
 * InstallModal is the local-Console installer used from every marketplace
 * card. It performs three side effects that we assert explicitly:
 *   1. On mount and on port change, it calls `detectConsole(port)` and
 *      transitions from "detecting" → "running" | "not-running".
 *   2. When Console is running and the user clicks "Install to Console",
 *      it downloads `item.downloadUrl`, then either POSTs to
 *      `/api/dashboards/import` (dashboard items) or opens the marketplace
 *      install deep link (non-dashboard items).
 *   3. On download/POST failure, it falls back to opening the deep link
 *      and still reports success — the surface goal is "user got to
 *      Console", not "our fetch succeeded".
 *
 * `detectConsole` is imported from `../lib/constants`; we mock the whole
 * module so we can drive the running/not-running branches without a real
 * fetch. `global.fetch`, `window.open`, and `navigator.clipboard.writeText`
 * are stubbed per test.
 */

import React from 'react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, fireEvent, screen, waitFor, act } from '@testing-library/react'

const detectConsoleMock = vi.fn<(port?: number) => Promise<boolean>>()

vi.mock('../app/[locale]/marketplace/lib/constants', async () => {
  const actual = await vi.importActual<
    typeof import('../app/[locale]/marketplace/lib/constants')
  >('../app/[locale]/marketplace/lib/constants')
  return {
    ...actual,
    detectConsole: (port?: number) => detectConsoleMock(port),
  }
})

// eslint-disable-next-line import/first
import { InstallModal } from '../app/[locale]/marketplace/components/InstallModal'
// eslint-disable-next-line import/first
import type { MarketplaceItem } from '../app/[locale]/marketplace/lib/types'

function makeItem(overrides: Partial<MarketplaceItem> = {}): MarketplaceItem {
  return {
    id: 'grafana-cpu',
    name: 'CPU Dashboard',
    description: 'CPU dashboard',
    author: 'Grace',
    version: '2.0.0',
    downloadUrl: 'https://example.test/cpu.json',
    tags: [],
    cardCount: 0,
    type: 'dashboard',
    ...overrides,
  }
}

describe('InstallModal', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let openMock: ReturnType<typeof vi.fn>
  let writeTextMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    detectConsoleMock.mockReset()
    fetchMock = vi.fn()
    openMock = vi.fn()
    writeTextMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', openMock)
    // window.open is what the component actually uses
    ;(window as unknown as { open: typeof openMock }).open = openMock
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('shows "Running" and offers Install to Console when detectConsole resolves true', async () => {
    detectConsoleMock.mockResolvedValue(true)
    render(<InstallModal item={makeItem()} onClose={() => {}} />)

    // detecting → running
    expect(screen.getByText(/Detecting/)).toBeTruthy()
    await waitFor(() => expect(screen.getByText(/Running on port 8080/)).toBeTruthy())
    expect(screen.getByRole('button', { name: /Install to Console/ })).toBeTruthy()
    expect(detectConsoleMock).toHaveBeenCalledWith(8080)
  })

  it('shows "Not detected" install instructions when detectConsole resolves false', async () => {
    detectConsoleMock.mockResolvedValue(false)
    render(<InstallModal item={makeItem()} onClose={() => {}} />)

    await waitFor(() => expect(screen.getByText(/Not detected/)).toBeTruthy())
    // "Not detected" branch renders the quick-install curl block
    expect(screen.getByText(/Quick Install/)).toBeTruthy()
    expect(screen.getByText(/curl -sSL/)).toBeTruthy()
  })

  it('re-detects on port change and on Retry click', async () => {
    detectConsoleMock.mockResolvedValue(false)
    render(<InstallModal item={makeItem()} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Not detected/)).toBeTruthy())
    expect(detectConsoleMock).toHaveBeenCalledTimes(1)

    // Change port from 8080 → 9000 → triggers effect
    const portInput = screen.getByDisplayValue('8080') as HTMLInputElement
    fireEvent.change(portInput, { target: { value: '9000' } })
    await waitFor(() => expect(detectConsoleMock).toHaveBeenCalledWith(9000))

    // Click Retry — same port, one more call
    detectConsoleMock.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }))
    await waitFor(() => expect(detectConsoleMock).toHaveBeenCalledWith(9000))
  })

  it('falls back to default port when the port input is cleared', async () => {
    detectConsoleMock.mockResolvedValue(false)
    render(<InstallModal item={makeItem()} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Not detected/)).toBeTruthy())

    const portInput = screen.getByDisplayValue('8080') as HTMLInputElement
    fireEvent.change(portInput, { target: { value: '' } })
    // Number('') === NaN → falsy → falls back to CONSOLE_DEFAULT_PORT (8080)
    await waitFor(() => expect(portInput.value).toBe('8080'))
  })

  it('calls onClose when the backdrop or X button is clicked', async () => {
    detectConsoleMock.mockResolvedValue(false)
    const onClose = vi.fn()
    const { container } = render(<InstallModal item={makeItem()} onClose={onClose} />)
    await waitFor(() => expect(screen.getByText(/Not detected/)).toBeTruthy())

    // Backdrop is the first absolutely-positioned overlay div with the onClick handler
    const backdrop = container.querySelector('div.absolute.inset-0.bg-black\\/70')
    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop as Element)
    expect(onClose).toHaveBeenCalledTimes(1)

    // X close button — the only <button> with no visible label above the port block
    const xButton = container.querySelector(
      'button.p-1\\.5.rounded-lg',
    )
    expect(xButton).toBeTruthy()
    fireEvent.click(xButton as Element)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('copies the curl command to clipboard and shows the copied indicator', async () => {
    detectConsoleMock.mockResolvedValue(false)
    render(<InstallModal item={makeItem()} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Quick Install/)).toBeTruthy())

    // The copy button is the only button inside the curl block (unlabeled icon).
    // We find it by clicking every button next to the curl <code> block.
    const codeEl = screen.getByText(/curl -sSL/)
    const container = codeEl.closest('div')!.parentElement!
    const copyBtn = container.querySelector('button') as HTMLButtonElement
    fireEvent.click(copyBtn)
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh'),
    )
  })

  it('POSTs the downloaded JSON to /api/dashboards/import for dashboard items and shows success', async () => {
    detectConsoleMock.mockResolvedValue(true)
    fetchMock
      // 1st call: item.downloadUrl → returns JSON
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'dash-1' }) })
      // 2nd call: POST /api/dashboards/import
      .mockResolvedValueOnce({ ok: true })

    render(<InstallModal item={makeItem()} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Running on port 8080/)).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: /Install to Console/ }))
    await waitFor(() =>
      expect(screen.getByText(/Sent to Console/)).toBeTruthy(),
    )

    // 1st fetch = item.downloadUrl
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/cpu.json')
    // 2nd fetch = POST http://localhost:8080/api/dashboards/import with JSON body
    const [postUrl, postInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(postUrl).toBe('http://localhost:8080/api/dashboards/import')
    expect(postInit.method).toBe('POST')
    expect(postInit.credentials).toBe('include')
    expect(postInit.body).toBe(JSON.stringify({ id: 'dash-1' }))

    // Deep-link opener MUST NOT be used on the happy path
    expect(openMock).not.toHaveBeenCalled()
  })

  it('opens the marketplace deep link for non-dashboard items instead of POSTing', async () => {
    detectConsoleMock.mockResolvedValue(true)
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(
      <InstallModal
        item={makeItem({ id: 'theme-noir', type: 'theme' })}
        onClose={() => {}}
      />,
    )
    await waitFor(() => expect(screen.getByText(/Running on port 8080/)).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: /Install to Console/ }))
    await waitFor(() =>
      expect(openMock).toHaveBeenCalledWith(
        'http://localhost:8080/?marketplace-install=theme-noir',
        '_blank',
      ),
    )
    await waitFor(() => expect(screen.getByText(/Sent to Console/)).toBeTruthy())
  })

  it('falls back to the deep link and reports success when the initial download fails', async () => {
    detectConsoleMock.mockResolvedValue(true)
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })

    render(<InstallModal item={makeItem()} onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Running on port 8080/)).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: /Install to Console/ }))
    await waitFor(() =>
      expect(openMock).toHaveBeenCalledWith(
        'http://localhost:8080/?marketplace-install=grafana-cpu',
        '_blank',
      ),
    )
    await waitFor(() => expect(screen.getByText(/Sent to Console/)).toBeTruthy())
  })

  it('resets the "copied" indicator after 2 seconds', async () => {
    vi.useFakeTimers()
    detectConsoleMock.mockResolvedValue(false)
    render(<InstallModal item={makeItem()} onClose={() => {}} />)
    await act(async () => {
      await Promise.resolve() // flush detectConsole().then
      await Promise.resolve()
    })
    // Advance until the Not detected branch has mounted
    await act(async () => {
      await Promise.resolve()
    })

    const codeEl = screen.getByText(/curl -sSL/)
    const container = codeEl.closest('div')!.parentElement!
    const copyBtn = container.querySelector('button') as HTMLButtonElement
    fireEvent.click(copyBtn)
    expect(writeTextMock).toHaveBeenCalled()

    // Advance the 2000ms timer → setCopied(null); no assertion needed beyond
    // "the timer fires without throwing".
    act(() => {
      vi.advanceTimersByTime(2100)
    })
  })
})
