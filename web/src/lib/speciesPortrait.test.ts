import { describe, expect, it } from 'vitest'
import { getDefaultSpeciesPortraitSrc } from './speciesPortrait'

describe('getDefaultSpeciesPortraitSrc', () => {
  it('returns paired art for Male and Female', () => {
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Male')).toBe('/portraits/tiefling-male.jpg')
    expect(getDefaultSpeciesPortraitSrc('tiefling', 'Female')).toBe(
      '/portraits/tiefling-female.jpg',
    )
  })

  it('returns subrace-specific elf portraits', () => {
    expect(getDefaultSpeciesPortraitSrc('drow', 'Male')).toBe('/portraits/drow-male.png')
    expect(getDefaultSpeciesPortraitSrc('woodelf', 'Female')).toBe(
      '/portraits/woodelf-female.png',
    )
    expect(getDefaultSpeciesPortraitSrc('highelf', 'Male')).toBe('/portraits/highelf-male.png')
  })

  it('returns unisex art for satyr', () => {
    expect(getDefaultSpeciesPortraitSrc('satyr', 'Female')).toBe('/portraits/satyr.jpg')
    expect(getDefaultSpeciesPortraitSrc('satyr', 'Male')).toBe('/portraits/satyr.jpg')
  })

  it('does not map ambiguous legacy elf to high elf portraits', () => {
    expect(getDefaultSpeciesPortraitSrc('elf', 'Female')).toBeNull()
    expect(getDefaultSpeciesPortraitSrc('elf', 'Male')).toBeNull()
  })

  it('does not map ambiguous legacy dwarf to hill dwarf portraits', () => {
    expect(getDefaultSpeciesPortraitSrc('dwarf', 'Female')).toBeNull()
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
