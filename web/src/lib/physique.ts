import {
  BODY_TYPE_BASE_HEIGHT_BONUS_INCHES,
  BODY_TYPE_BASE_WEIGHT_FACTOR,
  BODY_TYPE_HEIGHT_MOD_ABILITY,
  bodyTypeFromD10,
  isBodyType,
  type BodyType,
} from '../data/bodyTypes'
import {
  formatHeightWeightDice,
  getSpeciesHeightWeightRow,
  type HeightWeightDice,
} from '../data/heightWeightTables'
import { abilityModifier } from './abilityScores'
import { makeSpectacleDie, type DiceSides, type SpectacleDie } from './dice'
import type { AbilityScores } from '../types/character'

export type DiceExprRoll = {
  total: number
  rolls: number[]
  sides: DiceSides | 1
}

export function rollHeightWeightDice(expr: HeightWeightDice): DiceExprRoll {
  if ('fixed' in expr) {
    return { total: expr.fixed, rolls: [expr.fixed], sides: 1 }
  }
  const sides = expr.sides as DiceSides
  const rolls = Array.from(
    { length: Math.max(1, expr.count) },
    () => 1 + Math.floor(Math.random() * expr.sides),
  )
  return {
    total: rolls.reduce((a, b) => a + b, 0),
    rolls,
    sides,
  }
}

export function formatHeightInches(totalInches: number): string {
  const inches = Math.max(0, Math.round(totalInches))
  const feet = Math.floor(inches / 12)
  const rem = inches % 12
  return `${feet}'${rem}"`
}

export function formatWeightLbs(lbs: number): string {
  return `${Math.max(1, Math.round(lbs))} lb`
}

export type PhysiqueRollResult = {
  bodyType: BodyType
  heightInches: number
  weightLbs: number
  /** Raw height-dice total (before ability-mod bonuses). */
  heightModifier: number
  weightModifier: number
  /** Height mod after Lithe/Athletic ability bonuses. */
  effectiveHeightModifier: number
  heightDiceRolls: number[]
  weightDiceRolls: number[]
  heightDiceSides: DiceSides | 1
  weightDiceSides: DiceSides | 1
  baseWeightLb: number
  adjustedBaseWeightLb: number
  adjustedBaseHeightInches: number
}

export function heightModAbilityBonus(
  bodyType: BodyType,
  abilityScores?: Pick<AbilityScores, 'strength' | 'dexterity'>,
): number {
  const key = BODY_TYPE_HEIGHT_MOD_ABILITY[bodyType]
  if (!key || !abilityScores) return 0
  return abilityModifier(abilityScores[key])
}

export function computePhysiqueFromMods(args: {
  speciesId: string
  bodyType: BodyType
  /** Raw height-dice total. */
  heightModifier: number
  weightModifier: number
  abilityScores?: Pick<AbilityScores, 'strength' | 'dexterity'>
}): {
  heightInches: number
  weightLbs: number
  effectiveHeightModifier: number
  adjustedBaseWeightLb: number
  adjustedBaseHeightInches: number
  baseWeightLb: number
} {
  const row = getSpeciesHeightWeightRow(args.speciesId)
  const adjustedBaseHeightInches =
    row.baseHeightInches + BODY_TYPE_BASE_HEIGHT_BONUS_INCHES[args.bodyType]
  const adjustedBaseWeightLb =
    row.baseWeightLb * BODY_TYPE_BASE_WEIGHT_FACTOR[args.bodyType]
  const effectiveHeightModifier =
    args.heightModifier + heightModAbilityBonus(args.bodyType, args.abilityScores)
  const heightInches = adjustedBaseHeightInches + effectiveHeightModifier
  const weightLbs = Math.max(
    1,
    Math.round(adjustedBaseWeightLb + effectiveHeightModifier * args.weightModifier),
  )
  return {
    heightInches,
    weightLbs,
    effectiveHeightModifier,
    adjustedBaseWeightLb,
    adjustedBaseHeightInches,
    baseWeightLb: row.baseWeightLb,
  }
}

/** @deprecated Use computePhysiqueFromMods — weight is no longer a post-hoc factor on the full total. */
export function computeWeightLbs(args: {
  baseWeightLb: number
  heightModifier: number
  weightModifier: number
  bodyType: BodyType
}): number {
  const adjustedBase = args.baseWeightLb * BODY_TYPE_BASE_WEIGHT_FACTOR[args.bodyType]
  return Math.max(1, Math.round(adjustedBase + args.heightModifier * args.weightModifier))
}

export function rollPhysiqueForSpecies(
  speciesId: string,
  bodyType: BodyType,
  abilityScores?: Pick<AbilityScores, 'strength' | 'dexterity'>,
): PhysiqueRollResult {
  const row = getSpeciesHeightWeightRow(speciesId)
  const height = rollHeightWeightDice(row.heightDice)
  const weight = rollHeightWeightDice(row.weightDice)
  const computed = computePhysiqueFromMods({
    speciesId,
    bodyType,
    heightModifier: height.total,
    weightModifier: weight.total,
    abilityScores,
  })
  return {
    bodyType,
    heightInches: computed.heightInches,
    weightLbs: computed.weightLbs,
    heightModifier: height.total,
    weightModifier: weight.total,
    effectiveHeightModifier: computed.effectiveHeightModifier,
    heightDiceRolls: height.rolls,
    weightDiceRolls: weight.rolls,
    heightDiceSides: height.sides,
    weightDiceSides: weight.sides,
    baseWeightLb: computed.baseWeightLb,
    adjustedBaseWeightLb: computed.adjustedBaseWeightLb,
    adjustedBaseHeightInches: computed.adjustedBaseHeightInches,
  }
}

export function rollRandomBodyType(): { bodyType: BodyType; d10: number } {
  const d10 = 1 + Math.floor(Math.random() * 10)
  return { bodyType: bodyTypeFromD10(d10), d10 }
}

export function reweightPhysique(args: {
  speciesId: string
  bodyType: BodyType
  heightModifier: number
  weightModifier: number
  abilityScores?: Pick<AbilityScores, 'strength' | 'dexterity'>
}): { weightLbs: number; heightInches: number } {
  const computed = computePhysiqueFromMods(args)
  return {
    heightInches: computed.heightInches,
    weightLbs: computed.weightLbs,
  }
}

/** Build spectacle dice for a height/weight roll (height dice then weight dice). */
export function physiqueRollToSpectacle(result: PhysiqueRollResult): SpectacleDie[] {
  const dice: SpectacleDie[] = []
  if (result.heightDiceSides !== 1) {
    for (const value of result.heightDiceRolls) {
      dice.push(
        makeSpectacleDie(result.heightDiceSides, value, { group: 'HT' }),
      )
    }
  }
  if (result.weightDiceSides !== 1) {
    for (const value of result.weightDiceRolls) {
      dice.push(
        makeSpectacleDie(result.weightDiceSides, value, { group: 'WT' }),
      )
    }
  }
  return dice
}

export function describeSpeciesHeightWeightFormula(speciesId: string): string {
  const row = getSpeciesHeightWeightRow(speciesId)
  const h = formatHeightWeightDice(row.heightDice)
  const w = formatHeightWeightDice(row.weightDice)
  return `Base ${formatHeightInches(row.baseHeightInches)} + ${h} (+ body-type height rules); weight (base × body type) + (height mod × ${w}). Lithe adds Dex mod to height mod; Athletic adds Str mod; Giant adds +1′ to base height.`
}

export function sanitizeBodyType(raw: string): BodyType | '' {
  const t = raw.trim()
  return isBodyType(t) ? t : ''
}
