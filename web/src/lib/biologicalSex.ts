import type { EdndCharacter } from '../types/character'
import { normalizedEndowment } from './endowment'

/** Canonical biological sex in the app (portraits + rolls). */
export type BiologicalSex = 'Male' | 'Female'

/**
 * Maps legacy saves to Male/Female; unknown or empty stays empty until the player picks.
 * (Removed Nonbinary / Transgender — use endowment configuration instead.)
 */
export function sanitizeBiologicalSexForApp(raw: string): string {
  const t = raw.trim()
  if (t === 'Male' || t === 'Female') return t
  if (t === 'Transgender') return 'Male'
  if (t === 'Nonbinary') return 'Female'
  return ''
}

export function isCanonicalBiologicalSex(g: string): g is BiologicalSex {
  return g === 'Male' || g === 'Female'
}

export function normalizeCharacterBiology(c: EdndCharacter): EdndCharacter {
  const genderIdentity = sanitizeBiologicalSexForApp(c.genderIdentity)
  return {
    ...c,
    genderIdentity,
    endowment: normalizedEndowment(genderIdentity, c.endowment),
  }
}
