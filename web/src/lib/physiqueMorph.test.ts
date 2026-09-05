import { describe, expect, it } from 'vitest'
import {
  breastMorphFromEndowmentSize,
  defaultMorphFromBodyType,
  morphToTransforms,
  normalizePhysiqueMorph,
  resolveBaseBlend,
} from './physiqueMorph'
import { buildPaperDollModel } from './paperDoll'
import { resolveDollLayers } from './dollLayers'
import { createEmptyCharacter } from '../types/character'

describe('physiqueMorph', () => {
  it('defaults from body type', () => {
    expect(defaultMorphFromBodyType('Muscular').muscle).toBeGreaterThan(0.7)
    expect(defaultMorphFromBodyType('Soft').fat).toBeGreaterThan(0.4)
    expect(defaultMorphFromBodyType('Frail').legGirth).toBeLessThan(0.4)
  })

  it('maps endowment bust size into morph', () => {
    expect(breastMorphFromEndowmentSize('Tiny')).toBeLessThan(
      breastMorphFromEndowmentSize('Medium'),
    )
    expect(breastMorphFromEndowmentSize('Gargantuan')).toBe(1)
  })

  it('blends nearest body arts from muscle/fat', () => {
    const soft = resolveBaseBlend({
      muscle: 0.2,
      fat: 0.7,
      hipWidth: 0.5,
      legGirth: 0.5,
      breastScale: 0.5,
    })
    expect(soft.some((s) => s.bodyArt === 'soft')).toBe(true)
    expect(soft.reduce((a, s) => a + s.weight, 0)).toBeCloseTo(1, 5)

    const musc = resolveBaseBlend({
      muscle: 0.85,
      fat: 0.15,
      hipWidth: 0.5,
      legGirth: 0.5,
      breastScale: 0.5,
    })
    expect(musc[0]?.bodyArt).toBe('muscular')
  })

  it('produces bust enlarge transforms above midpoint', () => {
    const low = morphToTransforms(normalizePhysiqueMorph({ breastScale: 0.2 }))
    const high = morphToTransforms(normalizePhysiqueMorph({ breastScale: 0.9 }))
    expect(low.showBustOverlay).toBe(false)
    expect(high.showBustOverlay).toBe(true)
    expect(high.bustScale).toBeGreaterThan(1)
    expect(high.hipScaleX).toBeGreaterThan(0.8)
  })

  it('buildPaperDollModel exposes blend + morph for feminine soft', () => {
    const c = createEmptyCharacter()
    c.species = 'human'
    c.genderIdentity = 'Female'
    c.genitalTrait = 'vaginal'
    c.bodyType = 'Soft'
    c.physiqueMorph = { muscle: 0.2, fat: 0.7, breastScale: 0.8, hipWidth: 0.7, legGirth: 0.6 }
    c.endowment = {
      anatomy: 'breasts',
      breastsSize: 'Large',
      vaginaPresent: true,
      vaginaSize: 'Medium',
    }
    const model = buildPaperDollModel(c)
    expect(model.morph.breastScale).toBe(0.8)
    expect(model.transforms.showBustOverlay).toBe(true)
    expect(model.baseBlend.length).toBeGreaterThanOrEqual(1)
    const layers = resolveDollLayers(model)
    expect(layers.filter((l) => l.slot === 'base').length).toBeGreaterThanOrEqual(1)
  })
})
