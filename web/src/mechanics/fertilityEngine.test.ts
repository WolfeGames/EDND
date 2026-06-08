import { describe, expect, it } from 'vitest'
import {
  conceptionDcFromMotherFertility,
  getFertilityProfileFromCombatant,
  isMotheringGenitalTrait,
  makeConceptionCheck,
} from './fertilityEngine'
import type { PleasureCombatant } from './pleasureTypes'

function combatant(
  partial: Partial<PleasureCombatant> & { id: string; genitalTrait: PleasureCombatant['genitalTrait'] },
): PleasureCombatant {
  return {
    name: partial.name ?? partial.id,
    level: 5,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    sexualityBonus: 3,
    fertilityBonus: 5,
    hasGenitalShift: false,
    wisdomSaveProficient: false,
    modifiers: {},
    ...partial,
  }
}

describe('conceptionDcFromMotherFertility', () => {
  it('is 20 minus mother fertility bonus', () => {
    expect(conceptionDcFromMotherFertility(5)).toBe(15)
    expect(conceptionDcFromMotherFertility(8)).toBe(12)
  })
})

describe('isMotheringGenitalTrait', () => {
  it('marks vaginal-side traits as mothering', () => {
    expect(isMotheringGenitalTrait('vaginal')).toBe(true)
    expect(isMotheringGenitalTrait('cuntboy')).toBe(true)
    expect(isMotheringGenitalTrait('hermaphrodite')).toBe(true)
    expect(isMotheringGenitalTrait('phallic')).toBe(false)
  })
})

describe('makeConceptionCheck', () => {
  it('succeeds when d20 + impregnator fertility meets or beats DC', () => {
    const result = makeConceptionCheck({
      impregnator: combatant({ id: 'a', genitalTrait: 'phallic', fertilityBonus: 6 }),
      mother: combatant({ id: 'b', genitalTrait: 'vaginal', fertilityBonus: 5 }),
      roll: 10,
    })
    expect(result.dc).toBe(15)
    expect(result.total).toBe(16)
    expect(result.conceived).toBe(true)
  })

  it('fails when total is below DC', () => {
    const result = makeConceptionCheck({
      impregnator: combatant({ id: 'a', genitalTrait: 'phallic', fertilityBonus: 2 }),
      mother: combatant({ id: 'b', genitalTrait: 'vaginal', fertilityBonus: 10 }),
      roll: 5,
    })
    expect(result.dc).toBe(10)
    expect(result.total).toBe(7)
    expect(result.conceived).toBe(false)
  })
})

describe('getFertilityProfileFromCombatant', () => {
  it('exposes conception DC for mothering types', () => {
    const profile = getFertilityProfileFromCombatant(
      combatant({ id: 'm', genitalTrait: 'vaginal', fertilityBonus: 7 }),
    )
    expect(profile.conceptionDc).toBe(13)
    expect(profile.conceptionDcFormula).toBe('20 − 7 = 13')
    expect(profile.impregnatorRollFormula).toBeUndefined()
  })

  it('exposes impregnator roll for phallic types', () => {
    const profile = getFertilityProfileFromCombatant(
      combatant({ id: 'p', genitalTrait: 'phallic', fertilityBonus: 4 }),
    )
    expect(profile.conceptionDc).toBeUndefined()
    expect(profile.impregnatorRollFormula).toBe('d20 + 4')
  })
})
