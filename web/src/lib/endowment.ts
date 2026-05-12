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
  'Breasts, phallus, and vagina (when present) each use the same size roll: 1d6 where 1 = Tiny, 2 = Small, 3 = Medium, 4 = Large, 5 = Huge, 6 = Gargantuan.'

/**
 * For endowment rules, phallus is only for biological Male or Transgender.
 * Female and Nonbinary: neither or breasts only (no phallus / no both).
 * Empty biological sex: all breast/phallus options until the player sets biology.
 */
export function phallusAllowedForBiologicalSex(biologicalSex: string): boolean {
  const g = biologicalSex.trim()
  if (!g) return true
  return g === 'Male' || g === 'Transgender'
}

/** Vagina endowment is modeled for Female, Nonbinary, and Transgender; not for biological Male here. */
export function vaginaAllowedForBiologicalSex(biologicalSex: string): boolean {
  const g = biologicalSex.trim()
  if (!g) return true
  if (g === 'Male') return false
  return g === 'Female' || g === 'Nonbinary' || g === 'Transgender'
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
  if (e.anatomy === 'phallus') {
    return { ...e, anatomy: 'neither', phallusSize: undefined }
  }
  if (e.anatomy === 'both') {
    if (e.breastsSize) {
      return { ...e, anatomy: 'breasts', phallusSize: undefined }
    }
    return { ...e, anatomy: 'neither', breastsSize: undefined, phallusSize: undefined }
  }
  return e
}

/**
 * Applies phallus rules, clears vagina when not allowed, and defaults Female vagina to "present"
 * when the field was left unset (legacy sheets / new picks).
 */
export function normalizedEndowment(
  biologicalSex: string,
  e: EndowmentProfile,
): EndowmentProfile {
  let x = coerceEndowmentForBiologicalSex(biologicalSex, e)
  const g = biologicalSex.trim()
  if (!vaginaAllowedForBiologicalSex(g)) {
    return {
      ...x,
      vaginaPresent: false,
      vaginaSize: undefined,
    }
  }
  if (g === 'Female' && x.vaginaPresent === undefined) {
    x = { ...x, vaginaPresent: true }
  }
  return x
}

/**
 * Human-facing lines: concrete organs and size categories, not internal keys.
 */
export function formatEndowmentLines(e: EndowmentProfile): string[] {
  const lines: string[] = []
  const vaginaLine =
    e.vaginaPresent === true
      ? e.vaginaSize
        ? `Vagina: ${e.vaginaSize}.`
        : 'Vagina: present (size not rolled).'
      : null

  if (e.anatomy === 'neither') {
    if (!vaginaLine) {
      return ['No primary breast, phallus, or vagina endowment (or none specified).']
    }
    lines.push('No breast or phallus size category (neither).')
    lines.push(vaginaLine)
    return lines
  }
  if (e.anatomy === 'breasts') {
    lines.push(`Breasts: ${e.breastsSize ?? '— (not rolled)'}.`)
  } else if (e.anatomy === 'phallus') {
    lines.push(`Phallus: ${e.phallusSize ?? '— (not rolled)'}.`)
  } else {
    lines.push(`Breasts: ${e.breastsSize ?? '— (not rolled)'}.`)
    lines.push(`Phallus: ${e.phallusSize ?? '— (not rolled)'}.`)
  }
  if (vaginaLine) lines.push(vaginaLine)
  return lines
}

/**
 * Random character: rolls breast/phallus anatomy and sizes valid for biological sex,
 * then rolls vagina where allowed (always for Female; often for Nonbinary / Transgender).
 */
export function rollRandomEndowmentForBiologicalSex(
  biologicalSex: string,
): EndowmentProfile {
  const allowed = getAllowedAnatomiesForBiologicalSex(biologicalSex)
  const anatomy = allowed[Math.floor(Math.random() * allowed.length)]!
  let e: EndowmentProfile
  if (anatomy === 'neither') e = { anatomy: 'neither', vaginaPresent: false }
  else if (anatomy === 'breasts') {
    e = { anatomy: 'breasts', breastsSize: rollEndowmentSize(), vaginaPresent: false }
  } else if (anatomy === 'phallus') {
    e = { anatomy: 'phallus', phallusSize: rollEndowmentSize(), vaginaPresent: false }
  } else {
    e = {
      anatomy: 'both',
      breastsSize: rollEndowmentSize(),
      phallusSize: rollEndowmentSize(),
      vaginaPresent: false,
    }
  }

  const g = biologicalSex.trim()
  if (!vaginaAllowedForBiologicalSex(g)) {
    return e
  }
  if (g === 'Female') {
    return { ...e, vaginaPresent: true, vaginaSize: rollEndowmentSize() }
  }
  if (g === 'Nonbinary' || g === 'Transgender') {
    if (Math.random() < 0.55) {
      return { ...e, vaginaPresent: true, vaginaSize: rollEndowmentSize() }
    }
    return { ...e, vaginaPresent: false, vaginaSize: undefined }
  }
  if (!g && Math.random() < 0.45) {
    return { ...e, vaginaPresent: true, vaginaSize: rollEndowmentSize() }
  }
  return e
}
