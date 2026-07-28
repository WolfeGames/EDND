import { getGenitalTraitDefinition } from '../data/genitalTraits'
import type { EdndCharacter, EndowmentAnatomy, EndowmentProfile } from '../types/character'
import type { GenitalTraitId, GenitalTrack } from '../types/genitalTrait'
import { endowmentFlags } from './anatomyGender'
import { abilityModifier } from './abilityScores'
import { sexualityBonusForLevel } from './applyCharacterRules'
import { isCanonicalGender } from './biologicalSex'
import { normalizedEndowment } from './endowment'

/** Anatomy implied by a genital trait selection. */
export function endowmentShapeFromGenitalTrait(trait: GenitalTraitId): {
  anatomy: EndowmentAnatomy
  vaginaPresent: boolean
  hasBreasts: boolean
  hasPhallus: boolean
  hasVagina: boolean
} {
  switch (trait) {
    case 'phallic':
      return {
        anatomy: 'phallus',
        vaginaPresent: false,
        hasBreasts: false,
        hasPhallus: true,
        hasVagina: false,
      }
    case 'vaginal':
      return {
        anatomy: 'breasts',
        vaginaPresent: true,
        hasBreasts: true,
        hasPhallus: false,
        hasVagina: true,
      }
    case 'cuntboy':
      return {
        anatomy: 'neither',
        vaginaPresent: true,
        hasBreasts: false,
        hasPhallus: false,
        hasVagina: true,
      }
    case 'shemale':
      return {
        anatomy: 'both',
        vaginaPresent: false,
        hasBreasts: true,
        hasPhallus: true,
        hasVagina: false,
      }
    case 'hermaphrodite':
      return {
        anatomy: 'phallus',
        vaginaPresent: true,
        hasBreasts: false,
        hasPhallus: true,
        hasVagina: true,
      }
  }
}

export function describeEndowmentShape(trait: GenitalTraitId): string {
  const s = endowmentShapeFromGenitalTrait(trait)
  const parts: string[] = []
  if (s.hasBreasts) parts.push('breasts')
  if (s.hasPhallus) parts.push('phallus')
  if (s.hasVagina) parts.push('vagina')
  if (parts.length === 0) return 'No primary endowments from this trait.'
  return `Present: ${parts.join(', ')}.`
}

/** Default genital trait when the player picks a gender identity. */
export function defaultGenitalTraitForGender(gender: string): GenitalTraitId {
  if (gender === 'Male') return 'phallic'
  if (gender === 'Female') return 'vaginal'
  if (gender === 'Intersex') return 'hermaphrodite'
  return 'phallic'
}

/** Apply genital trait and reshape endowment, keeping sizes for organs that remain. */
export function applyGenitalTraitSelection(
  c: EdndCharacter,
  trait: GenitalTraitId,
): EdndCharacter {
  const shape = endowmentShapeFromGenitalTrait(trait)
  const prev = c.endowment
  const next: EndowmentProfile = {
    anatomy: shape.anatomy,
    vaginaPresent: shape.vaginaPresent,
    breastsSize: shape.hasBreasts ? prev.breastsSize : undefined,
    phallusSize: shape.hasPhallus ? prev.phallusSize : undefined,
    vaginaSize: shape.hasVagina ? prev.vaginaSize : undefined,
  }
  return normalizeGenitalTraitOnCharacter({
    ...c,
    genitalTrait: trait,
    endowment: normalizedEndowment(next),
  })
}

/** Suggest genital trait from endowment configuration when trait is unset. */
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
  return defaultGenitalTraitForGender(biologicalSex)
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
  if (options?.preserveExplicitChoice && c.genitalTrait) {
    return normalizeGenitalTraitOnCharacter(c)
  }
  if (!isCanonicalGender(c.genderIdentity)) return normalizeGenitalTraitOnCharacter(c)
  const inferred = inferGenitalTraitFromCharacter({
    ...c,
    genitalTrait: undefined,
  })
  return applyGenitalTraitSelection(c, inferred)
}
