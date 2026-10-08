// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBackToTop } from '@/hooks/useBackToTop'

afterEach(() => {
  document.body.innerHTML = ''
})

function seedButton(id = 'back-to-top') {
  const button = document.createElement('button')
  button.id = id
  document.body.appendChild(button)
  return button
}

describe('useBackToTop', () => {
  it('is a no-op when the button is not in the DOM', () => {
    expect(() => renderHook(() => useBackToTop())).not.toThrow()
  })

  it('shows the button once scrollY passes the threshold and hides it below', () => {
    const button = seedButton()

    renderHook(() => useBackToTop({ scrollThresholdPx: 300 }))
    expect(button.style.opacity).toBe('0')

    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(button.style.opacity).toBe('1')

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(button.style.opacity).toBe('0')
  })

  it('scrolls to top on click', () => {
    const button = seedButton()
    let scrolledTo: ScrollToOptions | undefined
    window.scrollTo = ((opts?: ScrollToOptions) => {
      scrolledTo = opts
    }) as typeof window.scrollTo

    renderHook(() => useBackToTop())
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(scrolledTo).toEqual({ top: 0, behavior: 'smooth' })
  })

  it('removes its listeners on unmount', () => {
    const button = seedButton()
    const removeWindowSpy: string[] = []
    const originalRemove = window.removeEventListener.bind(window)
    window.removeEventListener = ((type: string, ...rest: unknown[]) => {
      removeWindowSpy.push(type)
      // @ts-expect-error - forwarding to the original implementation
      return originalRemove(type, ...rest)
    }) as typeof window.removeEventListener

    const { unmount } = renderHook(() => useBackToTop())
    unmount()

    expect(removeWindowSpy).toContain('scroll')
    window.removeEventListener = originalRemove
    void button
  })

  it('does nothing while disabled', () => {
    const button = seedButton()
    renderHook(() => useBackToTop({ enabled: false }))

    Object.defineProperty(window, 'scrollY', { value: 999, configurable: true })
    window.dispatchEvent(new Event('scroll'))

    // Never wired up, so the opacity style is untouched.
    expect(button.style.opacity).toBe('')
  })

  it('honors a custom buttonId', () => {
    const button = seedButton('custom-top-button')
    renderHook(() => useBackToTop({ buttonId: 'custom-top-button' }))

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
    window.dispatchEvent(new Event('scroll'))

    expect(button.style.opacity).toBe('1')
  })
})
