/** Anatomy-derived gender labels (from endowment configuration). */
export const GENDERS = [
  'Male',
  'Hermaphrodite',
  'Cuntboy',
  'Female',
  'Shemale',
] as const

export type GenderOption = (typeof GENDERS)[number]

export function isGenderOption(value: string): value is GenderOption {
  return (GENDERS as readonly string[]).includes(value)
}

/** Random-generator pronoun pools when the player does not type pronouns in filters. */
export const PRONOUN_POOLS: Record<GenderOption, readonly string[]> = {
  Male: ['he/him'],
  Hermaphrodite: ['she/her', 'she/they'],
  Cuntboy: ['he/him', 'he/they'],
  Female: ['she/her'],
  Shemale: ['she/her', 'she/they'],
}
