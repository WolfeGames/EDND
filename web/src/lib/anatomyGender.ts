import { GENDERS, PRONOUN_POOLS, type GenderOption } from '../data/identityOptions'
import type { EdndCharacter, EndowmentProfile } from '../types/character'
import { normalizedEndowment, rollEndowmentSize } from './endowment'
import { syncGenitalTraitWithBiology } from './genitalTrait'

export function endowmentFlags(e: EndowmentProfile) {
  const hasPhallus = e.anatomy === 'phallus' || e.anatomy === 'both'
  const hasBreasts = e.anatomy === 'breasts' || e.anatomy === 'both'
  const hasVagina = e.vaginaPresent === true
  return { hasPhallus, hasBreasts, hasVagina }
}

/**
 * Gender is derived from endowment:
 * phallus only → Male; phallus + vagina → Hermaphrodite; vagina only → Cuntboy;
 * vagina + breasts → Female; phallus + breasts → Shemale.
 */
export function deriveGenderFromEndowment(e: EndowmentProfile): GenderOption | '' {
  const { hasPhallus, hasBreasts, hasVagina } = endowmentFlags(e)
  if (hasPhallus && hasVagina) return 'Hermaphrodite'
  if (hasPhallus && hasBreasts) return 'Shemale'
  if (hasPhallus) return 'Male'
  if (hasVagina && hasBreasts) return 'Female'
  if (hasVagina) return 'Cuntboy'
  return ''
}

export function rollRandomEndowmentForGender(gender: GenderOption): EndowmentProfile {
  switch (gender) {
    case 'Male':
      return {
        anatomy: 'phallus',
        phallusSize: rollEndowmentSize(),
        vaginaPresent: false,
      }
    case 'Hermaphrodite':
      return {
        anatomy: 'phallus',
        phallusSize: rollEndowmentSize(),
        vaginaPresent: true,
        vaginaSize: rollEndowmentSize(),
      }
    case 'Cuntboy':
      return {
        anatomy: 'neither',
        vaginaPresent: true,
        vaginaSize: rollEndowmentSize(),
      }
    case 'Female':
      return {
        anatomy: 'breasts',
        breastsSize: rollEndowmentSize(),
        vaginaPresent: true,
        vaginaSize: rollEndowmentSize(),
      }
    case 'Shemale':
      return {
        anatomy: 'both',
        breastsSize: rollEndowmentSize(),
        phallusSize: rollEndowmentSize(),
        vaginaPresent: false,
      }
  }
}

export function rollPronounsForGender(gender: GenderOption): string {
  const pool = PRONOUN_POOLS[gender]
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function pickRandomGender(): GenderOption {
  return GENDERS[Math.floor(Math.random() * GENDERS.length)]!
}

export function withEndowmentOnCharacter(
  c: EdndCharacter,
  endowment: EndowmentProfile,
): EdndCharacter {
  const normalized = normalizedEndowment(endowment)
  const genderIdentity = deriveGenderFromEndowment(normalized)
  return syncGenitalTraitWithBiology({
    ...c,
    endowment: normalized,
    genderIdentity,
  })
}
