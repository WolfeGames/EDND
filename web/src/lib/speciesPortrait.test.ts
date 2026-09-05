import { describe, expect, it } from 'vitest'
import {
  getCharacterPortraitSrc,
  getDefaultSpeciesPortraitSrc,
  listPortraitOptionsForCharacter,
  pickRandomPortraitSrc,
  speciesHasPortrait,
} from './speciesPortrait'

describe('getDefaultSpeciesPortraitSrc', () => {
  it('returns base species+gender portrait from manifest', () => {
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Male')).toBe('/portraits/tiefling-m.jpg')
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Female')).toBe('/portraits/tiefling-f.jpg')
  })

  it('resolves legacy dwarf id to hilldwarf portraits', () => {
    expect(getDefaultSpeciesPortraitSrc('dwarf', 'Male')).toBe('/portraits/dwarf-m.jpg')
  })

  it('returns null for unknown species', () => {
    expect(getDefaultSpeciesPortraitSrc('not-a-species', 'Male')).toBeNull()
  })

  it('prefers carnal class role portrait when available', () => {
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Female', 'courtesan')).toBe(
      '/portraits/tiefling-f-courtesan.jpg',
    )
  })
})

describe('listPortraitOptionsForCharacter', () => {
  it('only returns portraits for matching species and gender', () => {
    const opts = listPortraitOptionsForCharacter('human', 'Female')
    expect(opts.length).toBeGreaterThan(0)
    expect(opts.every((o) => o.speciesId === 'human')).toBe(true)
    expect(opts.every((o) => o.variant === 'female' || o.variant === 'they')).toBe(true)
  })
})

describe('pickRandomPortraitSrc', () => {
  it('returns a known portrait for valid species', () => {
    const src = pickRandomPortraitSrc('orc', 'Male')
    expect(src).toMatch(/^\/portraits\/orc-m/)
  })
})

describe('getCharacterPortraitSrc', () => {
  it('uses portraitSrc override when set', () => {
    expect(
      getCharacterPortraitSrc({
        species: 'drow',
        genderIdentity: 'Female',
        portraitSrc: '/portraits/drow-f-busty.jpg',
      }),
    ).toBe('/portraits/drow-f-busty.jpg')
  })

  it('falls back to species default when override unset', () => {
    expect(
      getCharacterPortraitSrc({
        species: 'woodelf',
        genderIdentity: 'Female',
      }),
    ).toBe('/portraits/woodelf-f.jpg')
  })

  it('uses aasimar portrait when species has dedicated art', () => {
    const src = getCharacterPortraitSrc({
      species: 'aasimar',
      genderIdentity: 'Male',
    })
    expect(src).toBe('/portraits/aasimar-m.jpg')
  })
})

describe('speciesHasPortrait', () => {
  it('returns true for species with manifest art', () => {
    expect(speciesHasPortrait('tiefling')).toBe(true)
    expect(speciesHasPortrait('dwarf')).toBe(true)
  })
})
