import type { EndowmentAnatomy, EndowmentProfile, EndowmentSize } from '../types/character'
import type { DndCreatureSize } from './phallusScale'
import {
  formatPhallusExactLength,
  formatPhallusInchRange,
  formatPhallusSizeLabel,
} from './phallusScale'

export const ENDOWMENT_SIZES: EndowmentSize[] = [
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
  return ENDOWMENT_SIZES[d6 - 1]!
}

export function isEndowmentSize(value: string): value is EndowmentSize {
  return (ENDOWMENT_SIZES as readonly string[]).includes(value)
}

export const ENDOWMENT_SIZE_RULE =
  'Breasts and vagina use size categories on a 1d6 (1 = Tiny … 6 = Gargantuan). Phallus uses the same tiers with length in inches scaled by creature size; optional 1d20 sets an exact length (base + 0.1" × roll).'

const BREAST_SIZE_BLURBS: Record<EndowmentSize, string> = {
  Tiny: 'Barely-there bust — flat to very slight.',
  Small: 'Petite, lightly rounded chest.',
  Medium: 'Average, proportional bust.',
  Large: 'Full and prominent.',
  Huge: 'Very large, heavy bust.',
  Gargantuan: 'Immense, oversized bust.',
}

const VAGINA_SIZE_BLURBS: Record<EndowmentSize, string> = {
  Tiny: 'Very tight / shallow capacity.',
  Small: 'Narrow, modest capacity.',
  Medium: 'Average fit and depth.',
  Large: 'Accommodating, roomy.',
  Huge: 'Very spacious capacity.',
  Gargantuan: 'Extreme capacity; nearly limitless stretch for most partners.',
}

export function describeBreastsSize(size: EndowmentSize): string {
  return `${size}: ${BREAST_SIZE_BLURBS[size]}`
}

export function describeVaginaSize(size: EndowmentSize): string {
  return `${size}: ${VAGINA_SIZE_BLURBS[size]}`
}

export function describePhallusSize(
  size: EndowmentSize,
  creatureSize: DndCreatureSize,
): string {
  const range = formatPhallusInchRange(size, creatureSize)
  const offsetNote =
    creatureSize === 'Large'
      ? ' (+2" vs Medium/Small scale)'
      : creatureSize === 'Huge'
        ? ' (+4" vs Medium/Small scale)'
        : creatureSize === 'Gargantuan'
          ? ' (+8" vs Medium/Small scale)'
          : creatureSize === 'Tiny'
            ? ' (Tiny creatures are capped at this tier)'
            : ''
  return `${size}: ${range} for a ${creatureSize} creature${offsetNote}.`
}

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
    out.phallusLengthDie = undefined
  }
  if (out.anatomy === 'neither' || out.anatomy === 'phallus') {
    out.breastsSize = undefined
  }
  if (out.vaginaPresent !== true) {
    out.vaginaPresent = false
    out.vaginaSize = undefined
  }
  if (!out.phallusSize) {
    out.phallusLengthDie = undefined
  } else if (out.phallusLengthDie !== undefined) {
    const die = Math.round(Number(out.phallusLengthDie))
    if (!Number.isFinite(die) || die < 1 || die > 20) {
      out.phallusLengthDie = undefined
    } else {
      out.phallusLengthDie = die
    }
  }
  return out
}

/**
 * Human-facing lines: concrete organs and size categories.
 * Pass creatureSize to annotate phallus with inch ranges.
 */
export function formatEndowmentLines(
  e: EndowmentProfile,
  creatureSize?: DndCreatureSize,
): string[] {
  const lines: string[] = []
  const vaginaLine =
    e.vaginaPresent === true
      ? e.vaginaSize
        ? `Vagina: ${e.vaginaSize}.`
        : 'Vagina: present (size not set).'
      : null

  const phallusLabel = (size: EndowmentSize | undefined, lengthDie?: number) => {
    if (!size) return '— (not set)'
    if (!creatureSize) {
      return lengthDie !== undefined ? `${size} · 1d20→${lengthDie}` : size
    }
    const tier = formatPhallusSizeLabel(size, creatureSize)
    if (lengthDie === undefined) return tier
    return `${tier} · ${formatPhallusExactLength(size, creatureSize, lengthDie)}`
  }

  if (e.anatomy === 'neither') {
    if (!vaginaLine) {
      return ['No primary breast, phallus, or vagina endowment (or none specified).']
    }
    lines.push('No breast or phallus size category (neither).')
    lines.push(vaginaLine)
    return lines
  }
  if (e.anatomy === 'breasts') {
    lines.push(`Breasts: ${e.breastsSize ?? '— (not set)'}.`)
  } else if (e.anatomy === 'phallus') {
    lines.push(`Phallus: ${phallusLabel(e.phallusSize, e.phallusLengthDie)}.`)
  } else {
    lines.push(`Breasts: ${e.breastsSize ?? '— (not set)'}.`)
    lines.push(`Phallus: ${phallusLabel(e.phallusSize, e.phallusLengthDie)}.`)
  }
  if (vaginaLine) lines.push(vaginaLine)
  return lines
}
