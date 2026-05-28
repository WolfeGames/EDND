import { describe, expect, it } from 'vitest'
import type { AbilityScores } from '../types/character'
import {
  applyGenitalShift,
  applyPhallicRefractoryPleasure,
  attemptEndPhallicRefractory,
  applyPleasureResistance,
  calculateMaxPleasure,
  createPleasureState,
  getClassPleasureBase,
  getOrgasmicBoon,
  getPleasurePoolModifier,
  makeArousalCheck,
  makeOrgasmSave,
  makeOverstimulatedCheck,
  parseCarnalClassPleasureBase,
  resolveStimulation,
  revertGenitalShift,
} from './pleasureEngine'
import { combinedOverstimulatedLevel } from './pleasureTypes'
import type { PleasureCombatant } from './pleasureTypes'

function scores(overrides: Partial<AbilityScores> = {}): AbilityScores {
  return {
    strength: 10,
    dexterity: 10,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 10,
    ...overrides,
  }
}

function combatant(partial: Partial<PleasureCombatant> & { id: string }): PleasureCombatant {
  return {
    name: partial.name ?? partial.id,
    level: 1,
    abilityScores: scores(),
    sexualityBonus: 2,
    genitalTrait: 'phallic',
    fertilityBonus: 4,
    hasGenitalShift: false,
    wisdomSaveProficient: false,
    modifiers: {},
    ...partial,
  }
}

describe('calculateMaxPleasure', () => {
  it('uses class base + Con mod for non-carnal', () => {
    const c = combatant({ id: 'fighter', adventuringClassId: 'fighter' })
    expect(getClassPleasureBase(c)).toBe(8)
    expect(getPleasurePoolModifier(c).value).toBe(2)
    expect(calculateMaxPleasure(c)).toBe(10)
  })

  it('uses carnal table base + Sexuality bonus', () => {
    const c = combatant({ id: 'ravager', carnalClassId: 'ravager', sexualityBonus: 2 })
    expect(parseCarnalClassPleasureBase('ravager')).toBe(12)
    expect(getPleasurePoolModifier(c).label).toContain('Sexuality')
    expect(calculateMaxPleasure(c)).toBe(14)
  })

  it('applies combined overstim penalty from either track', () => {
    const c = combatant({ id: 'x' })
    const state = createPleasureState(c, {
      vaginal: { orgasmsThisEncounter: 0, isRefractory: false, overstimulatedLevel: 2 },
    })
    expect(calculateMaxPleasure(c, state)).toBe(1)
    expect(combinedOverstimulatedLevel(state)).toBe(2)
  })
})

describe('pleasure resistance', () => {
  it('halves pleasure minimum 1 when not Aroused', () => {
    const state = createPleasureState(combatant({ id: 'a' }), { isAroused: false })
    expect(applyPleasureResistance(5, state)).toBe(2)
    expect(applyPleasureResistance(1, state)).toBe(1)
  })

  it('does not resist when Aroused', () => {
    const state = createPleasureState(combatant({ id: 'a' }), { isAroused: true })
    expect(applyPleasureResistance(5, state)).toBe(5)
  })
})

describe('makeArousalCheck', () => {
  it('DC is 10 + pleasure received', () => {
    const target = combatant({ id: 't' })
    const state = createPleasureState(target)
    const result = makeArousalCheck({
      target,
      targetState: state,
      pleasureReceived: 4,
      roll: 1,
    })
    expect(result.dc).toBe(14)
    expect(result.becameAroused).toBe(true)
    expect(result.state.isAroused).toBe(true)
  })
})

describe('makeOrgasmSave', () => {
  it('success sets half PP and Edged', () => {
    const character = combatant({ id: 'c' })
    const state = createPleasureState(character, {
      currentPleasurePoints: 0,
      maxPleasurePoints: 10,
    })
    const result = makeOrgasmSave({
      character,
      state,
      ability: 'constitution',
      roll: 20,
    })
    expect(result.climaxed).toBe(false)
    expect(result.state.isEdged).toBe(true)
    expect(result.state.currentPleasurePoints).toBe(5)
  })

  it('phallic failure triggers climax and phallic refractory', () => {
    const character = combatant({ id: 'c', genitalTrait: 'phallic' })
    const state = createPleasureState(character, { currentPleasurePoints: 0 })
    const result = makeOrgasmSave({
      character,
      state,
      ability: 'sexuality',
      roll: 1,
    })
    expect(result.climaxed).toBe(true)
    expect(result.boon).toBeDefined()
    expect(result.state.phallic.isRefractory).toBe(true)
  })

  it('vaginal failure triggers overstim check not phallic refractory', () => {
    const character = combatant({ id: 'v', genitalTrait: 'vaginal' })
    const state = createPleasureState(character, { currentPleasurePoints: 0 })
    const result = makeOrgasmSave({
      character,
      state,
      ability: 'constitution',
      roll: 1,
    })
    expect(result.climaxed).toBe(true)
    expect(result.state.phallic.isRefractory).toBe(false)
    expect(result.state.vaginal.orgasmsThisEncounter).toBe(1)
  })
})

