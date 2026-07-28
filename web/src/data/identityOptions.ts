/** Player-chosen gender identity labels. */
export const GENDERS = ['Male', 'Female', 'Intersex', 'Agender'] as const

export type GenderOption = (typeof GENDERS)[number]

export function isGenderOption(value: string): value is GenderOption {
  return (GENDERS as readonly string[]).includes(value)
}

/** Player-chosen pronoun sets. */
export const PRONOUNS = ['he/him', 'she/her', 'he/they', 'she/they'] as const

export type PronounOption = (typeof PRONOUNS)[number]

export function isPronounOption(value: string): value is PronounOption {
  return (PRONOUNS as readonly string[]).includes(value)
}

/** Random-generator pronoun pools when the player does not pick pronouns in filters. */
export const PRONOUN_POOLS: Record<GenderOption, readonly PronounOption[]> = {
  Male: ['he/him', 'he/they'],
  Female: ['she/her', 'she/they'],
  Intersex: ['he/him', 'she/her', 'he/they', 'she/they'],
  Agender: ['he/him', 'she/her', 'he/they', 'she/they'],
}
