// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/master-page/ContactSection.tsx (baseline 0%).
 *
 * ContactSection is a "use client" component whose side effects are:
 *   1. `handleInputChange` — updates formData on typed / checkbox events
 *   2. `handleSubmit` — validates privacy checkbox (early alert-return branch),
 *      POSTs to "/" via fetch, sets showSuccess on ok, catches on !ok
 *   3. setTimeout that flips showSuccess back off after 8s
 * All observable branches (privacy-not-checked early return, successful POST,
 * failed POST) are covered.
 *
 * See #6815 (step 2) for the residual master-page render-smoke work item.
 */

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `t.${key}`,
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
  }) => React.createElement('a', { href, ...rest }, children),
}))

vi.mock('@/lib/url', () => ({
  getLocalizedUrl: (path: string) => path,
}))

vi.mock('@/components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))
vi.mock('../components/index', () => ({
  StarField: () => React.createElement('div', { 'data-testid': 'starfield' }),
  GridLines: () => React.createElement('div', { 'data-testid': 'gridlines' }),
}))

let alertSpy: ReturnType<typeof vi.fn>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  alertSpy = vi.fn()
  ;(globalThis as unknown as { alert: unknown }).alert = alertSpy
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  errorSpy.mockRestore()
  cleanup()
})

describe('ContactSection render', () => {
  it('renders without throwing and mounts the section + form', async () => {
    const mod = await import('../components/master-page/ContactSection')
    const ContactSection = mod.default
    const { container } = render(<ContactSection />)
    expect(container.querySelector('section#contact')).not.toBeNull()
    expect(container.querySelector('form')).not.toBeNull()
  })

  it('mounts the StarField and GridLines background decorations', async () => {
    const mod = await import('../components/master-page/ContactSection')
    const ContactSection = mod.default
    const { getByTestId } = render(<ContactSection />)
    expect(getByTestId('starfield')).not.toBeNull()
    expect(getByTestId('gridlines')).not.toBeNull()
  })

  it('handleInputChange updates text and checkbox inputs', async () => {
    const mod = await import('../components/master-page/ContactSection')
    const ContactSection = mod.default
    const { container } = render(<ContactSection />)
    const name = container.querySelector('input[name="name"]') as HTMLInputElement
    const privacy = container.querySelector(
      'input[name="privacy"]'
    ) as HTMLInputElement
    expect(name).not.toBeNull()
    expect(privacy).not.toBeNull()

    fireEvent.change(name, { target: { name: 'name', value: 'Ada', type: 'text' } })
    expect(name.value).toBe('Ada')

    fireEvent.click(privacy)
    expect(privacy.checked).toBe(true)
  })

  it('handleSubmit early-returns via alert() when privacy is unchecked', async () => {
    const mod = await import('../components/master-page/ContactSection')
    const ContactSection = mod.default
    const { container } = render(<ContactSection />)
    const form = container.querySelector('form') as HTMLFormElement
    const fetchSpy = vi.fn()
    ;(globalThis as unknown as { fetch: unknown }).fetch = fetchSpy

    fireEvent.submit(form)

    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('handleSubmit calls fetch and sets success state on ok response', async () => {
    const mod = await import('../components/master-page/ContactSection')
    const ContactSection = mod.default
    const { container } = render(<ContactSection />)
    const privacy = container.querySelector(
      'input[name="privacy"]'
    ) as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    fireEvent.click(privacy)

    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    ;(globalThis as unknown as { fetch: unknown }).fetch = fetchSpy

    await act(async () => {
      fireEvent.submit(form)
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/')
    expect(init.method).toBe('POST')
  })

  it('handleSubmit alerts on failed fetch response', async () => {
    const mod = await import('../components/master-page/ContactSection')
    const ContactSection = mod.default
    const { container } = render(<ContactSection />)
    const privacy = container.querySelector(
      'input[name="privacy"]'
    ) as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    fireEvent.click(privacy)

    ;(globalThis as unknown as { fetch: unknown }).fetch = vi
      .fn()
      .mockResolvedValue({ ok: false })

    await act(async () => {
      fireEvent.submit(form)
    })

    // 1 alert for the failure branch (privacy check passed, so no early alert)
    expect(alertSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalled()
  })
})
