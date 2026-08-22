import { describe, it, expect } from 'vitest'
import {
  programs,
  getProgramById,
  getAllPrograms,
} from '../app/[locale]/programs/programs'

// ---------------------------------------------------------------------------
// programs data validation
// ---------------------------------------------------------------------------

describe('programs data', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(programs)).toBe(true)
    expect(programs.length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = programs.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every program has required scalar fields populated', () => {
    for (const program of programs) {
      expect(program.id).toBeTruthy()
      expect(program.name).toBeTruthy()
      expect(program.fullName).toBeTruthy()
      expect(program.description).toBeTruthy()
      expect(program.logo).toBeTruthy()
      expect(typeof program.isPaid).toBe('boolean')
    }
  })

  it('every program has a fully populated theme', () => {
    for (const program of programs) {
      expect(program.theme.gradient).toBeTruthy()
      expect(program.theme.primaryColor).toBeTruthy()
      expect(program.theme.secondaryColor).toBeTruthy()
      expect(Array.isArray(program.theme.floatingShapes)).toBe(true)
      expect(program.theme.floatingShapes.length).toBeGreaterThan(0)
    }
  })

  it('every program has fully populated sections', () => {
    for (const program of programs) {
      const { sections } = program
      expect(sections.benefits).toBeTruthy()
      expect(sections.description).toBeTruthy()
      expect(sections.overview).toBeTruthy()
      expect(sections.eligibility).toBeTruthy()
      expect(sections.timeline).toBeTruthy()
      expect(sections.structure).toBeTruthy()
      expect(sections.howToApply).toBeTruthy()
    }
  })

  it('every program has at least one valid resource with a name and url', () => {
    for (const program of programs) {
      expect(Array.isArray(program.sections.resources)).toBe(true)
      expect(program.sections.resources.length).toBeGreaterThan(0)
      for (const resource of program.sections.resources) {
        expect(resource.name).toBeTruthy()
        expect(resource.url).toBeTruthy()
        expect(() => new URL(resource.url)).not.toThrow()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// getProgramById
// ---------------------------------------------------------------------------

describe('getProgramById', () => {
  it('returns the matching program for every known id', () => {
    for (const program of programs) {
      expect(getProgramById(program.id)).toEqual(program)
    }
  })

  it('returns undefined for an unknown id', () => {
    expect(getProgramById('nonexistent-program')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getProgramById('')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getAllPrograms
// ---------------------------------------------------------------------------

describe('getAllPrograms', () => {
  it('returns the same reference as the programs array', () => {
    expect(getAllPrograms()).toBe(programs)
  })

  it('has the same length as programs', () => {
    expect(getAllPrograms().length).toBe(programs.length)
  })
})
