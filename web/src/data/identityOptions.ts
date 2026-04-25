/** Gender options for sheets and random rolls. */
export const GENDERS = ['Male', 'Female', 'Nonbinary', 'Transgender'] as const

export type GenderOption = (typeof GENDERS)[number]
