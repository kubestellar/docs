import { describe, it, expect } from 'vitest'
import {
  handbookCards,
  type HandbookCard,
} from '../app/[locale]/contribute-handbook/handbook'

// ---------------------------------------------------------------------------
// handbook data validation
//
// handbook.ts exports a static data array that drives the community
// handbook grid in src/app/[locale]/contribute-handbook/. Nothing in
// src/__tests__/ currently covers this file, so a template regression that
// duplicated an id, dropped a Tailwind class prefix, or left an SVG
// iconPath empty would render broken cards in production without CI
// noticing. These invariants pin the shape and the specific value
// classes each field must belong to.
// ---------------------------------------------------------------------------

describe('handbookCards data shape', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(handbookCards)).toBe(true)
    expect(handbookCards.length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = handbookCards.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every card has all required scalar fields populated (non-empty strings)', () => {
    for (const card of handbookCards) {
      expect(typeof card.id).toBe('string')
      expect(card.id).not.toBe('')
      expect(typeof card.iconType).toBe('string')
      expect(card.iconType).not.toBe('')
      expect(typeof card.iconPath).toBe('string')
      expect(card.iconPath).not.toBe('')
      expect(typeof card.bgColor).toBe('string')
      expect(card.bgColor).not.toBe('')
      expect(typeof card.iconColor).toBe('string')
      expect(card.iconColor).not.toBe('')
      expect(typeof card.link).toBe('string')
      expect(card.link).not.toBe('')
    }
  })

  it('every card link is an internal docs path under /docs/contributing/', () => {
    // Every handbook card should link to a contributing-docs page; an
    // external URL or a top-level /docs page here would misroute the
    // handbook grid.
    for (const card of handbookCards) {
      expect(card.link, `${card.id} link`).toMatch(/^\/docs\/contributing\//)
    }
  })

  it('every card bgColor is a Tailwind bg-<color>-500/20 class', () => {
    // The grid layout relies on the semi-transparent /20 tint. If a
    // future edit drops the /20 or uses a bare bg-<color>, the card
    // background contrast will silently break. Keep this contract
    // explicit.
    for (const card of handbookCards) {
      expect(card.bgColor, `${card.id} bgColor`).toMatch(/^bg-[a-z]+-500\/20$/)
    }
  })

  it('every card iconColor is a Tailwind text-<color>-400 class', () => {
    for (const card of handbookCards) {
      expect(card.iconColor, `${card.id} iconColor`).toMatch(/^text-[a-z]+-400$/)
    }
  })

  it('bgColor and iconColor use the same Tailwind color family', () => {
    // e.g. bg-blue-500/20 must pair with text-blue-400. Cross-family
    // pairings (bg-blue with text-green) would land as an accidental
    // theme regression.
    for (const card of handbookCards) {
      const bgHue = card.bgColor.match(/^bg-([a-z]+)-500\/20$/)?.[1]
      const iconHue = card.iconColor.match(/^text-([a-z]+)-400$/)?.[1]
      expect(bgHue, `${card.id} bgColor hue`).toBeTruthy()
      expect(iconHue, `${card.id} iconColor hue`).toBeTruthy()
      expect(iconHue).toBe(bgHue)
    }
  })

  it('iconPath looks like an SVG path data string', () => {
    // Every iconPath is used verbatim as the `d` attribute of an SVG
    // <path>. Real path data always contains at least one command
    // letter; a bare number or empty string would render nothing.
    for (const card of handbookCards) {
      expect(card.iconPath, `${card.id} iconPath`).toMatch(/[MmLlHhVvCcSsQqTtAaZz]/)
    }
  })

  it('is assignable to HandbookCard[] at the type layer', () => {
    // The array must round-trip through the exported interface without
    // widening. This catches accidental shape drift when a new card is
    // added without matching type edits.
    const typed: HandbookCard[] = handbookCards
    expect(typed).toBe(handbookCards)
  })
})
