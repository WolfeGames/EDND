import { describe, expect, it } from 'vitest'
import { abilityModifier, deriveBeautyClass, highestAbilityModifier } from './abilityScores'

describe('abilityScores', () => {
  it('abilityModifier matches 5e', () => {
    expect(abilityModifier(10)).toBe(0)
    expect(abilityModifier(12)).toBe(1)
    expect(abilityModifier(8)).toBe(-1)
    expect(abilityModifier(20)).toBe(5)
  })

  it('highestAbilityModifier picks max mod', () => {
    expect(
      highestAbilityModifier({
        strength: 8,
        dexterity: 10,
        constitution: 10,
        intelligence: 18,
        wisdom: 10,
        charisma: 10,
      }),
    ).toBe(4)
  })

  it('deriveBeautyClass uses highest mod and other modifiers', () => {
    const scores = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 14,
      wisdom: 10,
      charisma: 10,
    }
    expect(deriveBeautyClass(scores, 0)).toBe(12)
    expect(deriveBeautyClass(scores, 2)).toBe(14)
  })
})
