import type { AbilityScores } from '../types/character'
import { makeSpectacleDie, type SpectacleDie } from './dice'

function d6(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export type AbilityRollDetail = {
  dice: [number, number, number, number]
  droppedIndex: number
  total: number
}

export function rollStat4d6DropLowestDetailed(): AbilityRollDetail {
  const dice: [number, number, number, number] = [d6(), d6(), d6(), d6()]
  let droppedIndex = 0
  for (let i = 1; i < 4; i++) {
    if (dice[i]! < dice[droppedIndex]!) droppedIndex = i
  }
  const total = dice.reduce((sum, n, i) => (i === droppedIndex ? sum : sum + n), 0)
  return { dice, droppedIndex, total }
}

export function rollStat4d6DropLowest(): number {
  return rollStat4d6DropLowestDetailed().total
}

export function rollAllAbilityScoresDetailed(): Record<keyof AbilityScores, AbilityRollDetail> {
  return {
    strength: rollStat4d6DropLowestDetailed(),
    dexterity: rollStat4d6DropLowestDetailed(),
    constitution: rollStat4d6DropLowestDetailed(),
    intelligence: rollStat4d6DropLowestDetailed(),
    wisdom: rollStat4d6DropLowestDetailed(),
    charisma: rollStat4d6DropLowestDetailed(),
  }
}

export function rollAllAbilityScores(): AbilityScores {
  const d = rollAllAbilityScoresDetailed()
  return {
    strength: d.strength.total,
    dexterity: d.dexterity.total,
    constitution: d.constitution.total,
    intelligence: d.intelligence.total,
    wisdom: d.wisdom.total,
    charisma: d.charisma.total,
  }
}

export function abilityRollsToSpectacle(
  rolls: Partial<Record<keyof AbilityScores, AbilityRollDetail>>,
  labels: Partial<Record<keyof AbilityScores, string>> = {},
): SpectacleDie[] {
  const out: SpectacleDie[] = []
  for (const key of Object.keys(rolls) as Array<keyof AbilityScores>) {
    const detail = rolls[key]
    if (!detail) continue
    const group = labels[key] ?? key.slice(0, 3).toUpperCase()
    detail.dice.forEach((value, i) => {
      out.push(
        makeSpectacleDie(6, value, {
          dropped: i === detail.droppedIndex,
          group,
        }),
      )
    })
  }
  return out
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
