import carnalClassesData from './tables/carnal-classes.json'
import carnalEquipmentData from './tables/carnal-equipment.json'
import carnalTraitsData from './tables/carnal-traits.json'
import awakened from './tables/sexual-histories/awakened.json'
import breedingStock from './tables/sexual-histories/breeding-stock.json'
import chasteVirgin from './tables/sexual-histories/chaste-virgin.json'
import courtesanHistory from './tables/sexual-histories/courtesan.json'
import cultSeducer from './tables/sexual-histories/cult-seducer.json'
import eroticDisciple from './tables/sexual-histories/erotic-disciple.json'
import haremTender from './tables/sexual-histories/harem-tender.json'
import hedonist from './tables/sexual-histories/hedonist.json'
import houseServant from './tables/sexual-histories/house-servant.json'
import indoctrinated from './tables/sexual-histories/indoctrinated.json'
import paramour from './tables/sexual-histories/paramour.json'
import speciesData from './tables/species.json'
import type {
  CarnalClassRow,
  CarnalEquipmentRow,
  CarnalTraitRow,
  SexualHistoryRow,
  SpeciesRow,
} from '../types/tables'

export const species: SpeciesRow[] = speciesData.species as SpeciesRow[]

export const sexualHistories: SexualHistoryRow[] = [
  awakened,
  breedingStock,
  chasteVirgin,
  courtesanHistory,
  cultSeducer,
  eroticDisciple,
  haremTender,
  hedonist,
  houseServant,
  indoctrinated,
  paramour,
] as SexualHistoryRow[]

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
const sexualHistoriesById = byId(sexualHistories)
const carnalTraitsById = byId(carnalTraits)
const carnalClassesById = byId(carnalClasses)
const carnalEquipmentById = byId(carnalEquipment)

export function getSpecies(id: string): SpeciesRow | undefined {
  return speciesById.get(id)
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
