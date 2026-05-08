import type { AbilityScores } from '../types/character'

function d6(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export function rollStat4d6DropLowest(): number {
  const rolls = [d6(), d6(), d6(), d6()].sort((a, b) => b - a)
  return rolls[0] + rolls[1] + rolls[2]
}

export function rollAllAbilityScores(): AbilityScores {
  return {
    strength: rollStat4d6DropLowest(),
    dexterity: rollStat4d6DropLowest(),
    constitution: rollStat4d6DropLowest(),
    intelligence: rollStat4d6DropLowest(),
    wisdom: rollStat4d6DropLowest(),
    charisma: rollStat4d6DropLowest(),
  }
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function highestAbilityModifier(scores: AbilityScores): number {
  return Math.max(
    abilityModifier(scores.strength),
    abilityModifier(scores.dexterity),
    abilityModifier(scores.constitution),
    abilityModifier(scores.intelligence),
    abilityModifier(scores.wisdom),
    abilityModifier(scores.charisma),
  )
}

export function deriveBeautyClass(
  scores: AbilityScores,
  otherModifiers: number,
): number {
  return 10 + highestAbilityModifier(scores) + otherModifiers
}
