import { describe, expect, it } from 'vitest'
import type { EdndCharacter } from '../types/character'
import {
  beginOrgasmSave,
  calculateBeautyClass,
  calculateMaxPleasure,
  createPleasureState,
  orgasmSaveDc,
  resolveOrgasmSaveRoll,
  resolveQuickEncounter,
  resolveStimulation,
} from './pleasureEngine'

function minimalCharacter(overrides: Partial<EdndCharacter> = {}): EdndCharacter {
  return {
    id: 'test-1',
    name: 'Test',
    pronouns: 'they/them',
    species: 'human',
    race: 'human',
    level: 5,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 12,
    },
    eroticTraits: {
      carnalSkillProficiencies: [],
      positionProficiencies: [],
      eroticToolProficiencies: [],
      beautyClass: 12,
      beautyModifier: 0,
      sexualityBonus: 3,
      attraction: '',
      repulsion: '',
      sexualMorality: '',
      orientation: '',
    },
    ...overrides,
  }
}

describe('calculateBeautyClass', () => {
  it('returns base + ability mod total', () => {
    const c = minimalCharacter()
    const result = calculateBeautyClass(c)
    expect(result.total).toBe(12)
    expect(result.base).toBe(10)
    expect(result.abilityMod).toBe(2)
  })
})

describe('calculateMaxPleasure', () => {
  it('sums sex die, CON, sexuality, and level', () => {
    const c = minimalCharacter({ level: 5 })
    const result = calculateMaxPleasure(c)
    expect(result.max).toBe(8 + 2 + 3 + 5)
    expect(result.usedClassOverride).toBe(false)
  })
})

describe('resolveStimulation', () => {
  it('subtracts pleasure from remaining capacity', () => {
    const actor = minimalCharacter()
    const recipient = minimalCharacter()
    const state = createPleasureState(recipient, 20)
    const result = resolveStimulation(
      actor,
      recipient,
      { actor, recipient, dieResult: 4, sourceCount: 2 },
      state,
    )
    expect(result.pleasureTaken).toBeGreaterThan(0)
    expect(result.recipientState.current).toBeLessThan(state.current)
  })

  it('halves pleasure when recipient is not Aroused', () => {
    const actor = minimalCharacter()
    const recipient = minimalCharacter()
    const state = createPleasureState(recipient, 20)
    const raw = resolveStimulation(
      actor,
      recipient,
      {
        actor,
        recipient,
        dieResult: 10,
        sourceCount: 0,
        recipientIsAroused: true,
      },
      state,
    )
    const resisted = resolveStimulation(
      actor,
      recipient,
      {
        actor,
        recipient,
        dieResult: 10,
        sourceCount: 0,
        recipientIsAroused: false,
      },
      state,
    )
    expect(resisted.pleasureTaken).toBe(Math.floor(raw.pleasureTaken / 2))
  })

  it('applies Refractory immunity', () => {
    const actor = minimalCharacter()
    const recipient = minimalCharacter()
    const state: ReturnType<typeof createPleasureState> = {
      ...createPleasureState(recipient, 10),
      conditions: ['Refractory'],
    }
    const result = resolveStimulation(
      actor,
      recipient,
      { actor, recipient, dieResult: 10, sourceCount: 3 },
      state,
    )
    expect(result.pleasureTaken).toBe(0)
    expect(result.recipientState.current).toBe(10)
  })
})

describe('orgasm save flow', () => {
  it('tracks successes toward edge', () => {
    const state = beginOrgasmSave(createPleasureState(minimalCharacter(), 5), 12)
    const roll = resolveOrgasmSaveRoll({
      state,
      d20: 15,
      constitutionMod: 2,
      sexualityBonus: 3,
    })
    expect(roll.success).toBe(true)
    expect(roll.state.orgasmSave?.successes).toBe(1)
  })

  it('climaxes after three failures', () => {
    let state = beginOrgasmSave(createPleasureState(minimalCharacter(), 3), 25)
    for (let i = 0; i < 3; i++) {
      const r = resolveOrgasmSaveRoll({
        state,
        d20: 2,
        constitutionMod: 0,
        sexualityBonus: 0,
      })
      state = r.state
      if (r.outcome === 'climax') break
    }
    expect(state.conditions).toContain('Refractory')
    expect(state.orgasmSave).toBeNull()
  })
})

describe('resolveQuickEncounter', () => {
  it('includes ledger and meta', () => {
    const actor = minimalCharacter()
    const recipient = minimalCharacter()
    const state = createPleasureState(recipient)
    const result = resolveQuickEncounter({
      actor,
      recipient,
      state,
      dieResult: 5,
      sourceCount: 1,
      stimulationType: 'Oral',
    })
    expect(result.maxPleasure.max).toBeGreaterThan(0)
    expect(result.beautyClass.total).toBeGreaterThan(0)
    expect(result.ledger.length).toBeGreaterThan(0)
  })
})

describe('orgasmSaveDc', () => {
  it('is 10 + sexuality + ability mod', () => {
    const actor = minimalCharacter()
    expect(orgasmSaveDc(actor, 2)).toBe(10 + 3 + 2)
  })
})
