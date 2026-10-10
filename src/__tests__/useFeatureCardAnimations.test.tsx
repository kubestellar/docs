// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useFeatureCardAnimations } from '@/hooks/useFeatureCardAnimations'

// IntersectionObserver isn't provided by jsdom.
let lastObserver: NoopIntersectionObserver | undefined

class NoopIntersectionObserver {
  callback: IntersectionObserverCallback
  unobserve = vi.fn()
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    lastObserver = this
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  root = null
  rootMargin = ''
  thresholds: number[] = []
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver as unknown as typeof IntersectionObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.head.querySelectorAll('style').forEach(s => s.remove())
})

function seed(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

describe('useFeatureCardAnimations', () => {
  it('marks matching cards for the scroll-in transition and injects the animation <style> block', () => {
    seed('<div class="feature-card"><div class="card-3d-container"></div></div>')

    renderHook(() => useFeatureCardAnimations())

    const card = document.querySelector('.feature-card') as HTMLElement
    expect(card.classList.contains('opacity-0')).toBe(true)
    expect(card.classList.contains('translate-y-10')).toBe(true)
    expect(document.head.querySelectorAll('style').length).toBeGreaterThan(0)
  })

  it('applies a 3D tilt transform to the container on mousemove and resets it on mouseleave', () => {
    const root = seed('<div class="feature-card"><div class="card-3d-container"></div></div>')
    const card = root.querySelector('.feature-card') as HTMLElement
    const container = root.querySelector('.card-3d-container') as HTMLElement

    renderHook(() => useFeatureCardAnimations())

    card.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }),
    )
    expect(container.style.transform).toMatch(/rotateY/)

    card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    expect(container.style.transform).toBe('rotateY(0deg) rotateX(0deg)')
  })

  it('removes the injected <style> block and listeners on unmount', () => {
    const root = seed('<div class="feature-card"><div class="card-3d-container"></div></div>')
    const card = root.querySelector('.feature-card') as HTMLElement
    const container = root.querySelector('.card-3d-container') as HTMLElement

    const { unmount } = renderHook(() => useFeatureCardAnimations())
    expect(document.head.querySelectorAll('style').length).toBeGreaterThan(0)

    unmount()

    expect(document.head.querySelectorAll('style').length).toBe(0)

    // Listeners should be detached — a post-unmount mousemove is a no-op.
    card.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }),
    )
    expect(container.style.transform).toBe('')
  })

  it('is a no-op when no elements match the selector', () => {
    expect(() =>
      renderHook(() => useFeatureCardAnimations({ selector: '.nothing-here' })),
    ).not.toThrow()
  })

  it('adds the animate-in class and stops observing once a card intersects', () => {
    vi.useFakeTimers()
    const root = seed('<div class="feature-card"><div class="card-3d-container"></div></div>')
    const card = root.querySelector('.feature-card') as HTMLElement

    renderHook(() => useFeatureCardAnimations({ staggerMs: 50 }))

    lastObserver!.callback(
      [{ target: card, isIntersecting: true } as IntersectionObserverEntry],
      lastObserver as unknown as IntersectionObserver,
    )
    vi.advanceTimersByTime(50)

    expect(card.classList.contains('animate-in')).toBe(true)
    expect(lastObserver!.unobserve).toHaveBeenCalledWith(card)

    vi.useRealTimers()
  })

  it('ignores non-intersecting entries', () => {
    const root = seed('<div class="feature-card"><div class="card-3d-container"></div></div>')
    const card = root.querySelector('.feature-card') as HTMLElement

    renderHook(() => useFeatureCardAnimations())

    lastObserver!.callback(
      [{ target: card, isIntersecting: false } as IntersectionObserverEntry],
      lastObserver as unknown as IntersectionObserver,
    )

    expect(card.classList.contains('animate-in')).toBe(false)
    expect(lastObserver!.unobserve).not.toHaveBeenCalled()
  })

  it('skips the tilt transform when the card has no 3D-tilt container', () => {
    const root = seed('<div class="feature-card"></div>')
    const card = root.querySelector('.feature-card') as HTMLElement

    expect(() => {
      renderHook(() => useFeatureCardAnimations())
      card.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }),
      )
      card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    }).not.toThrow()
  })
})
