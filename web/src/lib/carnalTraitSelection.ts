import { getCarnalClass, getSexualHistory, selectableCarnalTraits } from '../data/registry'
import { resolveSpeciesTableId } from './speciesAliases'
import type { EdndCharacter } from '../types/character'
import type { CarnalTraitRow, CarnalTraitSources } from '../types/tables'

export type CarnalTraitPickContext = 'class' | 'history'

const CLASS_TRAIT_SLOTS: Record<string, number> = {
  courtesan: 4,
}

const DEFAULT_CLASS_TRAIT_SLOTS = 3

/** Histories with only one selectable trait slot (others default to 2). */
const HISTORY_ONE_TRAIT: ReadonlySet<string> = new Set(['chaste-virgin', 'awakened'])

export function getCarnalClassTraitSlotCount(carnalClassId?: string): number {
  if (!carnalClassId?.trim()) return 0
  return CLASS_TRAIT_SLOTS[carnalClassId] ?? DEFAULT_CLASS_TRAIT_SLOTS
}

export function getSexualHistoryTraitSlotCount(sexualHistoryId?: string): number {
  if (!sexualHistoryId?.trim()) return 0
  const row = getSexualHistory(sexualHistoryId)
  if (row?.carnalTraitSlots != null) {
    return Math.min(2, Math.max(1, row.carnalTraitSlots))
  }
  if (HISTORY_ONE_TRAIT.has(sexualHistoryId)) return 1
  const legacyCount = row?.carnalTraits?.length ?? 2
  return Math.min(2, Math.max(1, legacyCount))
}

function speciesMatches(sources: CarnalTraitSources | undefined, speciesId: string): boolean {
  if (!sources?.speciesIds?.length || !speciesId) return false
  const resolved = resolveSpeciesTableId(speciesId)
  return sources.speciesIds.some((id) => resolveSpeciesTableId(id) === resolved)
}

function matchesExclusive(
  trait: CarnalTraitRow,
  ctx: CarnalTraitPickContext,
  speciesId: string,
  carnalClassId: string,
  sexualHistoryId: string,
): boolean {
  const s = trait.sources
  if (!s?.exclusive) return true
  if (s.general) return true
  if (ctx === 'class' && s.carnalClassIds?.includes(carnalClassId)) return true
  if (ctx === 'history' && s.sexualHistoryIds?.includes(sexualHistoryId)) return true
  if (speciesMatches(s, speciesId)) return true
  return false
}

function isInPool(
  trait: CarnalTraitRow,
  ctx: CarnalTraitPickContext,
  speciesId: string,
  carnalClassId: string,
  sexualHistoryId: string,
): boolean {
  const s = trait.sources
  if (!s || s.general) return matchesExclusive(trait, ctx, speciesId, carnalClassId, sexualHistoryId)

  if (s.exclusive) {
    if (ctx === 'class' && s.carnalClassIds?.includes(carnalClassId)) return true
    if (ctx === 'history' && s.sexualHistoryIds?.includes(sexualHistoryId)) return true
    if (speciesMatches(s, speciesId)) return true
    return false
  }

  if (s.carnalClassIds?.includes(carnalClassId)) return true
  if (s.sexualHistoryIds?.includes(sexualHistoryId)) return true
  if (speciesMatches(s, speciesId)) return true
  return false
}

export function traitsForPickContext(
  ctx: CarnalTraitPickContext,
  speciesId: string,
  carnalClassId: string,
  sexualHistoryId: string,
): CarnalTraitRow[] {
  return selectableCarnalTraits
    .filter((t) => isInPool(t, ctx, speciesId, carnalClassId, sexualHistoryId))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function trimTraitIdsToSlots(ids: string[] | undefined, max: number): string[] {
  if (!ids?.length || max <= 0) return []
  return ids.filter((id, i, arr) => arr.indexOf(id) === i).slice(0, max)
}

export function normalizeClassTraitIds(character: EdndCharacter): string[] {
  const max = getCarnalClassTraitSlotCount(character.carnalClass)
  const pool = new Set(
    traitsForPickContext('class', character.species, character.carnalClass ?? '', character.sexualHistory ?? '').map(
      (t) => t.id,
    ),
  )
  return trimTraitIdsToSlots(
    character.carnalClassTraitIds?.filter((id) => pool.has(id)),
    max,
  )
}

export function normalizeHistoryTraitIds(character: EdndCharacter): string[] {
  const max = getSexualHistoryTraitSlotCount(character.sexualHistory)
  const pool = new Set(
    traitsForPickContext('history', character.species, character.carnalClass ?? '', character.sexualHistory ?? '').map(
      (t) => t.id,
    ),
  )
  return trimTraitIdsToSlots(
    character.sexualHistoryTraitIds?.filter((id) => pool.has(id)),
    max,
  )
}

export function syncCharacterCarnalTraitSelections(c: EdndCharacter): EdndCharacter {
  const carnalClassTraitIds = c.carnalClass ? normalizeClassTraitIds(c) : []
  const sexualHistoryTraitIds = c.sexualHistory ? normalizeHistoryTraitIds(c) : []
  return { ...c, carnalClassTraitIds, sexualHistoryTraitIds }
}

export function carnalClassTraitSelectionLabel(carnalClassId?: string): string {
  const n = getCarnalClassTraitSlotCount(carnalClassId)
  if (n === 0) return ''
  const row = carnalClassId ? getCarnalClass(carnalClassId) : undefined
  const name = row?.name ?? 'carnal class'
  return `Select ${n} carnal trait${n === 1 ? '' : 's'} for ${name}.`
}

export function sexualHistoryTraitSelectionLabel(sexualHistoryId?: string): string {
  const n = getSexualHistoryTraitSlotCount(sexualHistoryId)
  if (n === 0) return ''
  const row = sexualHistoryId ? getSexualHistory(sexualHistoryId) : undefined
  const name = row?.name ?? 'sexual history'
  return `Select ${n} carnal trait${n === 1 ? '' : 's'} for ${name}.`
}

export function pickRandomTraitIds(
  ctx: CarnalTraitPickContext,
  count: number,
  speciesId: string,
  carnalClassId: string,
  sexualHistoryId: string,
): string[] {
  const pool = traitsForPickContext(ctx, speciesId, carnalClassId, sexualHistoryId)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((t) => t.id)
}
