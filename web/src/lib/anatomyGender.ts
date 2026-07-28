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

/** Typical endowment rolled for a gender when generating a random character. */
export function rollRandomEndowmentForGender(gender: GenderOption): EndowmentProfile {
  switch (gender) {
    case 'Male':
      return {
        anatomy: 'phallus',
        phallusSize: rollEndowmentSize(),
        vaginaPresent: false,
      }
    case 'Female':
      return {
        anatomy: 'breasts',
        breastsSize: rollEndowmentSize(),
        vaginaPresent: true,
        vaginaSize: rollEndowmentSize(),
      }
    case 'Intersex':
      return {
        anatomy: 'both',
        breastsSize: rollEndowmentSize(),
        phallusSize: rollEndowmentSize(),
        vaginaPresent: true,
        vaginaSize: rollEndowmentSize(),
      }
    case 'Agender': {
      const pool: GenderOption[] = ['Male', 'Female', 'Intersex']
      return rollRandomEndowmentForGender(pool[Math.floor(Math.random() * pool.length)]!)
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

/** Update endowment without overwriting the player's chosen gender identity. */
export function withEndowmentOnCharacter(
  c: EdndCharacter,
  endowment: EndowmentProfile,
): EdndCharacter {
  const normalized = normalizedEndowment(endowment)
  return syncGenitalTraitWithBiology(
    {
      ...c,
      endowment: normalized,
    },
    { preserveExplicitChoice: true },
  )
}
