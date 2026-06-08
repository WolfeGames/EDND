import { getGenitalTraitDefinition } from '../data/genitalTraits'
import type { EdndCharacter } from '../types/character'
import type { GenitalTraitId } from '../types/genitalTrait'
import { getFertilityBonus } from '../lib/genitalTrait'
import type { PleasureCombatant } from './pleasureTypes'

export type Rng = () => number

const defaultRng: Rng = () => Math.random()

export function rollD20(rng: Rng = defaultRng): number {
  return 1 + Math.floor(rng() * 20)
}

/** Mothering / vagina-bearing configurations set impregnation DC from their fertility bonus. */
export function isMotheringGenitalTrait(traitId: GenitalTraitId): boolean {
  return getGenitalTraitDefinition(traitId).setsImpregnationDc
}

/** Configurations that can contribute fertility when impregnating another creature. */
export function canImpregnateWithGenitalTrait(traitId: GenitalTraitId): boolean {
  return getGenitalTraitDefinition(traitId).canImpregnateOthers
}

/**
 * Conception DC set by the mothering partner: 20 minus their fertility bonus.
 * Higher fertility → lower DC → easier for the impregnator to succeed.
 */
export function conceptionDcFromMotherFertility(motherFertilityBonus: number): number {
  return 20 - motherFertilityBonus
}

export interface ConceptionCheckRequest {
  impregnator: Pick<PleasureCombatant, 'name' | 'fertilityBonus' | 'genitalTrait'>
  mother: Pick<PleasureCombatant, 'name' | 'fertilityBonus' | 'genitalTrait'>
  roll?: number
  rng?: Rng
}

export interface ConceptionCheckResult {
  dc: number
  roll: number
  impregnatorFertility: number
  motherFertility: number
  total: number
  conceived: boolean
  log: string[]
}

export function formatConceptionDcBreakdown(motherFertilityBonus: number): string {
  const dc = conceptionDcFromMotherFertility(motherFertilityBonus)
  return `20 − ${motherFertilityBonus} = ${dc}`
}

export function formatImpregnatorRollFormula(impregnatorFertilityBonus: number): string {
  return `d20 + ${impregnatorFertilityBonus}`
}

/** Resolve whether an impregnation attempt succeeds. */
export function makeConceptionCheck(req: ConceptionCheckRequest): ConceptionCheckResult {
  const log: string[] = []
  const motherFertility = req.mother.fertilityBonus
  const impregnatorFertility = req.impregnator.fertilityBonus
  const dc = conceptionDcFromMotherFertility(motherFertility)
  const roll = req.roll ?? rollD20(req.rng ?? defaultRng)
  const total = roll + impregnatorFertility
  const conceived = total >= dc

  if (!isMotheringGenitalTrait(req.mother.genitalTrait)) {
    log.push(
      `${req.mother.name} is not a mothering configuration — this creature does not set a standard impregnation DC.`,
    )
  }
  if (!canImpregnateWithGenitalTrait(req.impregnator.genitalTrait)) {
    log.push(
      `${req.impregnator.name} cannot impregnate others with their current genital configuration.`,
    )
  }

  log.push(
    `Conception: ${req.impregnator.name} rolls d20 (${roll}) + fertility ${impregnatorFertility} = ${total} vs DC ${dc} (${formatConceptionDcBreakdown(motherFertility)} from ${req.mother.name}).`,
  )
  log.push(conceived ? 'Success — conception achieved.' : 'Failure — no conception this attempt.')

  return {
    dc,
    roll,
    impregnatorFertility,
    motherFertility,
    total,
    conceived,
    log,
  }
}

export interface FertilityProfile {
  fertilityBonus: number
  genitalTrait: GenitalTraitId
  isMothering: boolean
  canImpregnate: boolean
  conceptionDc?: number
  conceptionDcFormula?: string
  impregnatorRollFormula?: string
}

export function getFertilityProfile(character: EdndCharacter): FertilityProfile {
  const genitalTrait = character.genitalTrait ?? 'phallic'
  const fertilityBonus = getFertilityBonus(character)
  const isMothering = isMotheringGenitalTrait(genitalTrait)
  const canImpregnate = canImpregnateWithGenitalTrait(genitalTrait)
  return {
    fertilityBonus,
    genitalTrait,
    isMothering,
    canImpregnate,
    conceptionDc: isMothering ? conceptionDcFromMotherFertility(fertilityBonus) : undefined,
    conceptionDcFormula: isMothering
      ? formatConceptionDcBreakdown(fertilityBonus)
      : undefined,
    impregnatorRollFormula: canImpregnate
      ? formatImpregnatorRollFormula(fertilityBonus)
      : undefined,
  }
}

export function getFertilityProfileFromCombatant(
  combatant: PleasureCombatant,
): FertilityProfile {
  return {
    fertilityBonus: combatant.fertilityBonus,
    genitalTrait: combatant.genitalTrait,
    isMothering: isMotheringGenitalTrait(combatant.genitalTrait),
    canImpregnate: canImpregnateWithGenitalTrait(combatant.genitalTrait),
    conceptionDc: isMotheringGenitalTrait(combatant.genitalTrait)
      ? conceptionDcFromMotherFertility(combatant.fertilityBonus)
      : undefined,
    conceptionDcFormula: isMotheringGenitalTrait(combatant.genitalTrait)
      ? formatConceptionDcBreakdown(combatant.fertilityBonus)
      : undefined,
    impregnatorRollFormula: canImpregnateWithGenitalTrait(combatant.genitalTrait)
      ? formatImpregnatorRollFormula(combatant.fertilityBonus)
      : undefined,
  }
}
