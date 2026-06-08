import profilesBundle from '../data/tables/racial-sexual-profiles.json'
import type { RacialSexualProfileRace } from '../types/tables'
import { resolveSpeciesTableId } from './speciesAliases'

const ROOT = profilesBundle.racialSexualProfiles

export type RacialProfileSection = {
  raceKey: string
  profile: RacialSexualProfileRace
  /** Subrace / lineage block layered on ancestry. */
  isSubrace: boolean
}

/** Species table id → ordered profile keys (ancestry first, subrace second). */
export const SPECIES_PROFILE_KEYS: Record<string, string[]> = {
  hilldwarf: ['Dwarves'],
  mountaindwarf: ['Dwarves'],
  duergar: ['Dwarves'],
  highelf: ['Elves', 'HighElves'],
  woodelf: ['Elves', 'WoodElves'],
  drow: ['Elves', 'Drow'],
  human: ['Humans'],
  goliath: ['Goliaths'],
  aasimar: ['Aasimar'],
  tiefling: ['Tieflings'],
  halfling: ['Halflings'],
  gnome: ['Gnomes'],
  goblin: ['Goblins'],
  orc: ['Orcs'],
}

export function getRacialSexualProfileGeneralNotes(): string {
  return ROOT.generalNotes
}

export function getSexualTypeGlossary(): Record<string, string[]> {
  return ROOT.sexualTypes
}

export function getRacialProfileRace(key: string): RacialSexualProfileRace | undefined {
  return ROOT.races[key as keyof typeof ROOT.races]
}

export function getRacialSexualProfileSections(speciesId: string): RacialProfileSection[] {
  const id = resolveSpeciesTableId(speciesId.trim())
  const keys = SPECIES_PROFILE_KEYS[id]
  if (!keys?.length) return []

  const out: RacialProfileSection[] = []
  for (const raceKey of keys) {
    const profile = getRacialProfileRace(raceKey)
    if (!profile) continue
    out.push({
      raceKey,
      profile,
      isSubrace: Boolean(profile.parentRace),
    })
  }
  return out
}

export function getPrimarySexualType(speciesId: string): string | undefined {
  const sections = getRacialSexualProfileSections(speciesId)
  if (sections.length === 0) return undefined
  return sections[0].profile.sexualType ?? sections.find((s) => s.profile.sexualType)?.profile.sexualType
}

/** Sheet / engine bonuses derived from glossary mechanics (display + future hooks). */
export interface RacialProfileSheetMechanics {
  beautyClassBonus: number
  beautyClassNote?: string
  fertilityNotes: string[]
  pleasureNotes: string[]
  saveNotes: string[]
}

export function getRacialProfileSheetMechanics(speciesId: string): RacialProfileSheetMechanics {
  const id = resolveSpeciesTableId(speciesId.trim())
  const mechanics: RacialProfileSheetMechanics = {
    beautyClassBonus: 0,
    fertilityNotes: [],
    pleasureNotes: [],
    saveNotes: [],
  }

  if (id === 'highelf') {
    mechanics.beautyClassBonus = 1
    mechanics.beautyClassNote = '+2 Beauty Class when interacting with other High Elves.'
  }

  const sections = getRacialSexualProfileSections(speciesId)
  for (const { raceKey, profile } of sections) {
    const sf = profile.specialFeatures
    if (!sf) continue
    for (const [name, value] of Object.entries(sf)) {
      const text = formatSpecialFeatureValue(value)
      if (name === 'DiminishedFertility' || name.includes('Fertility') || name.includes('Breeding')) {
        mechanics.fertilityNotes.push(`${formatFeatureName(name)}: ${text}`)
      } else if (name === 'OrcishRut' || name === 'Stonefever' || name === 'GiantGrowth' || name === 'SmallSizeGreatAmbition' || name === 'CarnalTrickster' || name === 'AccommodatingNature') {
        mechanics.pleasureNotes.push(`${formatFeatureName(name)}: ${text}`)
      } else if (name === 'ImmutableSexuality') {
        mechanics.saveNotes.push(`${formatFeatureName(name)}: ${text}`)
      } else if (raceKey === 'HighElves' && name === 'AestheticAndErotic') {
        mechanics.beautyClassBonus = Math.max(mechanics.beautyClassBonus, 1)
        mechanics.beautyClassNote = text
      } else {
        mechanics.pleasureNotes.push(`${formatFeatureName(name)}: ${text}`)
      }
    }
  }

  return mechanics
}

export function formatFeatureName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

export function formatSpecialFeatureValue(value: string | Record<string, string>): string {
  if (typeof value === 'string') return value
  const parts: string[] = []
  if (value.description) parts.push(value.description)
  if (value.trigger) parts.push(`Trigger: ${value.trigger}`)
  if (value.frequency) parts.push(`Frequency: ${value.frequency}`)
  if (value.effects) parts.push(`Effects: ${value.effects}`)
  return parts.join(' ')
}
