import {
  BODY_TYPE_WEIGHT_FACTOR,
  bodyTypeFromD10,
  isBodyType,
  type BodyType,
} from '../data/bodyTypes'
import {
  formatHeightWeightDice,
  getSpeciesHeightWeightRow,
  type HeightWeightDice,
} from '../data/heightWeightTables'
import { makeSpectacleDie, type DiceSides, type SpectacleDie } from './dice'

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
  heightModifier: number
  weightModifier: number
  heightDiceRolls: number[]
  weightDiceRolls: number[]
  heightDiceSides: DiceSides | 1
  weightDiceSides: DiceSides | 1
  baseWeightLb: number
}

export function computeWeightLbs(args: {
  baseWeightLb: number
  heightModifier: number
  weightModifier: number
  bodyType: BodyType
}): number {
  const traditional = args.baseWeightLb + args.heightModifier * args.weightModifier
  const factor = BODY_TYPE_WEIGHT_FACTOR[args.bodyType]
  return Math.max(1, Math.round(traditional * factor))
}

export function rollPhysiqueForSpecies(
  speciesId: string,
  bodyType: BodyType,
): PhysiqueRollResult {
  const row = getSpeciesHeightWeightRow(speciesId)
  const height = rollHeightWeightDice(row.heightDice)
  const weight = rollHeightWeightDice(row.weightDice)
  const heightInches = row.baseHeightInches + height.total
  const weightLbs = computeWeightLbs({
    baseWeightLb: row.baseWeightLb,
    heightModifier: height.total,
    weightModifier: weight.total,
    bodyType,
  })
  return {
    bodyType,
    heightInches,
    weightLbs,
    heightModifier: height.total,
    weightModifier: weight.total,
    heightDiceRolls: height.rolls,
    weightDiceRolls: weight.rolls,
    heightDiceSides: height.sides,
    weightDiceSides: weight.sides,
    baseWeightLb: row.baseWeightLb,
  }
}

export function rollRandomBodyType(): { bodyType: BodyType; d10: number } {
  const d10 = 1 + Math.floor(Math.random() * 10)
  return { bodyType: bodyTypeFromD10(d10), d10 }
}

export function reweightPhysique(args: {
  speciesId: string
  bodyType: BodyType
  heightInches: number
  heightModifier: number
  weightModifier: number
}): { weightLbs: number; heightInches: number } {
  const row = getSpeciesHeightWeightRow(args.speciesId)
  return {
    heightInches: args.heightInches,
    weightLbs: computeWeightLbs({
      baseWeightLb: row.baseWeightLb,
      heightModifier: args.heightModifier,
      weightModifier: args.weightModifier,
      bodyType: args.bodyType,
    }),
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
  return `Base ${formatHeightInches(row.baseHeightInches)} + ${h}; weight ${row.baseWeightLb} lb + (height mod × ${w}), then × body type.`
}

export function sanitizeBodyType(raw: string): BodyType | '' {
  const t = raw.trim()
  return isBodyType(t) ? t : ''
}
