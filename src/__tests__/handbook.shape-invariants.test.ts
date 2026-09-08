/**
 * Shape-invariants for src/app/[locale]/contribute-handbook/handbook.ts.
 *
 * `handbookCards` is the data source rendered by the Community Handbook
 * page (`src/app/[locale]/contribute-handbook/page.tsx`). It ships:
 *
 *   - a stable `id` used as a React key,
 *   - an inline SVG `iconPath` fed into a shared icon component,
 *   - bg/icon Tailwind color classes selected by design,
 *   - a `link` that MUST resolve inside `/docs/contributing/` because that
 *     is the shared-section route wired up in
 *     `src/app/docs/page-map.ts::buildNavNodes`. A typo like
 *     `"/docs/contribute/…"` or a missing leading slash would silently
 *     dead-end the handbook cards — no compile error, no runtime error.
 *
 * Nothing in `src/__tests__/` imported this module before this file
 * (companion invariants tests already exist for `programs/programs.ts`
 * via versions.shape-invariants patterns). These tests are pure data
 * checks — they run in milliseconds and catch every class of "someone
 * edited the JSON and broke a card" regression the codebase has hit on
 * peer data modules.
 */
import { describe, it, expect } from 'vitest'
import { handbookCards, type HandbookCard } from '@/app/[locale]/contribute-handbook/handbook'

describe('handbookCards — shape invariants', () => {
  it('exports at least one card', () => {
    expect(Array.isArray(handbookCards)).toBe(true)
    expect(handbookCards.length).toBeGreaterThan(0)
  })

  it('each card has every required non-empty string field', () => {
    const required: (keyof HandbookCard)[] = [
      'id',
      'iconType',
      'iconPath',
      'bgColor',
      'iconColor',
      'link',
    ]
    for (const card of handbookCards) {
      for (const key of required) {
        expect(typeof card[key]).toBe('string')
        expect((card[key] as string).length).toBeGreaterThan(0)
      }
    }
  })

  it('card ids are unique (React key stability)', () => {
    const ids = handbookCards.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every link starts with /docs/contributing/', () => {
    // buildNavNodes in src/app/docs/page-map.ts routes shared-section
    // pages under /docs/contributing/... — a typo here would silently
    // 404 the handbook card.
    for (const card of handbookCards) {
      expect(card.link).toMatch(/^\/docs\/contributing\//)
    }
  })

  it('no link contains a whitespace character', () => {
    for (const card of handbookCards) {
      expect(card.link).not.toMatch(/\s/)
    }
  })

  it('links are unique', () => {
    const links = handbookCards.map(c => c.link)
    expect(new Set(links).size).toBe(links.length)
  })

  it('bgColor uses a Tailwind bg-*-500/20 or bg-*/20 rgba token', () => {
    // Design system contract: opacity-20 background pill. A regression
    // to solid bg-*-500 (no /20) would visually dominate the card.
    for (const card of handbookCards) {
      expect(card.bgColor).toMatch(/^bg-[a-z]+-\d{2,3}\/\d+$/)
    }
  })

  it('iconColor uses a Tailwind text-*-400 token', () => {
    // Design system contract: text-*-400 icon on the /20 background.
    for (const card of handbookCards) {
      expect(card.iconColor).toMatch(/^text-[a-z]+-\d{2,3}$/)
    }
  })

  it('iconType is kebab-case (matches the shared icon lookup keys)', () => {
    for (const card of handbookCards) {
      expect(card.iconType).toMatch(/^[a-z][a-z0-9-]*[a-z0-9]$/)
    }
  })

  it('iconPath contains only SVG path-data characters', () => {
    // SVG `d=` attribute allowed chars: command letters, digits,
    // decimal point, comma, whitespace, minus. Anything else would
    // break the raw SVG the page inlines.
    for (const card of handbookCards) {
      expect(card.iconPath).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/)
    }
  })

  it('iconPath begins with a valid SVG move-to command (M or m)', () => {
    for (const card of handbookCards) {
      expect(card.iconPath).toMatch(/^[Mm]/)
    }
  })
})
