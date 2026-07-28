import { resolveSpeciesTableId } from '../lib/speciesAliases'

/** Dice expression for PHB-style height/weight modifiers. */
export type HeightWeightDice = { count: number; sides: number } | { fixed: number }

/**
 * Traditional 5e random height & weight row.
 * Height = baseHeightInches + heightMod; Weight = baseWeightLb + (heightMod × weightMod).
 */
export type SpeciesHeightWeightRow = {
  baseHeightInches: number
  heightDice: HeightWeightDice
  baseWeightLb: number
  weightDice: HeightWeightDice
}

/** Tables keyed by canonical species id (after alias resolve). */
export const SPECIES_HEIGHT_WEIGHT: Record<string, SpeciesHeightWeightRow> = {
  human: {
    baseHeightInches: 56,
    heightDice: { count: 2, sides: 10 },
    baseWeightLb: 110,
    weightDice: { count: 2, sides: 4 },
  },
  aasimar: {
    baseHeightInches: 56,
    heightDice: { count: 2, sides: 10 },
    baseWeightLb: 110,
    weightDice: { count: 2, sides: 4 },
  },
  dragonborn: {
    baseHeightInches: 66,
    heightDice: { count: 2, sides: 8 },
    baseWeightLb: 175,
    weightDice: { count: 2, sides: 6 },
  },
  hilldwarf: {
    baseHeightInches: 44,
    heightDice: { count: 2, sides: 4 },
    baseWeightLb: 115,
    weightDice: { count: 2, sides: 6 },
  },
  mountaindwarf: {
    baseHeightInches: 48,
    heightDice: { count: 2, sides: 4 },
    baseWeightLb: 130,
    weightDice: { count: 2, sides: 6 },
  },
  duergar: {
    baseHeightInches: 44,
    heightDice: { count: 2, sides: 4 },
    baseWeightLb: 120,
    weightDice: { count: 2, sides: 6 },
  },
  highelf: {
    baseHeightInches: 54,
    heightDice: { count: 2, sides: 10 },
    baseWeightLb: 90,
    weightDice: { count: 1, sides: 4 },
  },
  woodelf: {
    baseHeightInches: 54,
    heightDice: { count: 2, sides: 10 },
    baseWeightLb: 100,
    weightDice: { count: 1, sides: 4 },
  },
  drow: {
    baseHeightInches: 53,
    heightDice: { count: 2, sides: 6 },
    baseWeightLb: 75,
    weightDice: { count: 1, sides: 6 },
  },
  gnome: {
    baseHeightInches: 35,
    heightDice: { count: 2, sides: 4 },
    baseWeightLb: 35,
    weightDice: { fixed: 1 },
  },
  goliath: {
    baseHeightInches: 74,
    heightDice: { count: 2, sides: 10 },
    baseWeightLb: 200,
    weightDice: { count: 2, sides: 6 },
  },
  halfling: {
    baseHeightInches: 31,
    heightDice: { count: 2, sides: 4 },
    baseWeightLb: 35,
    weightDice: { fixed: 1 },
  },
  orc: {
    baseHeightInches: 64,
    heightDice: { count: 2, sides: 8 },
    baseWeightLb: 175,
    weightDice: { count: 2, sides: 6 },
  },
  tiefling: {
    baseHeightInches: 57,
    heightDice: { count: 2, sides: 8 },
    baseWeightLb: 110,
    weightDice: { count: 2, sides: 4 },
  },
}

export function getSpeciesHeightWeightRow(
  speciesId: string,
): SpeciesHeightWeightRow {
  const id = resolveSpeciesTableId(speciesId.trim()) || speciesId.trim()
  return SPECIES_HEIGHT_WEIGHT[id] ?? SPECIES_HEIGHT_WEIGHT.human!
}

export function formatHeightWeightDice(expr: HeightWeightDice): string {
  if ('fixed' in expr) return String(expr.fixed)
  return `${expr.count}d${expr.sides}`
}
