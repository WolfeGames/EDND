import fngData from '../data/fngNamePools.json'
import { pickRandom } from '../data/registry'
import { resolveSpeciesTableId } from './speciesAliases'
import type { FngNamePool, FngNamePoolsFile } from './fngNameTypes'

const { pools, speciesMap } = fngData as FngNamePoolsFile

function poolForSpecies(speciesId: string): FngNamePool | undefined {
  const id = resolveSpeciesTableId(speciesId.trim())
  const key = speciesMap[id]
  return key ? pools[key] : pools.human
}

function pickFrom(list: string[] | undefined): string | undefined {
  if (!list?.length) return undefined
  return pickRandom(list)
}

/** Roll a fantasynamegenerators.com–style name for the given species. */
export function rollFantasyNameForSpecies(speciesId: string): string {
  const pool = poolForSpecies(speciesId)
  if (!pool) return 'Unnamed Wanderer'

  if (pool.virtues?.length) {
    const given = pickFrom(pool.given) ?? 'Akmen'
    const virtue = pickFrom(pool.virtues) ?? 'Hope'
    return `${given} ${virtue}`
  }

  const given = pickFrom(pool.given) ?? 'Adventurer'
  const family = pickFrom(pool.family)
  return family ? `${given} ${family}` : given
}

export function getNamePoolKeyForSpecies(speciesId: string): string | undefined {
  const id = resolveSpeciesTableId(speciesId.trim())
  return speciesMap[id]
}

export function listNamePoolKeys(): string[] {
  return Object.keys(pools)
}
