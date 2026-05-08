import type { EndowmentAnatomy, EndowmentProfile, EndowmentSize } from '../types/character'

const ENDOWMENT_TABLE: EndowmentSize[] = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
]

/** Roll 1d6: 1 = Tiny … 6 = Gargantuan. */
export function rollEndowmentSize(): EndowmentSize {
  const d6 = 1 + Math.floor(Math.random() * 6)
  return ENDOWMENT_TABLE[d6 - 1]!
}

export const ENDOWMENT_SIZE_RULE =
  'Size is rolled on 1d6: 1 = Tiny, 2 = Small, 3 = Medium, 4 = Large, 5 = Huge, 6 = Gargantuan.'

/**
 * For endowment & penetration rules, phallus is only for biological Male or Transgender.
 * Female and Nonbinary: neither or breasts only.
 * Empty biological sex: all options (until the player sets biology).
 */
export function phallusAllowedForBiologicalSex(biologicalSex: string): boolean {
  const g = biologicalSex.trim()
  if (!g) return true
  return g === 'Male' || g === 'Transgender'
}

export function getAllowedAnatomiesForBiologicalSex(
  biologicalSex: string,
): EndowmentAnatomy[] {
  const g = biologicalSex.trim()
  if (!g) return ['neither', 'breasts', 'phallus', 'both']
  if (g === 'Female' || g === 'Nonbinary') return ['neither', 'breasts']
  if (g === 'Male' || g === 'Transgender') {
    return ['neither', 'breasts', 'phallus', 'both']
  }
  return ['neither', 'breasts', 'phallus', 'both']
}

export function coerceEndowmentForBiologicalSex(
  biologicalSex: string,
  e: EndowmentProfile,
): EndowmentProfile {
  if (phallusAllowedForBiologicalSex(biologicalSex)) return e
  if (e.anatomy === 'neither' || e.anatomy === 'breasts') return e
  if (e.anatomy === 'phallus') return { anatomy: 'neither' }
  if (e.anatomy === 'both') {
    if (e.breastsSize) {
      return { anatomy: 'breasts', breastsSize: e.breastsSize }
    }
    return { anatomy: 'neither' }
  }
  return e
}

/**
 * Human-facing lines: concrete organs and size categories, not the internal "anatomy" key.
 * Omits the word "anatomy" from the output.
 */
export function formatEndowmentLines(e: EndowmentProfile): string[] {
  if (e.anatomy === 'neither') {
    return ['No primary breast or phallus endowment (or none specified).']
  }
  if (e.anatomy === 'breasts') {
    return [`Breasts: ${e.breastsSize ?? '— (not rolled)'}.`]
  }
  if (e.anatomy === 'phallus') {
    return [`Phallus: ${e.phallusSize ?? '— (not rolled)'}.`]
  }
  return [
    `Breasts: ${e.breastsSize ?? '— (not rolled)'}.`,
    `Phallus: ${e.phallusSize ?? '— (not rolled)'}.`,
  ]
}

/**
 * Random character: only rolls anatomy and sizes that are valid for the given biological sex.
 */
export function rollRandomEndowmentForBiologicalSex(
  biologicalSex: string,
): EndowmentProfile {
  const allowed = getAllowedAnatomiesForBiologicalSex(biologicalSex)
  const anatomy = allowed[Math.floor(Math.random() * allowed.length)]!
  if (anatomy === 'neither') return { anatomy: 'neither' }
  if (anatomy === 'breasts') {
    return { anatomy: 'breasts', breastsSize: rollEndowmentSize() }
  }
  if (anatomy === 'phallus') {
    return { anatomy: 'phallus', phallusSize: rollEndowmentSize() }
  }
  return {
    anatomy: 'both',
    breastsSize: rollEndowmentSize(),
    phallusSize: rollEndowmentSize(),
  }
}
