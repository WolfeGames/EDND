import type { EdndCharacter } from '../types/character'
import {
  buildAppliedTraits,
  computeBeautyClassBreakdown,
} from './beautyClassCompute'

export function sexualityBonusForLevel(level: number): number {
  if (level < 5) return 2
  if (level < 10) return 3
  if (level < 14) return 4
  if (level < 18) return 5
  return 6
}

/** Recompute derived fields: sexuality bonus, beauty class, race sync, applied trait labels. */
export function applyDerivedCharacterRules(c: EdndCharacter): EdndCharacter {
  const sexualityBonus = sexualityBonusForLevel(c.level)
  const race = (c.race || c.species || '').trim()
  const species = (c.species || race).trim()
  const sexualHistory = (c.sexualHistory ?? '').trim()
  const synced: EdndCharacter = {
    ...c,
    race,
    species,
    sexualHistory: sexualHistory || undefined,
  }
  const { total: beautyClass } = computeBeautyClassBreakdown(synced)
  const appliedTraits = buildAppliedTraits(synced)
  return {
    ...synced,
    beautyClass,
    appliedTraits,
    eroticTraits: {
      ...synced.eroticTraits,
      sexualityBonus,
      beautyClass,
    },
  }
}
