/**
 * Tests for small pure-data / pure-config exports that would otherwise sit at
 * 0% coverage. Each of these modules is imported by the runtime (or by Next.js
 * itself for `robots.ts`), so any accidental syntax error or shape change
 * would only surface at build time. Adding cheap import + shape assertions
 * catches those regressions in the vitest run.
 */
import { describe, test, expect } from 'vitest'

import robots from '../app/robots'
import {
  handbookCards,
  type HandbookCard,
} from '../app/[locale]/contribute-handbook/handbook'
import { COLORS } from '../components/animations/globe/colors'

describe('app/robots.ts', () => {
  const config = robots()

  test('allows all user agents at the site root', () => {
    // Next.js accepts either a single rule object or an array; this module
    // uses the single-object form. If that ever changes to an array (which
    // Next.js also allows), the assertions below must be updated.
    expect(Array.isArray(config.rules)).toBe(false)
    const rules = config.rules as { userAgent: string; allow: string }
    expect(rules.userAgent).toBe('*')
    expect(rules.allow).toBe('/')
  })

  test('advertises the sitemap on the production origin', () => {
    // The sitemap URL must be an absolute https URL pointing at the
    // production origin — a relative path would cause search engines to
    // resolve it against whatever origin they happened to crawl from.
    expect(config.sitemap).toBe('https://kubestellar.io/sitemap.xml')
  })

  test('is stable across calls (no per-request state)', () => {
    // robots() is invoked by Next.js at build time; the second invocation
    // must return an equivalent shape (not a mutation of the first).
    expect(robots()).toEqual(config)
  })
})

describe('contribute-handbook/handbook.ts', () => {
  test('exports at least one card', () => {
    expect(handbookCards.length).toBeGreaterThan(0)
  })

  test('every card has the required non-empty fields', () => {
    const required: Array<keyof HandbookCard> = [
      'id',
      'iconType',
      'iconPath',
      'bgColor',
      'iconColor',
      'link',
    ]
    for (const card of handbookCards) {
      for (const key of required) {
        expect(card[key], `card ${card.id} missing ${key}`).toBeTruthy()
        expect(typeof card[key]).toBe('string')
      }
    }
  })

  test('card ids are unique', () => {
    // The id is used as a React key when rendering the handbook grid; a
    // duplicate would silently drop a card and log a React warning.
    const ids = handbookCards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every card link is a docs route', () => {
    // Handbook cards deep-link into the docs contributor section; if any of
    // these become non-`/docs/contributing/` we want a loud test failure so
    // the reviewer confirms the redirect intent.
    for (const card of handbookCards) {
      expect(card.link.startsWith('/docs/contributing/')).toBe(true)
    }
  })

  test('bgColor and iconColor use tailwind class prefixes', () => {
    // These fields are rendered directly into className, so they must be
    // strings that look like Tailwind classes rather than raw CSS colors.
    for (const card of handbookCards) {
      expect(card.bgColor).toMatch(/^bg-/)
      expect(card.iconColor).toMatch(/^text-/)
    }
  })
})

describe('animations/globe/colors.ts', () => {
  test('exposes every documented theme slot as a hex color', () => {
    const slots = [
      'primary',
      'secondary',
      'highlight',
      'success',
      'background',
      'accent1',
      'accent2',
      'aiTraining',
      'aiInference',
    ] as const
    for (const slot of slots) {
      const v = COLORS[slot]
      expect(v, `missing ${slot}`).toBeTruthy()
      // #rgb or #rrggbb — no rgba/hsl, matching the current palette shape.
      expect(v).toMatch(/^#[0-9a-fA-F]{3,8}$/)
    }
  })
})
