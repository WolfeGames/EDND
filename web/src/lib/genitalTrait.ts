import { getGenitalTraitDefinition } from '../data/genitalTraits'
import type { EdndCharacter } from '../types/character'
import type { GenitalTraitId, GenitalTrack } from '../types/genitalTrait'
import { endowmentFlags } from './anatomyGender'
import { isCanonicalGender } from './biologicalSex'
import { abilityModifier } from './abilityScores'
import { sexualityBonusForLevel } from './applyCharacterRules'

/** Suggest genital trait from biological sex and endowment configuration. */
export function inferGenitalTraitFromCharacter(character: EdndCharacter): GenitalTraitId {
  if (character.genitalTrait) return character.genitalTrait

  const { hasPhallus, hasBreasts, hasVagina } = endowmentFlags(character.endowment)

  if (hasPhallus && hasVagina) return 'hermaphrodite'
  if (hasPhallus && hasBreasts) return 'shemale'
  if (hasPhallus) return 'phallic'
  if (hasVagina && hasBreasts) return 'vaginal'
  if (hasVagina) return 'cuntboy'
  return 'vaginal'
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

/**
 * Fertility bonus for conception checks.
 * Mothering types: DC = 20 − bonus. Impregnators: d20 + bonus vs that DC.
 * @see mechanics/fertilityEngine.ts
 */
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
  if (!isCanonicalGender(c.genderIdentity)) return normalizeGenitalTraitOnCharacter(c)
  const inferred = inferGenitalTraitFromCharacter({
    ...c,
    genitalTrait: undefined,
  })
  return normalizeGenitalTraitOnCharacter({ ...c, genitalTrait: inferred })
}
