import { getCarnalClass, getSexualHistory, getSpecies } from '../data/registry'
import type { EroticTraits } from '../types/character'

/** Overwrite carnal skill + position lines from species + sexual history tables. */
export function mergeTableProficiencies(
  speciesId: string,
  historyId: string,
  carnalClassId: string | undefined,
  base: EroticTraits,
): EroticTraits {
  const speciesRow = speciesId ? getSpecies(speciesId) : undefined
  const hist = historyId ? getSexualHistory(historyId) : undefined
  const cls = carnalClassId ? getCarnalClass(carnalClassId) : undefined
  const arts = new Set<string>()
  for (const a of speciesRow?.eroticGrants ?? []) arts.add(a)
  for (const a of hist?.eroticArts ?? []) arts.add(a)
  for (const a of cls?.eroticArts ?? []) arts.add(a)
  const positions: string[] = []
  if (hist) {
    positions.push(...hist.positionProficiencies.tiers)
    for (const p of hist.positionProficiencies.specific ?? []) positions.push(p)
  }
  for (const p of cls?.positionProficiencies?.tiers ?? []) positions.push(p)
  for (const p of cls?.positionProficiencies?.specific ?? []) positions.push(p)
  const tools = new Set<string>()
  for (const t of base.eroticToolProficiencies) tools.add(t)
  for (const t of hist?.toolProficiencies ?? []) tools.add(t)
  for (const t of cls?.toolProficiencies ?? []) tools.add(t)
  return {
    ...base,
    carnalSkillProficiencies: [...arts],
    positionProficiencies: positions,
    eroticToolProficiencies: [...tools],
  }
}
