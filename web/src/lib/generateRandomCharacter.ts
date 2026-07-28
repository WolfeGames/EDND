import { ADVENTURING_CLASSES } from '../data/adventuringClasses'
import { isGenderOption, type GenderOption } from '../data/identityOptions'
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
import {
  pickRandomGender,
  rollPronounsForGender,
} from './anatomyGender'
import { rollEndowmentSize, normalizedEndowment } from './endowment'
import {
  defaultGenitalTraitForGender,
  endowmentShapeFromGenitalTrait,
} from './genitalTrait'
import { rollPhysiqueForSpecies, rollRandomBodyType } from './physique'
import {
  getCarnalClassTraitSlotCount,
  getSexualHistoryTraitSlotCount,
  pickRandomTraitIds,
} from './carnalTraitSelection'
import { mergeTableProficiencies } from './mergeEroticProficiencies'
import { resolveSpeciesTableId } from './speciesAliases'
import { pickRandomPortraitSrc } from './speciesPortrait'
import { rollFantasyNameForSpecies } from './fantasyNameGenerator'
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

function rollIdentity(filters?: RandomCharacterFilters): {
  genderIdentity: string
  pronouns: string
} {
  const genderFilter = filters?.genderIdentity?.trim()
  const gender =
    genderFilter && isGenderOption(genderFilter) ? genderFilter : pickRandomGender()
  const pronouns = filters?.pronouns?.trim() ?? rollPronounsForGender(gender)
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
  const genitalTrait = defaultGenitalTraitForGender(genderIdentity)
  const endowmentShape = endowmentShapeFromGenitalTrait(genitalTrait)
  const endowment = normalizedEndowment({
    anatomy: endowmentShape.anatomy,
    vaginaPresent: endowmentShape.vaginaPresent,
    breastsSize: endowmentShape.hasBreasts ? rollEndowmentSize() : undefined,
    phallusSize: endowmentShape.hasPhallus ? rollEndowmentSize() : undefined,
    vaginaSize: endowmentShape.hasVagina ? rollEndowmentSize() : undefined,
  })

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

  const speciesId = resolveSpeciesTableId(sp.id)
  const { bodyType } = rollRandomBodyType()
  const physique = rollPhysiqueForSpecies(speciesId, bodyType)
  const carnalClassId = carnalCl?.id
  const sexualHistoryId = hist.id
  const portraitSrc =
    pickRandomPortraitSrc(speciesId, genderIdentity, carnalClassId) ?? undefined

  return normalizeCharacterBiology({
    ...createEmptyCharacter(),
    name: rollFantasyNameForSpecies(speciesId),
    pronouns,
    genderIdentity,
    genitalTrait,
    bodyType: physique.bodyType,
    heightInches: physique.heightInches,
    weightLbs: physique.weightLbs,
    heightModifierRoll: physique.heightModifier,
    weightModifierRoll: physique.weightModifier,
    level,
    abilityScores,
    endowment,
    adventuringClass: adv,
    background: bg,
    species: speciesId,
    portraitSrc,
    sexualHistory: sexualHistoryId,
    sexualHistoryPersonality: rollSexualHistoryPersonality(sexualHistoryId),
    sexualHistoryTraitIds: pickRandomTraitIds(
      'history',
      getSexualHistoryTraitSlotCount(sexualHistoryId),
      speciesId,
      carnalClassId ?? '',
      sexualHistoryId,
    ),
    carnalClass: carnalClassId,
    carnalClassTraitIds: carnalClassId
      ? pickRandomTraitIds(
          'class',
          getCarnalClassTraitSlotCount(carnalClassId),
          speciesId,
          carnalClassId,
          sexualHistoryId,
        )
      : [],
    carnalFeatures: [sp.carnalTrait],
    eroticTraits: merged,
  })
}
