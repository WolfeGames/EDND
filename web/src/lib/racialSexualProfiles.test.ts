import { describe, expect, it } from 'vitest'
import {
  getRacialProfileSheetMechanics,
  getRacialSexualProfileSections,
  SPECIES_PROFILE_KEYS,
} from './racialSexualProfiles'
import profilesBundle from '../data/tables/racial-sexual-profiles.json'

describe('getRacialSexualProfileSections', () => {
  it('stacks elf ancestry + high elf subrace', () => {
    const sections = getRacialSexualProfileSections('highelf')
    expect(sections.map((s) => s.raceKey)).toEqual(['Elves', 'HighElves'])
    expect(sections[1].isSubrace).toBe(true)
  })

  it('returns dwarf profile for hill dwarf', () => {
    const sections = getRacialSexualProfileSections('hilldwarf')
    expect(sections).toHaveLength(1)
    expect(sections[0].raceKey).toBe('Dwarves')
    expect(sections[0].profile.specialFeatures?.Stonefever).toBeDefined()
  })

  it('returns empty for species without glossary', () => {
    expect(getRacialSexualProfileSections('tabaxi')).toEqual([])
  })
})

describe('getRacialProfileSheetMechanics', () => {
  it('applies high elf beauty bonus', () => {
    const m = getRacialProfileSheetMechanics('highelf')
    expect(m.beautyClassBonus).toBe(1)
    expect(m.beautyClassNote).toContain('High Elves')
  })
})

describe('species profile mapping', () => {
  it('every mapped key exists in JSON races', () => {
    const races = profilesBundle.racialSexualProfiles.races
    for (const keys of Object.values(SPECIES_PROFILE_KEYS)) {
      for (const key of keys) {
        expect(races[key as keyof typeof races], `missing race ${key}`).toBeDefined()
      }
    }
  })
})
