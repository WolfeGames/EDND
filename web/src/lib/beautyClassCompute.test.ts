import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  computeTraitBeautyBonus,
  parseBeautyClassBonus,
} from './beautyClassCompute'

describe('parseBeautyClassBonus', () => {
  it('sums flat beauty class bonuses', () => {
    expect(parseBeautyClassBonus('+1 Beauty Class.')).toBe(1)
    expect(parseBeautyClassBonus('+2 to Beauty Class in social settings.')).toBe(2)
    expect(parseBeautyClassBonus('Beauty Class increases by 3')).toBe(3)
  })

  it('ignores set-to values', () => {
    expect(parseBeautyClassBonus('Your Beauty Class becomes 20.')).toBe(0)
  })
})

describe('computeTraitBeautyBonus', () => {
  it('includes racial bonuses for drow', () => {
    const c = createEmptyCharacter()
    c.race = 'drow'
    c.species = 'drow'
    expect(computeTraitBeautyBonus(c)).toBeGreaterThan(0)
  })

  it('includes history bonuses when history selected', () => {
    const c = createEmptyCharacter()
    c.sexualHistory = 'courtesan'
    expect(computeTraitBeautyBonus(c)).toBeGreaterThan(0)
  })
})
