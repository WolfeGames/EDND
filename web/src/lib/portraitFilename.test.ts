import { describe, expect, it } from 'vitest'
import {
  filterPortraitsForCharacter,
  portraitMatchesGender,
  pickDefaultPortraitEntry,
  type PortraitManifestEntry,
} from './portraitFilename'

const sample: PortraitManifestEntry[] = [
  {
    filename: 'tiefling-m.jpg',
    src: '/portraits/tiefling-m.jpg',
    speciesId: 'tiefling',
    genderToken: 'm',
    variantTags: [],
    label: 'Tiefling (male)',
  },
  {
    filename: 'tiefling-f-courtesan.jpg',
    src: '/portraits/tiefling-f-courtesan.jpg',
    speciesId: 'tiefling',
    genderToken: 'f',
    roleId: 'courtesan',
    variantTags: [],
    label: 'Tiefling (female) — Courtesan',
  },
  {
    filename: 'dwarf-m.jpg',
    src: '/portraits/dwarf-m.jpg',
    speciesId: 'hilldwarf',
    genderToken: 'm',
    variantTags: [],
    label: 'Hilldwarf (male)',
  },
]

describe('portraitMatchesGender', () => {
  it('maps f/m tokens to portrait binary genders', () => {
    expect(portraitMatchesGender('m', 'Male')).toBe(true)
    expect(portraitMatchesGender('m', 'Female')).toBe(false)
    expect(portraitMatchesGender('f', 'Female')).toBe(true)
    expect(portraitMatchesGender('f', 'Cuntboy')).toBe(false)
    expect(portraitMatchesGender('they', 'Male')).toBe(true)
  })
})

describe('filterPortraitsForCharacter', () => {
  it('filters by species alias and gender', () => {
    const pool = filterPortraitsForCharacter(sample, 'dwarf', 'Male')
    expect(pool).toHaveLength(1)
    expect(pool[0]?.speciesId).toBe('hilldwarf')
  })

  it('prefers carnal class role when present', () => {
    const pool = filterPortraitsForCharacter(sample, 'tiefling', 'Female', 'courtesan')
    expect(pool.every((p) => p.roleId === 'courtesan')).toBe(true)
  })
})

describe('pickDefaultPortraitEntry', () => {
  it('chooses variant-free base portrait', () => {
    const entry = pickDefaultPortraitEntry(
      filterPortraitsForCharacter(sample, 'tiefling', 'Male'),
    )
    expect(entry?.filename).toBe('tiefling-m.jpg')
  })
})