describe('phallic refractory', () => {
  it('pleasure during refractory adds overstim without reducing PP', () => {
    const c = combatant({ id: 'p' })
    const state = createPleasureState(c, {
      currentPleasurePoints: 5,
      phallic: { orgasmsThisEncounter: 1, isRefractory: true, overstimulatedLevel: 0 },
    })
    const { state: next } = applyPhallicRefractoryPleasure(c, state, 4)
    expect(next.currentPleasurePoints).toBe(5)
    expect(next.phallic.overstimulatedLevel).toBe(1)
  })

  it('Sexuality save ends phallic refractory on success', () => {
    const c = combatant({ id: 'p', sexualityBonus: 10 })
    const state = createPleasureState(c, {
      phallic: { orgasmsThisEncounter: 1, isRefractory: true, overstimulatedLevel: 0 },
    })
    const result = attemptEndPhallicRefractory({ character: c, state, roll: 15 })
    expect(result.outcome).toBe('success')
    expect(result.state.phallic.isRefractory).toBe(false)
  })
})

describe('genital shift', () => {
  it('clears tracks on shift and restores on revert', () => {
    const state = createPleasureState(combatant({ id: 's' }), {
      hasGenitalShift: true,
      activeGenitalTrait: 'phallic',
      phallic: { orgasmsThisEncounter: 2, isRefractory: true, overstimulatedLevel: 1 },
      vaginal: { orgasmsThisEncounter: 0, isRefractory: false, overstimulatedLevel: 0 },
    })
    const shifted = applyGenitalShift(state, 'vaginal')
    expect(shifted.phallic.isRefractory).toBe(false)
    expect(shifted.phallic.overstimulatedLevel).toBe(0)
    const reverted = revertGenitalShift(shifted)
    expect(reverted.phallic.isRefractory).toBe(true)
    expect(reverted.phallic.overstimulatedLevel).toBe(1)
    expect(reverted.activeGenitalTrait).toBe('phallic')
  })
})

describe('makeOverstimulatedCheck', () => {
  it('DC scales with prior orgasms on track', () => {
    const c = combatant({ id: 'o', genitalTrait: 'vaginal' })
    const state = createPleasureState(c, {
      vaginal: { orgasmsThisEncounter: 2, isRefractory: false, overstimulatedLevel: 0 },
    })
    const result = makeOverstimulatedCheck({
      character: c,
      state,
      track: 'vaginal',
      roll: 1,
    })
    expect(result.dc).toBe(12)
    expect(result.outcome).toBe('failure')
    expect(result.state.vaginal.overstimulatedLevel).toBe(1)
  })
})

describe('getOrgasmicBoon', () => {
  it('returns table entry for 1-6', () => {
    expect(getOrgasmicBoon(3).roll).toBe(3)
    expect(getOrgasmicBoon(9).roll).toBe(6)
  })
})

describe('resolveStimulation', () => {
  it('runs arousal check then applies PP when not Aroused', () => {
    const attacker = combatant({ id: 'atk' })
    const target = combatant({ id: 'tgt', abilityScores: scores({ wisdom: 18 }) })
    const state = createPleasureState(target, { isAroused: false, maxPleasurePoints: 12 })
    const result = resolveStimulation(attacker, target, state, {
      pleasureRoll: 4,
    })
    expect(result.arousalCheck).toBeDefined()
    expect(result.state.currentPleasurePoints).toBeLessThan(12)
  })

  it('redirects pleasure to overstim during phallic refractory', () => {
    const attacker = combatant({ id: 'atk' })
    const target = combatant({ id: 'tgt', genitalTrait: 'phallic' })
    const state = createPleasureState(target, {
      currentPleasurePoints: 8,
      phallic: { orgasmsThisEncounter: 1, isRefractory: true, overstimulatedLevel: 0 },
    })
    const result = resolveStimulation(attacker, target, state, {
      pleasureRoll: 3,
      skipArousalCheck: true,
    })
    expect(result.log.some((l) => l.includes('immune to pleasure'))).toBe(true)
    expect(result.state.phallic.overstimulatedLevel).toBe(1)
    // Pleasure does not directly reduce PP; max may drop from overstim and clamp current.
    expect(result.state.maxPleasurePoints).toBe(5)
    expect(result.state.currentPleasurePoints).toBe(5)
  })
})
