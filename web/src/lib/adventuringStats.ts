import type { AbilityScores } from '../types/character'
import { abilityModifier } from './abilityScores'

/** Placeholder max HP until adventuring class hit dice are modeled (assumes d8). */
export function estimateMaxHitPoints(
  level: number,
  abilityScores: AbilityScores,
  hitDie = 8,
): number {
  const conMod = abilityModifier(abilityScores.constitution)
  const avgPerLevel = Math.floor(hitDie / 2) + 1
  return Math.max(1, hitDie + conMod + Math.max(0, level - 1) * (avgPerLevel + conMod))
}

/** Unarmored baseline AC (10 + Dexterity modifier). */
export function estimateArmorClass(abilityScores: AbilityScores): number {
  return 10 + abilityModifier(abilityScores.dexterity)
}
