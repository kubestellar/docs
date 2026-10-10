// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useFeatureCardAnimations } from '@/hooks/useFeatureCardAnimations'

// IntersectionObserver isn't provided by jsdom. This tracked variant lets
// tests capture the most recently constructed instance so the intersection
// callback can be invoked directly, exercising the isIntersecting branch.
class NoopIntersectionObserver {
  callback: IntersectionObserverCallback
  unobserve = vi.fn()
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    NoopIntersectionObserver.instances.push(this)
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  root = null
  rootMargin = ''
  thresholds: number[] = []

  static instances: NoopIntersectionObserver[] = []
}

beforeEach(() => {
  NoopIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver as unknown as typeof IntersectionObserver)
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
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

  it('adds "animate-in" after the stagger delay and unobserves once a card intersects', () => {
    const root = seed(
      '<div class="feature-card" data-card="0"></div><div class="feature-card" data-card="1"></div>',
    )
    const cards = Array.from(root.querySelectorAll('.feature-card'))

    renderHook(() => useFeatureCardAnimations({ staggerMs: 100 }))

    const observer = NoopIntersectionObserver.instances[0]
    observer.callback(
      [
        { isIntersecting: true, target: cards[0] } as IntersectionObserverEntry,
        { isIntersecting: false, target: cards[1] } as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    )

    // Not intersecting entries never schedule a reveal or get unobserved.
    expect(cards[1].classList.contains('animate-in')).toBe(false)
    expect(observer.unobserve).not.toHaveBeenCalledWith(cards[1])

    // Intersecting entries unobserve immediately...
    expect(observer.unobserve).toHaveBeenCalledWith(cards[0])
    // ...but the reveal class is only applied after the staggered delay.
    expect(cards[0].classList.contains('animate-in')).toBe(false)
    vi.advanceTimersByTime(100)
    expect(cards[0].classList.contains('animate-in')).toBe(true)
  })

  it('leaves the tilt transform untouched when the 3D container is missing', () => {
    const root = seed('<div class="feature-card"></div>')
    const card = root.querySelector('.feature-card') as HTMLElement

    renderHook(() => useFeatureCardAnimations())

    expect(() => {
      card.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }),
      )
      card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    }).not.toThrow()
  })
})
