/** Biological sex for portraits, random rolls, and endowment rules (binary only). */
export const GENDERS = ['Male', 'Female'] as const

export type GenderOption = (typeof GENDERS)[number]

export function isGenderOption(value: string): value is GenderOption {
  return (GENDERS as readonly string[]).includes(value)
}
