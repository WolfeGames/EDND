/** Legacy species ids from older saves → current table id (matches portrait filenames). */
export const SPECIES_ID_ALIASES: Record<string, string> = {
  dwarf: 'hilldwarf',
  elf: 'highelf',
}

export function resolveSpeciesTableId(id: string): string {
  const t = id.trim()
  if (!t) return t
  return SPECIES_ID_ALIASES[t] ?? t
}
