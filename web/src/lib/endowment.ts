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

export const ENDOWMENT_ANATOMY_OPTIONS: Array<{ value: EndowmentAnatomy; label: string }> = [
  { value: 'neither', label: 'Neither breasts nor phallus' },
  { value: 'breasts', label: 'Breasts only' },
  { value: 'phallus', label: 'Phallus only' },
  { value: 'both', label: 'Breasts and phallus' },
]

/** Strip sizes that do not apply to the selected anatomy; normalize vagina flag. */
export function normalizedEndowment(e: EndowmentProfile): EndowmentProfile {
  const out: EndowmentProfile = { ...e, anatomy: e.anatomy }
  if (out.anatomy === 'neither' || out.anatomy === 'breasts') {
    out.phallusSize = undefined
  }
  if (out.anatomy === 'neither' || out.anatomy === 'phallus') {
    out.breastsSize = undefined
  }
  if (out.vaginaPresent !== true) {
    out.vaginaPresent = false
    out.vaginaSize = undefined
  }
  return out
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
