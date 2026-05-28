import { getCarnalClass } from '../data/registry'
import { sexualityBonusForLevel } from './applyCharacterRules'
import { abilityModifier } from './abilityScores'
import type { BestiaryEntry } from '../types/tables'
import type { AbilityScores, EdndCharacter } from '../types/character'
import type { GenitalTraitId } from '../types/genitalTrait'
import { createPleasureState, type Rng } from '../mechanics/pleasureEngine'
import type { PleasureCombatant, PleasureState } from '../mechanics/pleasureTypes'

export function bestiaryLevelFromSr(sr: number): number {
  return Math.max(1, Math.min(20, Math.floor(sr) + 1))
}

function bestiaryAbilityScores(entry: BestiaryEntry): AbilityScores {
  const a = entry.abilityScores
  return {
    strength: a.str,
    dexterity: a.dex,
    constitution: a.con,
    intelligence: a.int,
    wisdom: a.wis,
    charisma: a.cha,
  }
}

function inferGenitalTraitForBestiary(entry: BestiaryEntry): GenitalTraitId {
  if (entry.tags?.includes('shapeshifter')) return 'hermaphrodite'
  const n = entry.name.toLowerCase()
  if (n.includes('incubus')) return 'phallic'
  if (n.includes('succubus')) return 'vaginal'
  return 'vaginal'
}

/** Minimal character shell for shared inference helpers. */
export function bestiaryToCharacter(entry: BestiaryEntry): EdndCharacter {
  const level = bestiaryLevelFromSr(entry.sr)
  const abilityScores = bestiaryAbilityScores(entry)
  return {
    id: `bestiary:${entry.id}`,
    name: entry.name,
    pronouns: 'they/them',
    genderIdentity: 'Female',
    species: entry.creatureType,
    adventuringClass: entry.creatureType,
    level,
    abilityScores,
    endowment: { anatomy: 'both', vaginaPresent: true },
    background: 'bestiary',
    carnalClass: undefined,
    carnalFeatures: entry.sexualTraits.map((t) => t.name),
    genitalTrait: inferGenitalTraitForBestiary(entry),
    hasGenitalShift: entry.tags?.includes('shapeshifter') ?? false,
    eroticTraits: {
      carnalSkillProficiencies: [],
      positionProficiencies: ['Basic', 'Advanced'],
      eroticToolProficiencies: [],
      beautyClass: 10 + abilityModifier(abilityScores.charisma),
      beautyModifier: 0,
      sexualityBonus: sexualityBonusForLevel(level),
      attraction: '',
      repulsion: '',
      sexualMorality: '',
      orientation: '',
    },
  }
}

export function bestiaryToCombatant(
  entry: BestiaryEntry,
  overrides?: Partial<PleasureCombatant>,
): PleasureCombatant {
  const c = bestiaryToCharacter(entry)
  const genitalTrait = c.genitalTrait ?? inferGenitalTraitForBestiary(entry)
  const level = c.level
  return {
    id: c.id,
    name: entry.name,
    level,
    abilityScores: c.abilityScores,
    sexualityBonus: c.eroticTraits.sexualityBonus,
    carnalClassId: undefined,
    adventuringClassId: entry.creatureType,
    genitalTrait,
    fertilityBonus:
      abilityModifier(c.abilityScores.constitution) + c.eroticTraits.sexualityBonus,
    hasGenitalShift: c.hasGenitalShift ?? false,
    wisdomSaveProficient: false,
    modifiers: {},
    encounter: {
      speciesId: entry.id,
      xenophilic: true,
    },
    ...overrides,
  }
}

export function parseDieNotation(notation: string): { count: number; sides: number } {
  const m = notation.trim().match(/^(\d*)d(\d+)$/i)
  if (!m) return { count: 1, sides: 8 }
  return { count: Math.max(1, parseInt(m[1] || '1', 10)), sides: parseInt(m[2], 10) }
}

export function rollNotation(notation: string, rng: Rng): number {
  const { count, sides } = parseDieNotation(notation)
  let t = 0
  for (let i = 0; i < count; i++) t += 1 + Math.floor(rng() * sides)
  return t
}

/** Roll attacker Sex Die (carnal class table or hit die; bestiary uses d8 + Cha mod flavor). */
export function rollPleasureDice(
  attacker: PleasureCombatant,
  rng: Rng = Math.random,
): { total: number; notation: string } {
  if (attacker.carnalClassId) {
    const row = getCarnalClass(attacker.carnalClassId)
    const notation = row?.sexDie ?? `d${row?.hitDie ?? 8}`
    return { total: rollNotation(notation, rng), notation }
  }
  const sides = 6 + Math.min(4, Math.floor((attacker.level - 1) / 4))
  const total = rollNotation(`d${sides}`, rng)
  return { total, notation: `d${sides}` }
}

export function createBestiaryPleasureState(
  entry: BestiaryEntry,
  combatant: PleasureCombatant,
): PleasureState {
  const maxFromSr = Math.max(8, entry.sr * 3 + abilityModifier(combatant.abilityScores.constitution))
  return createPleasureState(combatant, {
    maxPleasurePoints: maxFromSr,
    currentPleasurePoints: maxFromSr,
    genitalTrait: combatant.genitalTrait,
    activeGenitalTrait: combatant.genitalTrait,
    hasGenitalShift: combatant.hasGenitalShift,
  })
}
