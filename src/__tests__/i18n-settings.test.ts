import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, localeNames } from '../i18n/settings'

// ---------------------------------------------------------------------------
// locales
// ---------------------------------------------------------------------------

describe('locales', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(locales)).toBe(true)
    expect(locales.length).toBeGreaterThan(0)
  })

  it('contains only unique values', () => {
    expect(new Set(locales).size).toBe(locales.length)
  })
})

// ---------------------------------------------------------------------------
// defaultLocale
// ---------------------------------------------------------------------------

describe('defaultLocale', () => {
  it('is a member of locales', () => {
    expect(locales).toContain(defaultLocale)
  })
})

// ---------------------------------------------------------------------------
// localeNames
// ---------------------------------------------------------------------------

describe('localeNames', () => {
  it('covers every declared locale', () => {
    for (const locale of locales) {
      expect(localeNames[locale]).toBeTruthy()
    }
  })

  it('has no extra or typo keys beyond declared locales', () => {
    const localeSet = new Set<string>(locales)
    for (const key of Object.keys(localeNames)) {
      expect(localeSet.has(key)).toBe(true)
    }
  })

  it('has the same number of entries as locales', () => {
    expect(Object.keys(localeNames).length).toBe(locales.length)
  })

  it('maps every locale to a non-empty string', () => {
    for (const name of Object.values(localeNames)) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })
})
