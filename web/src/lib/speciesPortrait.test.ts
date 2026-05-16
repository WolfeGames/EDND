import { describe, expect, it } from 'vitest'
import { getDefaultSpeciesPortraitSrc } from './speciesPortrait'

describe('getDefaultSpeciesPortraitSrc', () => {
  it('returns paired art for Male and Female', () => {
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Male')).toBe('/portraits/tiefling-male.jpg')
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Female')).toBe(
      '/portraits/tiefling-female.jpg',
    )
  })

  it('returns unisex art for satyr', () => {
    expect(getDefaultSpeciesPortraitSrc('satyr', 'Female')).toBe('/portraits/satyr.jpg')
    expect(getDefaultSpeciesPortraitSrc('satyr', 'Male')).toBe('/portraits/satyr.jpg')
  })

  it('resolves legacy dwarf id to hilldwarf portraits', () => {
    expect(getDefaultSpeciesPortraitSrc('dwarf', 'Female')).toBe(
      '/portraits/hilldwarf-female.png',
    )
  })

  it('returns null for unknown species', () => {
    expect(getDefaultSpeciesPortraitSrc('not-a-species', 'Male')).toBeNull()
  })
})
