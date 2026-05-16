import racialBundle from '../data/tables/racial-sexual-traits.json'
import type { RacialSexualTraitEntry, RacialSexualTraitsGroup } from '../types/tables'
type BundleMap = Record<string, RacialSexualTraitsGroup>

const BUNDLE: BundleMap = racialBundle.racialSexualTraits as BundleMap

export type RacialSexualTraitSection = {
  /** Key in JSON (e.g. dwarf, duergar, elf). */
  groupId: string
  name: string
  theme: string
  traits: RacialSexualTraitEntry[]
}

/**
 * Ordered sections for a species table id: shared ancestry (Dwarf, Elf) first,
 * then subrace-only blocks (Duergar, Drow). Non-playable or unknown ids yield [].
 */
export function getRacialSexualTraitSections(speciesId: string): RacialSexualTraitSection[] {
  const id = speciesId.trim()
  if (!id) return []

  const out: RacialSexualTraitSection[] = []
  const push = (key: string) => {
    const g = BUNDLE[key]
    if (!g) return
    out.push({
      groupId: key,
      name: g.name,
      theme: g.theme,
      traits: g.traits,
    })
  }

  if (id === 'hilldwarf' || id === 'mountaindwarf') {
    push('dwarf')
  } else if (id === 'duergar') {
    push('dwarf')
    push('duergar')
  } else if (id === 'highelf' || id === 'woodelf') {
    push('elf')
  } else if (id === 'drow') {
    push('elf')
    push('drow')
  } else if (BUNDLE[id]) {
    push(id)
  }

  return out
}

export function formatRacialTraitBody(t: RacialSexualTraitEntry): string {
  return [`Mechanical: ${t.mechanical}`, '', `Flavor: ${t.flavor}`].join('\n')
}
