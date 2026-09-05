import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  endowmentTierFromScale,
  hasDollBaseLayer,
  resolveDollLayers,
} from './dollLayers'
import {
  bodyArtKey,
  buildPaperDollModel,
  hairStyleKey,
  presentationArtKey,
} from './paperDoll'

describe('dollLayers', () => {
  it('maps Soft feminine character to soft fem base without placeholder hair covering the face', () => {
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
    expect(bodyArtKey(model.composition, model.bodyType)).toBe('soft')
    expect(presentationArtKey(model.presentation)).toBe('fem')
    expect(hairStyleKey(model.presentation)).toBe('long')

    const layers = resolveDollLayers(model)
    expect(hasDollBaseLayer(layers)).toBe(true)
    expect(layers.some((l) => l.id === 'base-fem-soft')).toBe(true)
    // Breast tier overlays skipped while Grok bases bake breasts into the body art.
    expect(layers.some((l) => l.slot === 'breasts')).toBe(false)
    expect(layers.some((l) => l.id === 'vagina-present')).toBe(true)
    expect(layers.some((l) => l.slot === 'phallus')).toBe(false)
    // Placeholder hair disabled — it was a gray blob over painted faces.
    expect(layers.some((l) => l.slot === 'hair')).toBe(false)
    expect(layers.find((l) => l.slot === 'base')?.tintFilter).toBeNull()
  })

  it('maps muscular male to muscular masc base + phallus, no breasts', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Male'
    c.genitalTrait = 'phallic'
    c.bodyType = 'Muscular'
    c.endowment = {
      anatomy: 'phallus',
      phallusSize: 'Medium',
      vaginaPresent: false,
    }
    const model = buildPaperDollModel(c)
    const layers = resolveDollLayers(model)
    expect(layers.some((l) => l.id === 'base-masc-muscular')).toBe(true)
    expect(layers.some((l) => l.id === 'phallus-medium')).toBe(true)
    expect(layers.some((l) => l.slot === 'breasts')).toBe(false)
    expect(layers.some((l) => l.slot === 'hair')).toBe(false)
  })

  it('adds tiefling horns and thin tail', () => {
    const c = createEmptyCharacter()
    c.species = 'tiefling'
    c.genderIdentity = 'Female'
    c.genitalTrait = 'vaginal'
    c.bodyType = 'Fit'
    c.endowment = {
      anatomy: 'breasts',
      breastsSize: 'Medium',
      vaginaPresent: true,
      vaginaSize: 'Medium',
    }
    const layers = resolveDollLayers(buildPaperDollModel(c))
    expect(layers.some((l) => l.id === 'feature-horns')).toBe(true)
    expect(layers.some((l) => l.id === 'feature-tail-thin')).toBe(true)
    expect(layers[0]?.slot).toBe('tail')
  })

  it('adds orc tusks and pointed ears', () => {
    const c = createEmptyCharacter()
    c.species = 'orc'
    c.genderIdentity = 'Male'
    c.genitalTrait = 'phallic'
    c.endowment = {
      anatomy: 'phallus',
      phallusSize: 'Large',
      vaginaPresent: false,
    }
    const layers = resolveDollLayers(buildPaperDollModel(c))
    expect(layers.some((l) => l.id === 'feature-tusks')).toBe(true)
    expect(layers.some((l) => l.id === 'feature-ears-pointed')).toBe(true)
  })

  it('omits phallus layer when character has no phallus', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Female'
    c.genitalTrait = 'vaginal'
    c.endowment = {
      anatomy: 'breasts',
      breastsSize: 'Small',
      vaginaPresent: true,
      vaginaSize: 'Small',
    }
    const layers = resolveDollLayers(buildPaperDollModel(c))
    expect(layers.some((l) => l.slot === 'phallus')).toBe(false)
  })

  it('applies phallus length fine-scale when die is set', () => {
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
    const layers = resolveDollLayers(buildPaperDollModel(c))
    const ph = layers.find((l) => l.slot === 'phallus')
    expect(ph).toBeTruthy()
    expect(ph!.scaleY).toBeGreaterThan(1)
  })

  it('collapses body types into four art keys', () => {
    expect(bodyArtKey({ muscle: 0.05, fat: 0.05, heightBonus: 0 }, 'Frail')).toBe('slim')
    expect(bodyArtKey({ muscle: 0.4, fat: 0.18, heightBonus: 0 }, 'Fit')).toBe('fit')
    expect(bodyArtKey({ muscle: 0.15, fat: 0.45, heightBonus: 0 }, 'Soft')).toBe('soft')
    expect(bodyArtKey({ muscle: 0.8, fat: 0.15, heightBonus: 0 }, 'Muscular')).toBe('muscular')
    expect(bodyArtKey({ muscle: 0.65, fat: 0.12, heightBonus: 0 }, 'Athletic')).toBe('muscular')
  })

  it('picks closest endowment tier from scale', () => {
    expect(endowmentTierFromScale(0.45)).toBe('Tiny')
    expect(endowmentTierFromScale(1)).toBe('Medium')
    expect(endowmentTierFromScale(2.2)).toBe('Gargantuan')
  })

  it('orders layers back-to-front', () => {
    const c = createEmptyCharacter()
    c.species = 'tiefling'
    c.genderIdentity = 'Female'
    c.genitalTrait = 'vaginal'
    c.bodyType = 'Fit'
    c.endowment = {
      anatomy: 'breasts',
      breastsSize: 'Medium',
      vaginaPresent: true,
      vaginaSize: 'Medium',
    }
    const layers = resolveDollLayers(buildPaperDollModel(c))
    const z = layers.map((l) => l.zIndex)
    expect(z).toEqual([...z].sort((a, b) => a - b))
  })
})
