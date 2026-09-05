import { describe, expect, it } from 'vitest'
import { BODY_TYPES, bodyTypeFromD10 } from '../data/bodyTypes'
import {
  computePhysiqueFromMods,
  computeWeightLbs,
  formatHeightInches,
  rollPhysiqueForSpecies,
  rollRandomBodyType,
} from './physique'

describe('bodyTypeFromD10', () => {
  it('maps 1–10 onto body types in order', () => {
    expect(bodyTypeFromD10(1)).toBe('Frail')
    expect(bodyTypeFromD10(5)).toBe('Athletic')
    expect(bodyTypeFromD10(10)).toBe('Giant')
  })
})

describe('physique', () => {
  it('formats height as feet and inches', () => {
    expect(formatHeightInches(68)).toBe(`5'8"`)
    expect(formatHeightInches(56)).toBe(`4'8"`)
  })

  it('scales base weight by body type then adds height×weight mods', () => {
    const fit = computeWeightLbs({
      baseWeightLb: 110,
      heightModifier: 10,
      weightModifier: 4,
      bodyType: 'Fit',
    })
    expect(fit).toBe(150)
    const frail = computeWeightLbs({
      baseWeightLb: 110,
      heightModifier: 10,
      weightModifier: 4,
      bodyType: 'Frail',
    })
    expect(frail).toBe(Math.round(110 * 0.5 + 10 * 4))
    const heavyset = computeWeightLbs({
      baseWeightLb: 110,
      heightModifier: 10,
      weightModifier: 4,
      bodyType: 'Heavyset',
    })
    expect(heavyset).toBe(Math.round(110 * 1.5 + 40))
  })

  it('adds Dex to Lithe height mod and Str to Athletic', () => {
    const lithe = computePhysiqueFromMods({
      speciesId: 'human',
      bodyType: 'Lithe',
      heightModifier: 10,
      weightModifier: 4,
      abilityScores: { strength: 10, dexterity: 16 },
    })
    expect(lithe.effectiveHeightModifier).toBe(13)
    expect(lithe.heightInches).toBe(56 + 13)
    expect(lithe.weightLbs).toBe(Math.round(110 * 0.7 + 13 * 4))

    const athletic = computePhysiqueFromMods({
      speciesId: 'human',
      bodyType: 'Athletic',
      heightModifier: 10,
      weightModifier: 4,
      abilityScores: { strength: 18, dexterity: 10 },
    })
    expect(athletic.effectiveHeightModifier).toBe(14)
    expect(athletic.adjustedBaseWeightLb).toBeCloseTo(121)
  })

  it('adds one foot to Giant base height', () => {
    const giant = computePhysiqueFromMods({
      speciesId: 'human',
      bodyType: 'Giant',
      heightModifier: 8,
      weightModifier: 3,
      abilityScores: { strength: 10, dexterity: 10 },
    })
    expect(giant.adjustedBaseHeightInches).toBe(56 + 12)
    expect(giant.heightInches).toBe(56 + 12 + 8)
    expect(giant.weightLbs).toBe(Math.round(110 * 1.3 + 8 * 3))
  })

  it('rolls physique within plausible human bounds', () => {
    for (let i = 0; i < 20; i++) {
      const { bodyType } = rollRandomBodyType()
      expect(BODY_TYPES).toContain(bodyType)
      const p = rollPhysiqueForSpecies('human', bodyType, {
        strength: 10,
        dexterity: 10,
      })
      expect(p.heightInches).toBeGreaterThanOrEqual(58)
      expect(p.heightInches).toBeLessThanOrEqual(88)
      expect(p.weightLbs).toBeGreaterThan(40)
      expect(p.weightLbs).toBeLessThan(500)
    }
  })
})
