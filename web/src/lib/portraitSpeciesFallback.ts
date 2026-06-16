import { resolveSpeciesTableId } from './speciesAliases'

/**
 * When a species has no portrait for the current gender, try these table ids in order.
 * Keeps art plausible (duergar → drow, wood elf → high elf, aasimar → celestial elf).
 */
export const PORTRAIT_SPECIES_FALLBACK_CHAIN: Record<string, readonly string[]> = {
  aasimar: ['highelf', 'human'],
  duergar: ['drow', 'hilldwarf'],
  mountaindwarf: ['hilldwarf'],
  woodelf: ['highelf'],
  elf: ['highelf'],
  dwarf: ['hilldwarf'],
  goliath: ['human', 'orc'],
}

/** Species ids to try for portraits: primary first, then fallbacks. */
export function portraitSpeciesLookupOrder(speciesId: string): string[] {
  const primary = resolveSpeciesTableId(speciesId.trim())
  if (!primary) return []
  const fallbacks = PORTRAIT_SPECIES_FALLBACK_CHAIN[primary] ?? []
  return [...new Set([primary, ...fallbacks])]
}
