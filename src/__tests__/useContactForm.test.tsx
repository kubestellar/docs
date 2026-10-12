// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContactForm } from '@/hooks/useContactForm'

const gtagEventMock = vi.fn()
vi.mock('@/components/GoogleAnalytics', () => ({
  gtagEvent: (...args: unknown[]) => gtagEventMock(...args),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  gtagEventMock.mockReset()
})

function changeEvent(name: string, value: string, type = 'text') {
  return {
    target: { name, value, type, checked: value === 'true' },
  } as unknown as React.ChangeEvent<HTMLInputElement>
}

describe('useContactForm', () => {
  it('updates text fields and checkbox fields via handleInputChange', () => {
    const { result } = renderHook(() => useContactForm())

    act(() => {
      result.current.handleInputChange(changeEvent('name', 'Ada'))
      result.current.handleInputChange(changeEvent('privacy', 'true', 'checkbox'))
    })

    expect(result.current.formData.name).toBe('Ada')
    expect(result.current.formData.privacy).toBe(true)
  })

  it('blocks submission and warns when privacy is not accepted', async () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { result } = renderHook(() => useContactForm())

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent)
    })

    expect(alertSpy).toHaveBeenCalledWith(
      'Please agree to the privacy policy to continue.',
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('submits the form, shows the success banner, and resets fields on success', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response)
    const { result } = renderHook(() => useContactForm())

    act(() => {
      result.current.handleInputChange(changeEvent('name', 'Ada'))
      result.current.handleInputChange(changeEvent('privacy', 'true', 'checkbox'))
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent)
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.current.showSuccess).toBe(true)
    expect(result.current.formData.name).toBe('')

    expect(gtagEventMock).toHaveBeenCalledWith('contact_form_submit', { status: 'success' })

    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(result.current.showSuccess).toBe(false)
  })

  it('surfaces a failure alert and resets isSubmitting when the POST fails', async () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response)
    const { result } = renderHook(() => useContactForm())

    act(() => {
      result.current.handleInputChange(changeEvent('privacy', 'true', 'checkbox'))
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent)
    })

    expect(alertSpy).toHaveBeenCalledWith(
      'Submission failed. Please try again later.',
    )
    expect(result.current.isSubmitting).toBe(false)
    expect(gtagEventMock).toHaveBeenCalledWith('contact_form_submit', { status: 'error' })
  })

  it('does not fire a telemetry event when submission is blocked by the privacy gate', async () => {
    vi.spyOn(globalThis, 'alert').mockImplementation(() => {})
    const { result } = renderHook(() => useContactForm())

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent)
    })

    expect(gtagEventMock).not.toHaveBeenCalled()
  })
})
