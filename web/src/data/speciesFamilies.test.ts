import { describe, expect, it } from 'vitest'
import {
  SPECIES_FAMILIES,
  allFamilySpeciesIds,
  familyForSpeciesId,
  speciesMissingFromFamilies,
} from './speciesFamilies'
import { species } from './registry'

describe('speciesFamilies', () => {
  it('covers every species table id exactly once', () => {
    const ids = allFamilySpeciesIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect(speciesMissingFromFamilies()).toEqual([])
    expect(ids.sort()).toEqual(species.map((s) => s.id).sort())
  })

  it('maps duergar and drow to dwarf/elf parent groups', () => {
    expect(familyForSpeciesId('duergar')?.id).toBe('dwarf')
    expect(familyForSpeciesId('drow')?.id).toBe('elf')
    expect(familyForSpeciesId('airgenasi')?.id).toBe('genasi')
  })

  it('lists multi-lineage families with more than one member', () => {
    const dwarf = SPECIES_FAMILIES.find((f) => f.id === 'dwarf')
    const elf = SPECIES_FAMILIES.find((f) => f.id === 'elf')
    expect(dwarf?.members.map((m) => m.speciesId)).toEqual([
      'hilldwarf',
      'mountaindwarf',
      'duergar',
    ])
    expect(elf?.members.map((m) => m.speciesId)).toEqual(['highelf', 'woodelf', 'drow'])
  })
})
