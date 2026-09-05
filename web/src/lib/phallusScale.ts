import { getSpecies } from '../data/registry'
import type { EdndCharacter, EndowmentSize } from '../types/character'
import { resolveSpeciesTableId } from './speciesAliases'

const PHALLUS_TIERS: EndowmentSize[] = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
]

/** Full D&D creature size ladder (species table + optional character override). */
export const DND_CREATURE_SIZES = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
] as const

export type DndCreatureSize = (typeof DND_CREATURE_SIZES)[number]

export function isDndCreatureSize(value: string): value is DndCreatureSize {
  return (DND_CREATURE_SIZES as readonly string[]).includes(value)
}

/** Inch offset added to the Medium/Small phallus scale by creature size. */
export const PHALLUS_SCALE_OFFSET_BY_CREATURE: Record<DndCreatureSize, number> = {
  Tiny: 0,
  Small: 0,
  Medium: 0,
  Large: 2,
  Huge: 4,
  Gargantuan: 8,
}

/** Baseline phallus length (inches) for Medium and Small creatures. */
export const PHALLUS_BASE_INCH_RANGE: Record<
  EndowmentSize,
  { min: number; max: number | null }
> = {
  Tiny: { min: 1, max: 3 },
  Small: { min: 3, max: 4 },
  Medium: { min: 4, max: 6 },
  Large: { min: 6, max: 8 },
  Huge: { min: 9, max: 11 },
  Gargantuan: { min: 11, max: null },
}

/**
 * Effective creature size for endowment / sheet display.
 * Player override (humans/elves/dwarves) wins; otherwise species table size.
 */
export function resolveCharacterCreatureSize(
  character: Pick<EdndCharacter, 'species' | 'creatureSize'>,
): DndCreatureSize {
  if (character.creatureSize && isDndCreatureSize(character.creatureSize)) {
    return character.creatureSize
  }
  const row = character.species ? getSpecies(character.species) : undefined
  if (row?.size && isDndCreatureSize(row.size)) return row.size
  const resolved = character.species ? resolveSpeciesTableId(character.species) : ''
  const fallback = resolved ? getSpecies(resolved)?.size : undefined
  if (fallback && isDndCreatureSize(fallback)) return fallback
  return 'Medium'
}

export function phallusInchRange(
  endowmentSize: EndowmentSize,
  creatureSize: DndCreatureSize,
): { min: number; max: number | null } {
  const base = PHALLUS_BASE_INCH_RANGE[endowmentSize]
  const offset = PHALLUS_SCALE_OFFSET_BY_CREATURE[creatureSize]
  return {
    min: base.min + offset,
    max: base.max === null ? null : base.max + offset,
  }
}

export function formatPhallusInchRange(
  endowmentSize: EndowmentSize,
  creatureSize: DndCreatureSize,
): string {
  const { min, max } = phallusInchRange(endowmentSize, creatureSize)
  if (max === null) return `${min}"+`
  return `${min}–${max}"`
}

export function formatPhallusSizeLabel(
  endowmentSize: EndowmentSize,
  creatureSize: DndCreatureSize,
): string {
  return `${endowmentSize} (${formatPhallusInchRange(endowmentSize, creatureSize)})`
}

/** 0.1" per pip on the d20; a natural 20 adds 2" to the category base. */
export const PHALLUS_LENGTH_DIE_INCHES = 0.1

export const PHALLUS_LENGTH_RULE =
  'For a specific length, roll 1d20 and add 0.1″ × the result to the size category’s base inches (the low end of its range). A roll of 20 adds 2″.'

/** Sanitize a 1d20 result used for fine phallus measurement. */
export function normalizePhallusLengthDie(raw: number): number {
  return Math.max(1, Math.min(20, Math.round(raw)))
}

export function rollPhallusLengthDie(): number {
  return 1 + Math.floor(Math.random() * 20)
}

/**
 * Exact length in inches: category base (min for creature size) + die × 0.1".
 * Rounded to one decimal place.
 */
export function computePhallusLengthInches(
  endowmentSize: EndowmentSize,
  creatureSize: DndCreatureSize,
  lengthDie: number,
): number {
  const die = normalizePhallusLengthDie(lengthDie)
  const base = phallusInchRange(endowmentSize, creatureSize).min
  return Math.round((base + die * PHALLUS_LENGTH_DIE_INCHES) * 10) / 10
}

export function formatPhallusExactLength(
  endowmentSize: EndowmentSize,
  creatureSize: DndCreatureSize,
  lengthDie: number,
): string {
  const die = normalizePhallusLengthDie(lengthDie)
  const inches = computePhallusLengthInches(endowmentSize, creatureSize, die)
  return `${inches}" (base ${phallusInchRange(endowmentSize, creatureSize).min}" + 1d20→${die} × 0.1")`
}

/** Tiny creatures never exceed Tiny phallus size. */
export function allowedPhallusSizes(creatureSize: DndCreatureSize): EndowmentSize[] {
  if (creatureSize === 'Tiny') return ['Tiny']
  return [...PHALLUS_TIERS]
}

export function clampPhallusSizeForCreature(
  size: EndowmentSize | undefined,
  creatureSize: DndCreatureSize,
): EndowmentSize | undefined {
  if (!size) return undefined
  const allowed = allowedPhallusSizes(creatureSize)
  if (allowed.includes(size)) return size
  return allowed[0]
}

/** 1d6 phallus size, clamped for Tiny creatures. */
export function rollPhallusSize(creatureSize: DndCreatureSize): EndowmentSize {
  if (creatureSize === 'Tiny') return 'Tiny'
  const d6 = 1 + Math.floor(Math.random() * 6)
  return PHALLUS_TIERS[d6 - 1]!
}

export function describePhallusScale(creatureSize: DndCreatureSize): string {
  if (creatureSize === 'Tiny') {
    return `Tiny creatures do not exceed Tiny phallus size (1–3" on the Medium/Small scale). ${PHALLUS_LENGTH_RULE}`
  }
  const offset = PHALLUS_SCALE_OFFSET_BY_CREATURE[creatureSize]
  const tiers = PHALLUS_TIERS.map((s) => formatPhallusSizeLabel(s, creatureSize)).join('; ')
  if (offset === 0) {
    return `Phallus scale (Medium/Small): ${tiers}. ${PHALLUS_LENGTH_RULE}`
  }
  return `Phallus scale for ${creatureSize} creatures (+${offset}"): ${tiers}. ${PHALLUS_LENGTH_RULE}`
}
