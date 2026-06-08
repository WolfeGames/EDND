import { portraitBinaryForGender } from './biologicalSex'
import { getSpecies } from '../data/registry'
import { resolveSpeciesTableId } from './speciesAliases'
import type { EdndCharacter } from '../types/character'

/** Portrait paths under `public/portraits/`; keys are species table ids (see species.json). */
const PAIRED: Record<string, { male: string; female: string }> = {
  aasimar: { male: '/portraits/aasimar-male.jpg', female: '/portraits/aasimar-female.jpg' },
  airgenasi: { male: '/portraits/airgenasi-male.jpg', female: '/portraits/airgenasi-female.jpg' },
  bugbear: { male: '/portraits/bugbear-male.png', female: '/portraits/bugbear-female.png' },
  centaur: { male: '/portraits/centaur-male.jpg', female: '/portraits/centaur-female.png' },
  dragonborn: { male: '/portraits/dragonborn-male.png', female: '/portraits/dragonborn-female.png' },
  drow: { male: '/portraits/drow-male.png', female: '/portraits/drow-female.png' },
  duergar: { male: '/portraits/duergar-male.png', female: '/portraits/duergar-female.png' },
  earthgenasi: { male: '/portraits/earthgenasi-male.jpg', female: '/portraits/earthgenasi-female.jpg' },
  firbolg: { male: '/portraits/firbolg-male.jpg', female: '/portraits/firbolg-female.jpg' },
  firegenasi: { male: '/portraits/firegenasi-male.jpg', female: '/portraits/firegenasi-female.jpg' },
  gnome: { male: '/portraits/gnome-male.jpg', female: '/portraits/gnome-female.jpg' },
  goblin: { male: '/portraits/goblin-male.png', female: '/portraits/goblin-female.png' },
  goliath: { male: '/portraits/goliath-male.jpg', female: '/portraits/goliath-female.jpg' },
  halfling: { male: '/portraits/halfling-male.png', female: '/portraits/halfling-female.png' },
  highelf: { male: '/portraits/highelf-male.png', female: '/portraits/highelf-female.png' },
  hilldwarf: { male: '/portraits/hilldwarf-male.png', female: '/portraits/hilldwarf-female.png' },
  hobgoblin: { male: '/portraits/hobgoblin-male.png', female: '/portraits/hobgoblin-female.png' },
  human: { male: '/portraits/human-male.png', female: '/portraits/human-female.png' },
  minotaur: { male: '/portraits/minotaur-male.jpg', female: '/portraits/minotaur-female.jpg' },
  mountaindwarf: { male: '/portraits/mountaindwarf-male.png', female: '/portraits/mountaindwarf-female.jpg' },
  orc: { male: '/portraits/orc-male.jpg', female: '/portraits/orc-female.jpg' },
  tabaxi: { male: '/portraits/tabaxi-male.jpg', female: '/portraits/tabaxi-female.jpg' },
  tiefling: { male: '/portraits/tiefling-male.jpg', female: '/portraits/tiefling-female.jpg' },
  watergenasi: { male: '/portraits/watergenasi-male.jpg', female: '/portraits/watergenasi-female.jpg' },
  woodelf: { male: '/portraits/woodelf-male.png', female: '/portraits/female-high-elf.jpg' },
}

const UNISEX: Record<string, string> = {
  satyr: '/portraits/satyr.jpg',
}

/** Alternate filenames not tied to a single species pair. */
const EXTRA: Array<{ src: string; label: string; speciesId?: string }> = [
  { src: '/portraits/woodelf-female.png', label: 'Wood elf (female alt)', speciesId: 'woodelf' },
  { src: '/portraits/female-aasimar.jpg', label: 'Aasimar (alt)', speciesId: 'aasimar' },
  { src: '/portraits/male-aasimar.jpg', label: 'Aasimar (alt)', speciesId: 'aasimar' },
]

export type PortraitVariant = 'male' | 'female' | 'unisex'

export type PortraitOption = {
  src: string
  label: string
  speciesId: string
  variant: PortraitVariant
}

const KNOWN_PORTRAIT_SRCS = new Set<string>()

function registerPortrait(src: string) {
  KNOWN_PORTRAIT_SRCS.add(src)
}

function speciesDisplayName(speciesId: string): string {
  return getSpecies(speciesId)?.name ?? speciesId
}

function buildCatalog(): PortraitOption[] {
  const out: PortraitOption[] = []
  for (const [speciesId, pair] of Object.entries(PAIRED)) {
    registerPortrait(pair.male)
    registerPortrait(pair.female)
    const name = speciesDisplayName(speciesId)
    out.push({ src: pair.male, label: `${name} (male)`, speciesId, variant: 'male' })
    out.push({ src: pair.female, label: `${name} (female)`, speciesId, variant: 'female' })
  }
  for (const [speciesId, src] of Object.entries(UNISEX)) {
    registerPortrait(src)
    out.push({
      src,
      label: speciesDisplayName(speciesId),
      speciesId,
      variant: 'unisex',
    })
  }
  for (const extra of EXTRA) {
    registerPortrait(extra.src)
    out.push({
      src: extra.src,
      label: extra.label,
      speciesId: extra.speciesId ?? 'extra',
      variant: 'unisex',
    })
  }
  return out.sort((a, b) => a.label.localeCompare(b.label))
}

let catalogCache: PortraitOption[] | null = null

export function listPortraitCatalog(): PortraitOption[] {
  if (!catalogCache) catalogCache = buildCatalog()
  return catalogCache
}

export function isKnownPortraitSrc(src: string): boolean {
  listPortraitCatalog()
  return KNOWN_PORTRAIT_SRCS.has(src)
}

/**
 * Default premade portrait for a species + anatomy-derived gender.
 * Maps to male/female art pairs (Male/Cuntboy → male; Female/Shemale/Hermaphrodite → female).
 */
export function getDefaultSpeciesPortraitSrc(
  speciesId: string,
  genderIdentity: string,
): string | null {
  const id = resolveSpeciesTableId(speciesId.trim())
  if (!id) return null
  const uni = UNISEX[id]
  if (uni) return uni
  const pair = PAIRED[id]
  if (!pair) return null
  const portraitSex = portraitBinaryForGender(genderIdentity)
  if (!portraitSex) return null
  return portraitSex === 'Male' ? pair.male : pair.female
}

/** Player override when set; otherwise species + gender default. */
export function getCharacterPortraitSrc(
  character: Pick<EdndCharacter, 'species' | 'genderIdentity' | 'portraitSrc'>,
): string | null {
  const custom = character.portraitSrc?.trim()
  if (custom && isKnownPortraitSrc(custom)) return custom
  if (!character.species?.trim()) return null
  return getDefaultSpeciesPortraitSrc(character.species, character.genderIdentity)
}

export function listPortraitOptionsForSpecies(speciesId: string): PortraitOption[] {
  const id = resolveSpeciesTableId(speciesId.trim())
  if (!id) return []
  return listPortraitCatalog().filter((opt) => opt.speciesId === id)
}

export function speciesHasPortrait(speciesId: string): boolean {
  const id = resolveSpeciesTableId(speciesId.trim())
  return Boolean(UNISEX[id] || PAIRED[id])
}
