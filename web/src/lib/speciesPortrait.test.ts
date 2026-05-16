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

  it('returns null when biological sex is unset or invalid', () => {
    expect(getDefaultSpeciesPortraitSrc('tiefling', '')).toBeNull()
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Other')).toBeNull()
  })

  it('maps legacy labels to paired art after sanitize', () => {
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Transgender')).toBe(
      '/portraits/tiefling-male.jpg',
    )
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Nonbinary')).toBe(
      '/portraits/tiefling-female.jpg',
    )
  })
})
