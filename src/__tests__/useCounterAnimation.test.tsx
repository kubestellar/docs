// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCounterAnimation } from '@/hooks/useCounterAnimation'

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function seed(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

describe('useCounterAnimation', () => {
  it('animates matching counters up to their data-target and stops at the target', () => {
    vi.useFakeTimers()
    seed('<span class="counter" data-target="100">0</span>')

    renderHook(() => useCounterAnimation({ durationMs: 100, tickMs: 10 }))

    vi.advanceTimersByTime(1000)
    const counter = document.querySelector('.counter') as HTMLElement
    expect(counter.textContent).toBe('100')
  })

  it('treats missing or non-numeric data-target as 0', () => {
    vi.useFakeTimers()
    seed('<span class="counter">x</span>')

    renderHook(() => useCounterAnimation({ durationMs: 40, tickMs: 10 }))
    vi.advanceTimersByTime(200)

    const counter = document.querySelector('.counter') as HTMLElement
    expect(counter.textContent).toBe('0')
  })

  it('clears every per-counter interval on unmount', () => {
    vi.useFakeTimers()
    seed(
      '<span class="counter" data-target="1000">0</span>' +
        '<span class="counter" data-target="2000">0</span>' +
        '<span class="counter" data-target="3000">0</span>',
    )

    const { unmount } = renderHook(() =>
      useCounterAnimation({ durationMs: 10000, tickMs: 16 }),
    )

    // Three counter timers should be registered.
    expect(vi.getTimerCount()).toBe(3)

    unmount()

    // All timers must be cleared — the leak this hook exists to prevent.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('honors a custom selector and root scope so it does not leak beyond the caller', () => {
    vi.useFakeTimers()
    const scoped = seed('<span class="metric" data-target="50">0</span>')
    seed('<span class="metric" data-target="999">0</span>') // outside root

    renderHook(() =>
      useCounterAnimation({
        selector: '.metric',
        root: scoped,
        durationMs: 50,
        tickMs: 10,
      }),
    )
    vi.advanceTimersByTime(500)

    const [inside, outside] = document.querySelectorAll<HTMLElement>('.metric')
    expect(inside.textContent).toBe('50')
    // The outside element was never picked up by the scoped query.
    expect(outside.textContent).toBe('0')
  })

  it('honors a custom targetAttr', () => {
    vi.useFakeTimers()
    seed('<span class="counter" data-goal="7">0</span>')

    renderHook(() =>
      useCounterAnimation({ targetAttr: 'data-goal', durationMs: 40, tickMs: 10 }),
    )
    vi.advanceTimersByTime(200)

    expect(document.querySelector('.counter')!.textContent).toBe('7')
  })

  it('is a no-op when no elements match the selector', () => {
    vi.useFakeTimers()
    expect(() =>
      renderHook(() => useCounterAnimation({ selector: '.nothing-here' })),
    ).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })
})
