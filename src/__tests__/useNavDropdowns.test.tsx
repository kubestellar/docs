// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useNavDropdowns,
  DROPDOWN_CLOSE_DELAY_MS,
} from '../components/navbar/useNavDropdowns'

/**
 * useNavDropdowns owns a single `openDropdown` value (docs#7095). The hook
 * no longer queries or mutates the DOM, so these tests drive it purely
 * through its returned callbacks plus the one global Escape listener.
 */

describe('useNavDropdowns', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with nothing open', () => {
    const { result } = renderHook(() => useNavDropdowns())
    expect(result.current.openDropdown).toBeNull()
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('openMenu opens the named dropdown and flips isDropdownOpen', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('contribute'))
    expect(result.current.openDropdown).toBe('contribute')
    expect(result.current.isDropdownOpen).toBe(true)
  })

  it('opening a second dropdown replaces the first (at most one open)', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('contribute'))
    act(() => result.current.openMenu('community'))
    expect(result.current.openDropdown).toBe('community')
    act(() => result.current.openMenu('lang'))
    expect(result.current.openDropdown).toBe('lang')
  })

  it('scheduleClose closes only after the debounce elapses', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('github'))
    act(() => result.current.scheduleClose('github'))
    expect(result.current.openDropdown).toBe('github')

    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS - 1))
    expect(result.current.openDropdown).toBe('github')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.openDropdown).toBeNull()
    expect(result.current.isDropdownOpen).toBe(false)
  })

  it('scheduleClose is a no-op for a dropdown that is no longer the open one', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('contribute'))
    act(() => result.current.scheduleClose('contribute'))
    // Moving into community within the delay cancels the pending timer
    act(() => result.current.openMenu('community'))
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS))
    expect(result.current.openDropdown).toBe('community')
  })

  it('a stale scheduled close never clears a newer dropdown', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('contribute'))
    act(() => result.current.scheduleClose('contribute'))
    // Simulate the timer surviving (e.g. cancelClose not called) by
    // re-scheduling for the other name and letting both fire.
    act(() => result.current.scheduleClose('github'))
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS))
    // github was never open, so the timer left contribute untouched.
    expect(result.current.openDropdown).toBe('contribute')
  })

  it('cancelClose cancels a pending close', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('community'))
    act(() => result.current.scheduleClose('community'))
    act(() => result.current.cancelClose())
    act(() => vi.advanceTimersByTime(DROPDOWN_CLOSE_DELAY_MS * 2))
    expect(result.current.openDropdown).toBe('community')
  })

  it('cancelClose is safe when nothing is pending', () => {
    const { result } = renderHook(() => useNavDropdowns())
    expect(() => act(() => result.current.cancelClose())).not.toThrow()
  })

  it('closeMenu closes immediately when the name matches', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('lang'))
    act(() => result.current.closeMenu('lang'))
    expect(result.current.openDropdown).toBeNull()
  })

  it('closeMenu leaves a different open dropdown alone', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('contribute'))
    act(() => result.current.closeMenu('lang'))
    expect(result.current.openDropdown).toBe('contribute')
  })

  it('closeAll clears any open dropdown and any pending close', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('github'))
    act(() => result.current.scheduleClose('github'))
    act(() => result.current.closeAll())
    expect(result.current.openDropdown).toBeNull()
    expect(() => act(() => vi.runAllTimers())).not.toThrow()
  })

  it('Escape keydown on document closes everything', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('community'))
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(result.current.openDropdown).toBeNull()
  })

  it('non-Escape keys are ignored', () => {
    const { result } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('community'))
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(result.current.openDropdown).toBe('community')
  })

  it('callbacks are referentially stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useNavDropdowns())
    const first = result.current
    act(() => result.current.openMenu('contribute'))
    rerender()
    expect(result.current.openMenu).toBe(first.openMenu)
    expect(result.current.closeMenu).toBe(first.closeMenu)
    expect(result.current.scheduleClose).toBe(first.scheduleClose)
    expect(result.current.cancelClose).toBe(first.cancelClose)
    expect(result.current.closeAll).toBe(first.closeAll)
  })

  it('unmount removes the Escape listener and clears pending timers', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { result, unmount } = renderHook(() => useNavDropdowns())
    act(() => result.current.openMenu('github'))
    act(() => result.current.scheduleClose('github'))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(vi.getTimerCount()).toBe(0)
    removeSpy.mockRestore()
  })
})
