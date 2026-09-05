import { resolveSpeciesTableId } from '../lib/speciesAliases'

/** D&D creature size category players can choose for certain lineages. */
export const CREATURE_SIZES = ['Medium', 'Small'] as const
export type CreatureSize = (typeof CREATURE_SIZES)[number]

export function isCreatureSize(value: string): value is CreatureSize {
  return (CREATURE_SIZES as readonly string[]).includes(value)
}

/** Humans, elves, and dwarves (including Duergar / Drow) may be Medium or Small. */
const SIZE_CHOICE_SPECIES = new Set([
  'human',
  'highelf',
  'woodelf',
  'drow',
  'hilldwarf',
  'mountaindwarf',
  'duergar',
])

export function speciesAllowsCreatureSizeChoice(speciesId: string): boolean {
  const id = resolveSpeciesTableId(speciesId.trim())
  return SIZE_CHOICE_SPECIES.has(id)
}

export function defaultCreatureSizeForSpecies(speciesId: string): CreatureSize | undefined {
  if (!speciesAllowsCreatureSizeChoice(speciesId)) return undefined
  return 'Medium'
}
