/**
 * Legacy grouped ids from older saves. These are ambiguous (High vs Wood vs Drow elf;
 * Hill vs Mountain vs Duergar dwarf) and must not pick a subrace for portraits.
 */
export const AMBIGUOUS_LEGACY_SPECIES_IDS = new Set(['elf', 'dwarf'])

/**
 * Fallback for table lookups only (species row, proficiencies, carnal trait text).
 * Portraits use {@link resolveSpeciesPortraitId} and skip these mappings.
 */
const LEGACY_SPECIES_TABLE_FALLBACK: Record<string, string> = {
  elf: 'highelf',
  dwarf: 'hilldwarf',
}

/** Resolve a species id for registry / mergeTableProficiencies (not portraits). */
export function resolveSpeciesTableId(id: string): string {
  const t = id.trim()
  if (!t) return t
  return LEGACY_SPECIES_TABLE_FALLBACK[t] ?? t
}

/** Resolve a species id for portrait filenames; never maps ambiguous legacy ids. */
export function resolveSpeciesPortraitId(id: string): string {
  const t = id.trim()
  if (!t) return t
  if (AMBIGUOUS_LEGACY_SPECIES_IDS.has(t)) return t
  return resolveSpeciesTableId(t)
}
