import { getGenitalTraitDefinition } from '../data/genitalTraits'
import type { EdndCharacter } from '../types/character'
import type { GenitalTraitId, GenitalTrack } from '../types/genitalTrait'
import { isCanonicalBiologicalSex } from './biologicalSex'
import { abilityModifier } from './abilityScores'
import { sexualityBonusForLevel } from './applyCharacterRules'

/** Suggest genital trait from biological sex and endowment configuration. */
export function inferGenitalTraitFromCharacter(character: EdndCharacter): GenitalTraitId {
  if (character.genitalTrait) return character.genitalTrait

  const g = character.genderIdentity.trim()
  const hasPhallus =
    character.endowment.anatomy === 'phallus' || character.endowment.anatomy === 'both'
  const hasVagina =
    character.endowment.vaginaPresent === true ||
    (character.endowment.anatomy === 'both' && g === 'Female')

  if (hasPhallus && hasVagina) return 'hermaphrodite'
  if (g === 'Male' && hasVagina) return 'cuntboy'
  if (g === 'Female' && hasPhallus) return 'shemale'
  if (g === 'Female') return 'vaginal'
  if (g === 'Male') return 'phallic'
  return hasPhallus ? 'phallic' : 'vaginal'
}

export function defaultGenitalTraitForBiologicalSex(
  biologicalSex: string,
): GenitalTraitId {
  if (biologicalSex === 'Male') return 'phallic'
  if (biologicalSex === 'Female') return 'vaginal'
  return 'phallic'
}

export function activeGenitalTracks(traitId: GenitalTraitId): GenitalTrack[] {
  return [...getGenitalTraitDefinition(traitId).tracks]
}

/** Fertility bonus for impregnation checks (extensible via character field). */
export function getFertilityBonus(character: EdndCharacter): number {
  if (typeof character.fertilityBonus === 'number') return character.fertilityBonus
  return (
    abilityModifier(character.abilityScores.constitution) +
    sexualityBonusForLevel(character.level)
  )
}

export function normalizeGenitalTraitOnCharacter(c: EdndCharacter): EdndCharacter {
  const trait = c.genitalTrait ?? inferGenitalTraitFromCharacter(c)
  return {
    ...c,
    genitalTrait: trait,
    hasGenitalShift: c.hasGenitalShift ?? false,
    fertilityBonus:
      typeof c.fertilityBonus === 'number'
        ? c.fertilityBonus
        : getFertilityBonus({ ...c, genitalTrait: trait }),
  }
}

export function syncGenitalTraitWithBiology(
  c: EdndCharacter,
  options?: { preserveExplicitChoice?: boolean },
): EdndCharacter {
  if (options?.preserveExplicitChoice && c.genitalTrait) return normalizeGenitalTraitOnCharacter(c)
  if (!isCanonicalBiologicalSex(c.genderIdentity)) return normalizeGenitalTraitOnCharacter(c)
  const inferred = inferGenitalTraitFromCharacter({
    ...c,
    genitalTrait: undefined,
  })
  return normalizeGenitalTraitOnCharacter({ ...c, genitalTrait: inferred })
}
