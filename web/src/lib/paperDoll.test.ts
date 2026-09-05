import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  buildPaperDollModel,
  dollPaletteForSpecies,
  endowmentSizeScale,
  phallusFineScale,
} from './paperDoll'

describe('paperDoll', () => {
  it('picks ancestry palettes', () => {
    expect(dollPaletteForSpecies('human').id).toBe('human')
    expect(dollPaletteForSpecies('drow').id).toBe('elf')
    expect(dollPaletteForSpecies('duergar').id).toBe('dwarf')
    expect(dollPaletteForSpecies('tiefling').id).toBe('tiefling')
  })

  it('scales endowment tiers', () => {
    expect(endowmentSizeScale('Tiny')).toBeLessThan(endowmentSizeScale('Medium'))
    expect(endowmentSizeScale('Gargantuan')).toBeGreaterThan(endowmentSizeScale('Huge'))
  })

  it('builds a feminine human doll with breasts', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Female'
    c.genitalTrait = 'vaginal'
    c.bodyType = 'Soft'
    c.creatureSize = 'Medium'
    c.endowment = {
      anatomy: 'breasts',
      breastsSize: 'Large',
      vaginaPresent: true,
      vaginaSize: 'Medium',
    }
    const model = buildPaperDollModel(c)
    expect(model.presentation).toBe('feminine')
    expect(model.hasBreasts).toBe(true)
    expect(model.hasPhallus).toBe(false)
    expect(model.breastScale).toBeGreaterThan(1)
    expect(model.bodyWidth).toBeGreaterThan(1)
    expect(model.composition.fat).toBe(model.morph.fat)
    expect(model.morph.fat).toBeGreaterThan(0.4)
    expect(model.features.ears).toBe('round')
  })

  it('builds a masculine doll with phallus fine scale from 1d20', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Male'
    c.genitalTrait = 'phallic'
    c.endowment = {
      anatomy: 'phallus',
      phallusSize: 'Medium',
      phallusLengthDie: 20,
      vaginaPresent: false,
    }
    const model = buildPaperDollModel(c)
    expect(model.hasPhallus).toBe(true)
    expect(model.phallusLengthInches).toBe(6)
    expect(model.phallusScale).toBeGreaterThan(phallusFineScale('Medium', 'Medium', 1))
  })

  it('resolves species features for tiefling', () => {
    const c = createEmptyCharacter()
    c.species = 'tiefling'
    c.genderIdentity = 'Female'
    c.genitalTrait = 'vaginal'
    const model = buildPaperDollModel(c)
    expect(model.features.horns).toBe(true)
    expect(model.features.tail).toBe(true)
    expect(model.features.tailStyle).toBe('thin')
  })

  it('resolves species features for orc', () => {
    const c = createEmptyCharacter()
    c.species = 'orc'
    c.genderIdentity = 'Male'
    c.genitalTrait = 'phallic'
    const model = buildPaperDollModel(c)
    expect(model.features.tusks).toBe(true)
    expect(model.features.ears).toBe('pointed')
  })

  it('muscular body type has high muscle composition', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Male'
    c.bodyType = 'Muscular'
    const model = buildPaperDollModel(c)
    expect(model.composition.muscle).toBeGreaterThan(0.7)
    expect(model.morph.muscle).toBeGreaterThan(0.7)
    expect(model.composition.fat).toBeLessThan(0.3)
  })

  it('frail body type has minimal composition', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Female'
    c.bodyType = 'Frail'
    const model = buildPaperDollModel(c)
    expect(model.composition.muscle).toBeLessThan(0.15)
    expect(model.composition.fat).toBeLessThan(0.15)
  })
})
