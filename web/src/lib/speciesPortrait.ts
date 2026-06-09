import portraitManifest from '../data/portraitManifest.json'
import type { EdndCharacter } from '../types/character'
import { resolveSpeciesTableId } from './speciesAliases'
import {
  filterPortraitsForCharacter,
  pickDefaultPortraitEntry,
  pickRandomPortraitEntry,
  type PortraitManifestEntry,
} from './portraitFilename'

export type PortraitVariant = 'male' | 'female' | 'they' | 'unisex'

export type PortraitOption = {
  src: string
  label: string
  speciesId: string
  variant: PortraitVariant
  roleId?: string
  filename: string
}

const ENTRIES = (portraitManifest as { entries: PortraitManifestEntry[] }).entries

const KNOWN_PORTRAIT_SRCS = new Set(ENTRIES.map((e) => e.src))

function variantFromToken(token: PortraitManifestEntry['genderToken']): PortraitVariant {
  if (token === 'f') return 'female'
  if (token === 'm') return 'male'
  if (token === 'they') return 'they'
  return 'unisex'
}

function toOption(entry: PortraitManifestEntry): PortraitOption {
  return {
    src: entry.src,
    label: entry.label,
    speciesId: entry.speciesId,
    variant: variantFromToken(entry.genderToken),
    roleId: entry.roleId,
    filename: entry.filename,
  }
}

export function listPortraitCatalog(): PortraitOption[] {
  return ENTRIES.map(toOption).sort((a, b) => a.label.localeCompare(b.label))
}

export function isKnownPortraitSrc(src: string): boolean {
  return KNOWN_PORTRAIT_SRCS.has(src)
}

export function listPortraitOptionsForCharacter(
  speciesId: string,
  genderIdentity: string,
  carnalClassId?: string,
): PortraitOption[] {
  return filterPortraitsForCharacter(ENTRIES, speciesId, genderIdentity, carnalClassId).map(toOption)
}

/** @deprecated Use listPortraitOptionsForCharacter */
export function listPortraitOptionsForSpecies(speciesId: string): PortraitOption[] {
  const id = resolveSpeciesTableId(speciesId.trim())
  if (!id) return []
  return ENTRIES.filter((e) => e.speciesId === id).map(toOption)
}

export function getDefaultSpeciesPortraitSrc(
  speciesId: string,
  genderIdentity: string,
  carnalClassId?: string,
): string | null {
  const pool = filterPortraitsForCharacter(ENTRIES, speciesId, genderIdentity, carnalClassId)
  const entry = pickDefaultPortraitEntry(pool)
  return entry?.src ?? null
}

export function pickRandomPortraitSrc(
  speciesId: string,
  genderIdentity: string,
  carnalClassId?: string,
): string | null {
  const pool = filterPortraitsForCharacter(ENTRIES, speciesId, genderIdentity, carnalClassId)
  const entry = pickRandomPortraitEntry(pool)
  return entry?.src ?? null
}

/** Player override when set; otherwise species + gender (+ carnal class) default. */
export function getCharacterPortraitSrc(
  character: Pick<
    EdndCharacter,
    'species' | 'genderIdentity' | 'portraitSrc' | 'carnalClass'
  >,
): string | null {
  const custom = character.portraitSrc?.trim()
  if (custom && isKnownPortraitSrc(custom)) return custom
  if (!character.species?.trim()) return null
  return getDefaultSpeciesPortraitSrc(
    character.species,
    character.genderIdentity,
    character.carnalClass,
  )
}

export function speciesHasPortrait(speciesId: string): boolean {
  const id = resolveSpeciesTableId(speciesId.trim())
  return ENTRIES.some((e) => e.speciesId === id)
}
