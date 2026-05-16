import carnalClassesData from './tables/carnal-classes.json'
import carnalEquipmentData from './tables/carnal-equipment.json'
import carnalTraitsData from './tables/carnal-traits.json'
import speciesData from './tables/species.json'
import { resolveSpeciesTableId } from '../lib/speciesAliases'
import { buildSexualHistories } from '../lib/sexualHistoryMerge'
import type {
  CarnalClassRow,
  CarnalEquipmentRow,
  CarnalTraitRow,
  SexualHistoryRow,
  SpeciesRow,
} from '../types/tables'

export const species: SpeciesRow[] = speciesData.species as SpeciesRow[]

/**
 * Species shown in Character Creator and Random Generator rolls/filters.
 * Full `species` remains for sheets, imports, and legacy characters.
 */
export const PLAYABLE_SPECIES_IDS: readonly string[] = [
  'aasimar',
  'dragonborn',
  'mountaindwarf',
  'hilldwarf',
  'duergar',
  'highelf',
  'woodelf',
  'drow',
  'gnome',
  'goliath',
  'halfling',
  'human',
  'orc',
  'tiefling',
]

export const sexualHistories: SexualHistoryRow[] = buildSexualHistories()

export const carnalTraits: CarnalTraitRow[] =
  carnalTraitsData.carnalTraits as CarnalTraitRow[]

export const carnalClasses: CarnalClassRow[] =
  carnalClassesData.carnalClasses as unknown as CarnalClassRow[]

export const carnalEquipment: CarnalEquipmentRow[] =
  carnalEquipmentData.carnalEquipment as CarnalEquipmentRow[]

function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>()
  for (const row of rows) {
    map.set(row.id, row)
  }
  return map
}

const speciesById = byId(species)
const playableSpeciesIdSet = new Set(PLAYABLE_SPECIES_IDS)

export const playableSpecies: SpeciesRow[] = PLAYABLE_SPECIES_IDS.map((id) => {
  const row = speciesById.get(id)
  if (!row) throw new Error(`Playable species id "${id}" missing from species.json`)
  return row
})

export function isPlayableSpeciesId(id: string): boolean {
  return playableSpeciesIdSet.has(id.trim())
}

const sexualHistoriesById = byId(sexualHistories)
const carnalTraitsById = byId(carnalTraits)
const carnalClassesById = byId(carnalClasses)
const carnalEquipmentById = byId(carnalEquipment)

export function getSpecies(id: string): SpeciesRow | undefined {
  return speciesById.get(resolveSpeciesTableId(id))
}

export function getSexualHistory(id: string): SexualHistoryRow | undefined {
  return sexualHistoriesById.get(id)
}

export function getCarnalTrait(id: string): CarnalTraitRow | undefined {
  return carnalTraitsById.get(id)
}

export function getCarnalClass(id: string): CarnalClassRow | undefined {
  return carnalClassesById.get(id)
}

export function getCarnalEquipment(id: string): CarnalEquipmentRow | undefined {
  return carnalEquipmentById.get(id)
}

/** Uniform random element; use for the random character generator. */
export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  const i = Math.floor(Math.random() * items.length)
  return items[i]
}
