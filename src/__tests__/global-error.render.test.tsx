// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'

/**
 * Coverage for src/app/global-error.tsx.
 *
 * This is the app's only error boundary (no per-route error.tsx exists),
 * so it is the sole place a root-render crash becomes observable. Before
 * this test/fix, the `error` prop (including Next.js's server-log
 * correlating `digest`) was destructured out and never used anywhere —
 * a caught crash produced no console output, no log line, nothing.
 * This asserts the boundary now logs it via console.error, matching the
 * pattern already used elsewhere in this codebase (e.g.
 * src/components/master-page/HeroSection.tsx).
 */

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('GlobalError', () => {
  it('logs the caught error (message + digest) via console.error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { default: GlobalError } = await import('@/app/global-error')

    const error = Object.assign(new Error('boom'), { digest: 'abc123' })
    const reset = vi.fn()

    await act(async () => {
      render(<GlobalError error={error} reset={reset} />)
    })

    expect(errSpy).toHaveBeenCalledWith(
      'Unhandled root render error',
      expect.objectContaining({ message: 'boom', digest: 'abc123' }),
    )
  })

  it('renders the fallback UI and wires the reset button', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { default: GlobalError } = await import('@/app/global-error')

    const error = new Error('boom')
    const reset = vi.fn()

    const { getByText } = render(<GlobalError error={error} reset={reset} />)
    expect(getByText('Something went wrong')).toBeTruthy()

    const tryAgain = getByText('Try again')
    tryAgain.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(reset).toHaveBeenCalled()
  })

  it('does not throw when the error has no digest', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { default: GlobalError } = await import('@/app/global-error')

    const error = new Error('no digest here')
    const reset = vi.fn()

    await act(async () => {
      expect(() => render(<GlobalError error={error} reset={reset} />)).not.toThrow()
    })

    expect(errSpy).toHaveBeenCalledWith(
      'Unhandled root render error',
      expect.objectContaining({ message: 'no digest here', digest: undefined }),
    )
  })
})
