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

export function breastsAllowedForBiologicalSex(biologicalSex: string): boolean {
  const g = biologicalSex.trim()
  if (!g) return true
  return g === 'Female'
}

export function phallusAllowedForBiologicalSex(biologicalSex: string): boolean {
  const g = biologicalSex.trim()
  if (!g) return true
  return g === 'Male'
}

/** Vagina can be configured for Male or Female (and while biology is unset). */
export function vaginaAllowedForBiologicalSex(biologicalSex: string): boolean {
  const g = biologicalSex.trim()
  if (!g) return true
  return g === 'Male' || g === 'Female'
}

export function getAllowedAnatomiesForBiologicalSex(
  biologicalSex: string,
): EndowmentAnatomy[] {
  const g = biologicalSex.trim()
  if (!g) return ['neither', 'breasts', 'phallus', 'both']
  if (g === 'Male') return ['neither', 'phallus']
  if (g === 'Female') return ['neither', 'breasts']
  return ['neither', 'breasts', 'phallus', 'both']
}

/** Strip breast/phallus fields that conflict with Male or Female biology. */
export function coerceEndowmentForBiologicalSex(
  biologicalSex: string,
  e: EndowmentProfile,
): EndowmentProfile {
  const g = biologicalSex.trim()
  if (!g) return e

  if (g === 'Male') {
    if (e.anatomy === 'breasts') {
      return {
        ...e,
        anatomy: 'phallus',
        breastsSize: undefined,
        phallusSize: e.phallusSize,
      }
    }
    if (e.anatomy === 'both') {
      return {
        ...e,
        anatomy: 'phallus',
        breastsSize: undefined,
      }
    }
    return { ...e, breastsSize: undefined }
  }

  if (g === 'Female') {
    if (e.anatomy === 'phallus') {
      return {
        ...e,
        anatomy: 'breasts',
        phallusSize: undefined,
        breastsSize: e.breastsSize,
      }
    }
    if (e.anatomy === 'both') {
      return {
        ...e,
        anatomy: 'breasts',
        phallusSize: undefined,
      }
    }
    return { ...e, phallusSize: undefined }
  }

  return e
}

/**
 * Applies anatomy rules, clears vagina when not allowed, and defaults vagina "present"
 * when unset for Female (legacy sheets / new picks). Male defaults vagina absent when unset.
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
  if (g === 'Male' && x.vaginaPresent === undefined) {
    x = { ...x, vaginaPresent: false }
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
 * Random character: rolls anatomy and sizes valid for biological sex,
 * then rolls vagina where allowed (always for Female; sometimes for Male).
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
    return normalizedEndowment(g, e)
  }
  if (g === 'Female') {
    return normalizedEndowment(g, {
      ...e,
      vaginaPresent: true,
      vaginaSize: rollEndowmentSize(),
    })
  }
  if (g === 'Male') {
    if (Math.random() < 0.35) {
      return normalizedEndowment(g, {
        ...e,
        vaginaPresent: true,
        vaginaSize: rollEndowmentSize(),
      })
    }
    return normalizedEndowment(g, { ...e, vaginaPresent: false, vaginaSize: undefined })
  }
  if (!g && Math.random() < 0.45) {
    return normalizedEndowment(g, {
      ...e,
      vaginaPresent: true,
      vaginaSize: rollEndowmentSize(),
    })
  }
  return normalizedEndowment(g, e)
}
