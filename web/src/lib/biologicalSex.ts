import { isGenderOption } from '../data/identityOptions'
import type { EdndCharacter } from '../types/character'
import { syncCharacterCarnalTraitSelections } from './carnalTraitSelection'
import { normalizedEndowment } from './endowment'
import { normalizeGenitalTraitOnCharacter } from './genitalTrait'

/** Portrait art is still paired male/female per species. */
export type BiologicalSex = 'Male' | 'Female'

export function sanitizeGenderForApp(raw: string): string {
  const t = raw.trim()
  if (isGenderOption(t)) return t
  // Legacy anatomy-derived labels → identity options
  if (t === 'Hermaphrodite') return 'Intersex'
  if (t === 'Cuntboy') return 'Male'
  if (t === 'Shemale') return 'Female'
  if (t === 'Transgender') return 'Male'
  if (t === 'Nonbinary') return 'Agender'
  return ''
}

/** @deprecated Use sanitizeGenderForApp */
export const sanitizeBiologicalSexForApp = sanitizeGenderForApp

export function isCanonicalGender(g: string): boolean {
  return isGenderOption(g)
}

export function portraitBinaryForGender(gender: string): BiologicalSex | null {
  const g = sanitizeGenderForApp(gender)
  if (g === 'Male') return 'Male'
  if (g === 'Female') return 'Female'
  // Intersex / Agender: do not restrict to one portrait pair
  return null
}

/** True when value is a portrait pair key (legacy binary saves). */
export function isCanonicalBiologicalSex(g: string): g is BiologicalSex {
  return g === 'Male' || g === 'Female'
}

export function normalizeCharacterBiology(c: EdndCharacter): EdndCharacter {
  const endowment = normalizedEndowment(c.endowment)
  const genderIdentity = sanitizeGenderForApp(c.genderIdentity)
  return syncCharacterCarnalTraitSelections(
    normalizeGenitalTraitOnCharacter({
      ...c,
      genderIdentity,
      endowment,
    }),
  )
}
