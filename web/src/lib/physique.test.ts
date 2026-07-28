import { describe, expect, it } from 'vitest'
import { BODY_TYPES, bodyTypeFromD10 } from '../data/bodyTypes'
import {
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

  it('applies body type to traditional weight', () => {
    const base = computeWeightLbs({
      baseWeightLb: 110,
      heightModifier: 10,
      weightModifier: 4,
      bodyType: 'Fit',
    })
    expect(base).toBe(150)
    const frail = computeWeightLbs({
      baseWeightLb: 110,
      heightModifier: 10,
      weightModifier: 4,
      bodyType: 'Frail',
    })
    expect(frail).toBe(Math.round(150 * 0.72))
  })

  it('rolls physique within plausible human bounds', () => {
    for (let i = 0; i < 20; i++) {
      const { bodyType } = rollRandomBodyType()
      expect(BODY_TYPES).toContain(bodyType)
      const p = rollPhysiqueForSpecies('human', bodyType)
      expect(p.heightInches).toBeGreaterThanOrEqual(58)
      expect(p.heightInches).toBeLessThanOrEqual(76)
      expect(p.weightLbs).toBeGreaterThan(50)
      expect(p.weightLbs).toBeLessThan(400)
    }
  })
})
