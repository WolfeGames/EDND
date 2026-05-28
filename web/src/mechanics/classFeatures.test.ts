import { describe, expect, it } from 'vitest'
import { computeClassFeatureAdjustments } from './applyClassFeatures'
import { createPleasureState, resolveStimulation } from './pleasureEngine'
import type { PleasureCombatant } from './pleasureTypes'

const fixedRng = () => 0.99

function combatant(partial: Partial<PleasureCombatant> & { id: string }): PleasureCombatant {
  return {
    name: partial.name ?? partial.id,
    level: 5,
    abilityScores: {
      strength: 10,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 16,
    },
    sexualityBonus: 3,
    genitalTrait: 'phallic',
    fertilityBonus: 5,
    hasGenitalShift: false,
    wisdomSaveProficient: false,
    modifiers: {},
    ...partial,
  }
}

describe('computeClassFeatureAdjustments', () => {
  it('Siren adds Bliss die on Dex stimulation', () => {
    const attacker = combatant({ id: 'siren', carnalClassId: 'siren', level: 5 })
    const target = combatant({ id: 'tgt' })
    const adj = computeClassFeatureAdjustments(
      attacker,
      target,
      { pleasureRoll: 2, stimulationAbility: 'dexterity' },
      fixedRng,
    )
    expect(adj.pleasureDealtBonus).toBeGreaterThan(0)
    expect(adj.features.some((f) => f.id === 'siren-bliss-die')).toBe(true)
  })

  it('Ravager in Lust adds dealt bonus and reduces received', () => {
    const attacker = combatant({
      id: 'rav',
      carnalClassId: 'ravager',
      encounter: { lustActive: true, lustBonus: 3 },
    })
    const target = combatant({
      id: 'tgt',
      carnalClassId: 'ravager',
      encounter: { lustActive: true, lustBonus: 3 },
    })
    const adj = computeClassFeatureAdjustments(
      attacker,
      target,
      { pleasureRoll: 2, position: 'Missionary' },
      fixedRng,
    )
    expect(adj.pleasureDealtBonus).toBeGreaterThanOrEqual(3)
    expect(adj.targetPleasureReceivedBonus).toBeLessThan(0)
    expect(adj.sexualityBonusBonus).toBe(3)
    expect(adj.features.some((f) => f.id === 'ravager-need-to-breed')).toBe(true)
  })
})

describe('resolveStimulation with class features', () => {
  it('includes classFeatureEffects on result', () => {
    const attacker = combatant({
      id: 'siren',
      carnalClassId: 'siren',
      encounter: {},
    })
    const target = combatant({ id: 'tgt' })
    const state = createPleasureState(target, { isAroused: true, maxPleasurePoints: 20 })
    const result = resolveStimulation(
      attacker,
      target,
      state,
      {
        pleasureRoll: 2,
        stimulationAbility: 'charisma',
        isPerformance: true,
        audiencePresent: true,
        skipArousalCheck: true,
      },
      fixedRng,
    )
    expect(result.classFeatureEffects?.length).toBeGreaterThan(0)
    expect(result.pleasureDealt).toBeGreaterThan(2)
  })
})
