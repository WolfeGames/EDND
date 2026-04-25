import { getSexualHistory, getSpecies } from '../data/registry'
import type { EroticTraits } from '../types/character'

/** Overwrite carnal skill + position lines from species + sexual history tables. */
export function mergeTableProficiencies(
  speciesId: string,
  historyId: string,
  base: EroticTraits,
): EroticTraits {
  const speciesRow = speciesId ? getSpecies(speciesId) : undefined
  const hist = historyId ? getSexualHistory(historyId) : undefined
  const arts = new Set<string>()
  for (const a of speciesRow?.eroticGrants ?? []) arts.add(a)
  for (const a of hist?.eroticArts ?? []) arts.add(a)
  const positions: string[] = []
  if (hist) {
    positions.push(...hist.positionProficiencies.tiers)
    for (const p of hist.positionProficiencies.specific ?? []) positions.push(p)
  }
  return {
    ...base,
    carnalSkillProficiencies: [...arts],
    positionProficiencies: positions,
  }
}
