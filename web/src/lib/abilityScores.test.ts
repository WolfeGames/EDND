import { describe, expect, it } from 'vitest'
import {
  abilityModifier,
  abilityRollsToSpectacle,
  deriveBeautyClass,
  highestAbilityModifier,
  rollStat4d6DropLowestDetailed,
} from './abilityScores'
import { DICE_SIDES, rollDice, rollDie } from './dice'

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

  it('4d6 drop lowest totals three kept dice', () => {
    const detail = rollStat4d6DropLowestDetailed()
    const kept = detail.dice.filter((_, i) => i !== detail.droppedIndex)
    expect(kept).toHaveLength(3)
    expect(detail.total).toBe(kept.reduce((a, b) => a + b, 0))
    expect(detail.dice[detail.droppedIndex]).toBe(Math.min(...detail.dice))
  })

  it('abilityRollsToSpectacle marks the dropped die', () => {
    const detail = {
      dice: [6, 3, 5, 2] as [number, number, number, number],
      droppedIndex: 3,
      total: 14,
    }
    const dice = abilityRollsToSpectacle({ strength: detail }, { strength: 'STR' })
    expect(dice).toHaveLength(4)
    expect(dice.filter((d) => d.dropped)).toHaveLength(1)
    expect(dice[3]?.value).toBe(2)
    expect(dice[3]?.dropped).toBe(true)
  })
})

describe('dice', () => {
  it('rolls within bounds for each die size', () => {
    for (const sides of DICE_SIDES) {
      for (let i = 0; i < 40; i++) {
        const n = rollDie(sides)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(sides)
      }
    }
  })

  it('rollDice returns the requested count', () => {
    expect(rollDice(3, 8)).toHaveLength(3)
  })
})
