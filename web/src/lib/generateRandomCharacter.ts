import { ADVENTURING_CLASSES } from '../data/adventuringClasses'
import { GENDERS, isGenderOption } from '../data/identityOptions'
import {
  carnalClasses,
  carnalEquipment,
  getCarnalClass,
  getSexualHistory,
  getSpecies,
  isPlayableSpeciesId,
  pickRandom,
  playableSpecies,
  sexualHistories,
} from '../data/registry'
import { createEmptyCharacter, createEmptyEroticTraits, type EdndCharacter } from '../types/character'
import { deriveBeautyClass, rollAllAbilityScores } from './abilityScores'
import { normalizeCharacterBiology } from './biologicalSex'
import { rollRandomEndowmentForBiologicalSex } from './endowment'
import { mergeTableProficiencies } from './mergeEroticProficiencies'
import { rollSexualHistoryPersonality } from './rollSexualHistoryPersonality'

const GENERIC_BACKGROUNDS = [
  'Acolyte',
  'Charlatan',
  'Criminal',
  'Entertainer',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
  'Urchin',
] as const

const FIRST_NAMES = [
  'Mira',
  'Dorian',
  'Selene',
  'Thorne',
  'Lyra',
  'Cassian',
  'Iris',
  'Rowan',
  'Sable',
  'Ember',
  'Orin',
  'Vesper',
  'Nadia',
  'Kael',
  'Zara',
] as const

const LAST_NAMES = [
  'Vale',
  'Ash',
  'Blackwood',
  'Storm',
  'Riven',
  'Marrow',
  'Quill',
  'Hollow',
  'Cross',
  'Drift',
  'Vance',
  'Locke',
  'Fair',
  'Grim',
  'Sable',
] as const

const ATTRACTIONS = [
  'Drawn to confident partners',
  'Curious about many presentations and identities',
  'Prefers slow courtship and clear consent',
  'Enjoys playful rivals who push back',
  'Attracted to artists and performers',
  'Often notices hands, voice, and scent first',
] as const

const REPULSIONS = [
  'Dislikes coercion or pressure',
  'Avoids partners who mock boundaries',
  'Uninterested in anonymous cruelty',
  'Needs emotional honesty before intimacy',
  'Repelled by performative dishonesty',
] as const

const MORALITIES = [
  'Consent-forward; checks in often',
  'Pragmatic hedonist with hard limits',
  'Romantic idealist, easily wounded',
  'Disciplined pleasure-seeker',
  'Faith-tinged guilt and devotion intertwined',
] as const

const ORIENTATIONS = [
  'Pan with seasonal leanings',
  'Demi — heat follows trust',
  'Bi, louder about taste than labels',
  'Ace spectrum; intimacy is negotiated',
  'Questioning and unbothered by boxes',
] as const

export type RandomCharacterFilters = {
  species?: string
  sexualHistory?: string
  adventuringClass?: string
  background?: string
  /** Empty = use carnalClassChance; `'none'` = no carnal class; else a valid carnal class id */
  carnalClass?: string | 'none'
  genderIdentity?: string
  pronouns?: string
  levelMin?: number
  levelMax?: number
}

export type RandomCharacterOptions = {
  carnalClassChance?: number
  filters?: RandomCharacterFilters
}

function randomName(): string {
  return `${pickRandom(FIRST_NAMES)!} ${pickRandom(LAST_NAMES)!}`
}

function randomToolProficiencies(): string[] {
  const pool = carnalEquipment.map((e) => e.name)
  const count = Math.floor(Math.random() * 3)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const item = pickRandom(pool)
    if (item && !out.includes(item)) out.push(item)
  }
  return out
}

function rollLevel(filters?: RandomCharacterFilters): number {
  const lo = Math.max(1, Math.min(20, filters?.levelMin ?? 1))
  const hi = Math.max(1, Math.min(20, filters?.levelMax ?? 20))
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  return a + Math.floor(Math.random() * (b - a + 1))
}

/** Pronouns only come from user input (filters); never auto-generated. */
function rollIdentity(filters?: RandomCharacterFilters): {
  genderIdentity: string
  pronouns: string
} {
  const genderFilter = filters?.genderIdentity?.trim()
  const gender =
    genderFilter && isGenderOption(genderFilter)
      ? genderFilter
      : pickRandom([...GENDERS])!
  const pronouns = filters?.pronouns?.trim() ?? ''
  return { genderIdentity: gender, pronouns }
}

export function generateRandomCharacter(
  options: RandomCharacterOptions = {},
): EdndCharacter {
  const f = options.filters
  const carnalChance = options.carnalClassChance ?? 0.55
  const level = rollLevel(f)

  const sp =
    f?.species?.trim() &&
    getSpecies(f.species) &&
    isPlayableSpeciesId(f.species)
      ? getSpecies(f.species)!
      : pickRandom(playableSpecies)!
  const hist =
    f?.sexualHistory && getSexualHistory(f.sexualHistory)
      ? getSexualHistory(f.sexualHistory)!
      : pickRandom(sexualHistories)!
  const adv = f?.adventuringClass?.trim()
    ? f.adventuringClass.trim()
    : pickRandom([...ADVENTURING_CLASSES])!
  const bg = f?.background?.trim()
    ? f.background.trim()
    : pickRandom([...GENERIC_BACKGROUNDS])!

  let carnalCl: { id: string } | undefined
  if (f?.carnalClass === 'none') {
    carnalCl = undefined
  } else if (f?.carnalClass && getCarnalClass(f.carnalClass)) {
    carnalCl = getCarnalClass(f.carnalClass)
  } else if (carnalClasses.length > 0 && Math.random() < carnalChance) {
    carnalCl = pickRandom(carnalClasses)
  }

  const { genderIdentity, pronouns } = rollIdentity(f)
  const abilityScores = rollAllAbilityScores()

  const baseTraits = createEmptyEroticTraits()
  const merged = mergeTableProficiencies(sp.id, hist.id, carnalCl?.id, {
    ...baseTraits,
    beautyModifier: 0,
    beautyClass: deriveBeautyClass(abilityScores, 0),
    sexualityBonus:
      level < 5 ? 2 : level < 10 ? 3 : level < 14 ? 4 : level < 18 ? 5 : 6,
    attraction: pickRandom(ATTRACTIONS)!,
    repulsion: pickRandom(REPULSIONS)!,
    sexualMorality: pickRandom(MORALITIES)!,
    orientation: pickRandom(ORIENTATIONS)!,
    eroticToolProficiencies: randomToolProficiencies(),
  })

  return normalizeCharacterBiology({
    ...createEmptyCharacter(),
    name: randomName(),
    pronouns,
    genderIdentity,
    level,
    abilityScores,
    endowment: rollRandomEndowmentForBiologicalSex(genderIdentity),
    adventuringClass: adv,
    background: bg,
    species: sp.id,
    sexualHistory: hist.id,
    sexualHistoryPersonality: rollSexualHistoryPersonality(hist.id),
    carnalClass: carnalCl?.id,
    carnalFeatures: [sp.carnalTrait],
    eroticTraits: merged,
  })
}
