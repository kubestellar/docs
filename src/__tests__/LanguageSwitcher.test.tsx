// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

/**
 * Coverage for src/components/LanguageSwitcher.tsx (0% baseline).
 *
 * The component wraps two structurally-identical dropdown variants
 * ("minimal" and "dropdown") over next-intl navigation. All of the
 * runtime logic — outside-click close, escape-key close, per-locale
 * navigation, no-op when clicking the current locale, and the async
 * transition guard — is only reachable via a jsdom render with the
 * next-intl hooks and the @/i18n/navigation router mocked.
 */

const replaceMock = vi.fn()
const pathnameMock = '/docs/some/page'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock,
}))

// Import AFTER the mocks so the module picks them up.
import LanguageSwitcher, {
  LanguageSwitcherMinimal,
  LanguageSwitcherFull,
} from '../components/LanguageSwitcher'

beforeEach(() => {
  replaceMock.mockClear()
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LanguageSwitcher — dropdown variant (default)', () => {
  it('renders closed by default with the current language label', () => {
    render(<LanguageSwitcher />)
    // Label rendered from localeNames['en']
    expect(screen.getByText('English')).toBeTruthy()
    // Listbox not present until opened
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('opens the listbox when the trigger is clicked', () => {
    render(<LanguageSwitcher />)
    const trigger = screen.getByRole('button', { name: /Current language/ })
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()
    // Options render one per locale
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(1)
  })

  it('closes the listbox when a click occurs outside', () => {
    render(
      <div>
        <div data-testid="outside" />
        <LanguageSwitcher />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /Current language/ }))
    expect(screen.getByRole('listbox')).toBeTruthy()

    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes the listbox when Escape is pressed', () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Current language/ }))
    expect(screen.getByRole('listbox')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes the dropdown without navigating when the current locale is selected', async () => {
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Current language/ }))

    const currentOption = screen
      .getAllByRole('option')
      .find(el => el.getAttribute('aria-selected') === 'true')!
    expect(currentOption).toBeTruthy()

    await act(async () => {
      fireEvent.click(currentOption)
    })

    expect(replaceMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('navigates via router.replace when a different locale is selected', async () => {
    vi.useFakeTimers()
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Current language/ }))

    const otherOption = screen
      .getAllByRole('option')
      .find(el => el.getAttribute('aria-selected') === 'false')!
    expect(otherOption).toBeTruthy()

    await act(async () => {
      fireEvent.click(otherOption)
      // handleLanguageChange awaits a 150ms timeout before router.replace
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(replaceMock).toHaveBeenCalledTimes(1)
    expect(replaceMock.mock.calls[0][0]).toBe(pathnameMock)
    expect(replaceMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ locale: expect.any(String) })
    )
  })

  it('logs and recovers if router.replace throws', async () => {
    vi.useFakeTimers()
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    replaceMock.mockImplementationOnce(() => {
      throw new Error('boom')
    })

    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Current language/ }))
    const otherOption = screen
      .getAllByRole('option')
      .find(el => el.getAttribute('aria-selected') === 'false')!

    await act(async () => {
      fireEvent.click(otherOption)
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(consoleErrSpy).toHaveBeenCalled()
    consoleErrSpy.mockRestore()
  })
})

describe('LanguageSwitcher — minimal variant', () => {
  it('renders the compact trigger with the uppercased locale code', () => {
    render(<LanguageSwitcher variant="minimal" />)
    expect(screen.getByText('EN')).toBeTruthy()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('opens and closes on trigger click', () => {
    render(<LanguageSwitcher variant="minimal" />)
    const trigger = screen.getByRole('button', { name: /Current language/ })
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.click(trigger)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes on outside click', () => {
    render(
      <div>
        <div data-testid="outside" />
        <LanguageSwitcher variant="minimal" />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /Current language/ }))
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

describe('LanguageSwitcher — exported variant wrappers', () => {
  it('LanguageSwitcherMinimal renders the minimal variant', () => {
    render(<LanguageSwitcherMinimal />)
    expect(screen.getByText('EN')).toBeTruthy()
  })

  it('LanguageSwitcherFull renders the full dropdown variant', () => {
    render(<LanguageSwitcherFull />)
    expect(screen.getByText('English')).toBeTruthy()
  })
})
