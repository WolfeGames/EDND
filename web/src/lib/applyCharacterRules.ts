import { deriveBeautyClass } from './abilityScores'
import type { EdndCharacter } from '../types/character'

export function sexualityBonusForLevel(level: number): number {
  if (level < 5) return 2
  if (level < 10) return 3
  if (level < 14) return 4
  if (level < 18) return 5
  return 6
}

/** Recompute sexuality bonus and beauty class from level, scores, and current beauty modifier. */
export function applyDerivedCharacterRules(c: EdndCharacter): EdndCharacter {
  const sexualityBonus = sexualityBonusForLevel(c.level)
  const beautyClass = deriveBeautyClass(c.abilityScores, c.eroticTraits.beautyModifier)
  return {
    ...c,
    eroticTraits: {
      ...c.eroticTraits,
      sexualityBonus,
      beautyClass,
    },
  }
}
