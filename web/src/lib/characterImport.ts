import { createEmptyCharacter, createEmptyEroticTraits, type EdndCharacter } from '../types/character'
import { isGenitalTraitId } from '../data/genitalTraits'
import type { GenitalTraitId } from '../types/genitalTrait'
import { normalizeCharacterBiology } from './biologicalSex'
import { isKnownPortraitSrc } from './speciesPortrait'

const ANATOMIES = new Set(['neither', 'breasts', 'phallus', 'both'])
const SIZES = new Set(['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'])

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function num(x: unknown, fallback: number, min: number, max: number): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) return fallback
  return Math.max(min, Math.min(max, Math.floor(x)))
}

function str(x: unknown, fallback = ''): string {
  return typeof x === 'string' ? x : fallback
}

function strArr(x: unknown): string[] {
  if (!Array.isArray(x)) return []
  return x.filter((i): i is string => typeof i === 'string')
}

/**
 * Parse exported character JSON. Merges with defaults for forward compatibility.
 * @throws Error with a short message if the payload is unusable.
 */
export function parseCharacterJson(json: unknown): EdndCharacter {
  if (!isRecord(json)) throw new Error('Character file must be a JSON object.')

  const base = createEmptyCharacter()
  const id = str(json.id, '').trim()
  if (!id) throw new Error('Character JSON is missing a non-empty "id".')

  const abilityRaw = json.abilityScores
  if (!isRecord(abilityRaw)) throw new Error('Character JSON is missing "abilityScores".')

  const abilityScores = {
    strength: num(abilityRaw.strength, base.abilityScores.strength, 1, 30),
    dexterity: num(abilityRaw.dexterity, base.abilityScores.dexterity, 1, 30),
    constitution: num(abilityRaw.constitution, base.abilityScores.constitution, 1, 30),
    intelligence: num(abilityRaw.intelligence, base.abilityScores.intelligence, 1, 30),
    wisdom: num(abilityRaw.wisdom, base.abilityScores.wisdom, 1, 30),
    charisma: num(abilityRaw.charisma, base.abilityScores.charisma, 1, 30),
  }

  const endRaw = json.endowment
  if (!isRecord(endRaw)) throw new Error('Character JSON is missing "endowment".')
  const anatomy = str(endRaw.anatomy, 'neither')
  if (!ANATOMIES.has(anatomy)) throw new Error(`Invalid endowment.anatomy: ${anatomy}`)

  const breastsSize = endRaw.breastsSize
  const phallusSize = endRaw.phallusSize
  const endowment: EdndCharacter['endowment'] = { anatomy: anatomy as EdndCharacter['endowment']['anatomy'] }
  if (breastsSize !== undefined) {
    if (typeof breastsSize !== 'string' || !SIZES.has(breastsSize)) {
      throw new Error(`Invalid endowment.breastsSize: ${String(breastsSize)}`)
    }
    endowment.breastsSize = breastsSize as EdndCharacter['endowment']['breastsSize']
  }
  if (phallusSize !== undefined) {
    if (typeof phallusSize !== 'string' || !SIZES.has(phallusSize)) {
      throw new Error(`Invalid endowment.phallusSize: ${String(phallusSize)}`)
    }
    endowment.phallusSize = phallusSize as EdndCharacter['endowment']['phallusSize']
  }
  const lengthDieRaw = endRaw.phallusLengthDie
  if (lengthDieRaw !== undefined) {
    if (typeof lengthDieRaw !== 'number' || !Number.isFinite(lengthDieRaw)) {
      throw new Error(`Invalid endowment.phallusLengthDie: ${String(lengthDieRaw)}`)
    }
    const die = Math.round(lengthDieRaw)
    if (die < 1 || die > 20) {
      throw new Error(`Invalid endowment.phallusLengthDie (must be 1–20): ${String(lengthDieRaw)}`)
    }
    endowment.phallusLengthDie = die
  }

  const vp = endRaw.vaginaPresent
  if (vp !== undefined && typeof vp !== 'boolean') {
    throw new Error('Invalid endowment.vaginaPresent (must be boolean if set).')
  }
  if (vp !== undefined) endowment.vaginaPresent = vp
  const vaginaSize = endRaw.vaginaSize
  if (vaginaSize !== undefined) {
    if (typeof vaginaSize !== 'string' || !SIZES.has(vaginaSize)) {
      throw new Error(`Invalid endowment.vaginaSize: ${String(vaginaSize)}`)
    }
    endowment.vaginaSize = vaginaSize as EdndCharacter['endowment']['vaginaSize']
  }

  const etRaw = json.eroticTraits
  if (!isRecord(etRaw)) throw new Error('Character JSON is missing "eroticTraits".')
  const emptyEt = createEmptyEroticTraits()
  const eroticTraits = {
    ...emptyEt,
    carnalSkillProficiencies: strArr(etRaw.carnalSkillProficiencies),
    positionProficiencies: strArr(etRaw.positionProficiencies),
    eroticToolProficiencies: strArr(etRaw.eroticToolProficiencies),
    beautyClass: num(etRaw.beautyClass, emptyEt.beautyClass, 1, 99),
    beautyModifier: num(etRaw.beautyModifier, emptyEt.beautyModifier, -99, 99),
    sexualityBonus: num(etRaw.sexualityBonus, emptyEt.sexualityBonus, 0, 99),
    attraction: str(etRaw.attraction, ''),
    repulsion: str(etRaw.repulsion, ''),
    sexualMorality: str(etRaw.sexualMorality, ''),
    orientation: str(etRaw.orientation, ''),
  }

  const shpRaw = json.sexualHistoryPersonality
  let sexualHistoryPersonality: EdndCharacter['sexualHistoryPersonality']
  if (shpRaw === undefined) sexualHistoryPersonality = undefined
  else if (!isRecord(shpRaw)) sexualHistoryPersonality = undefined
  else {
    sexualHistoryPersonality = {
      trait: str(shpRaw.trait, ''),
      ideal: str(shpRaw.ideal, ''),
      bond: str(shpRaw.bond, ''),
      flaw: str(shpRaw.flaw, ''),
    }
  }

  const genitalRaw = str(json.genitalTrait, '').trim()
  const genitalTrait: GenitalTraitId | undefined = isGenitalTraitId(genitalRaw)
    ? genitalRaw
    : undefined
  const hasGenitalShift =
    json.hasGenitalShift === undefined ? undefined : json.hasGenitalShift === true
  const fertilityBonus =
    json.fertilityBonus === undefined
      ? undefined
      : num(json.fertilityBonus, 0, -99, 99)

  const portraitRaw = str(json.portraitSrc, '').trim()
  const portraitSrc = portraitRaw && isKnownPortraitSrc(portraitRaw) ? portraitRaw : undefined

  const bodyType = str(json.bodyType, '').trim() || undefined
  const creatureSizeRaw = str(json.creatureSize, '').trim()
  const creatureSize =
    creatureSizeRaw === 'Medium' || creatureSizeRaw === 'Small'
      ? creatureSizeRaw
      : undefined
  const heightInches =
    json.heightInches === undefined
      ? undefined
      : num(json.heightInches, 0, 1, 200)
  const weightLbs =
    json.weightLbs === undefined ? undefined : num(json.weightLbs, 0, 1, 2000)
  const heightModifierRoll =
    json.heightModifierRoll === undefined
      ? undefined
      : num(json.heightModifierRoll, 0, 0, 100)
  const weightModifierRoll =
    json.weightModifierRoll === undefined
      ? undefined
      : num(json.weightModifierRoll, 0, 0, 100)

  let physiqueMorph: EdndCharacter['physiqueMorph']
  if (isRecord(json.physiqueMorph)) {
    const pm = json.physiqueMorph
    const unit = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : undefined
    physiqueMorph = {
      muscle: unit(pm.muscle),
      fat: unit(pm.fat),
      hipWidth: unit(pm.hipWidth),
      legGirth: unit(pm.legGirth),
      breastScale: unit(pm.breastScale),
    }
  }

  const draft: EdndCharacter = {
    ...base,
    id,
    name: str(json.name, ''),
    pronouns: str(json.pronouns, ''),
    genderIdentity: str(json.genderIdentity, ''),
    portraitSrc,
    bodyType,
    creatureSize,
    heightInches,
    weightLbs,
    heightModifierRoll,
    weightModifierRoll,
    physiqueMorph,
    genitalTrait,
    hasGenitalShift,
    fertilityBonus,
    species: str(json.species, ''),
    adventuringClass: str(json.adventuringClass, ''),
    level: num(json.level, base.level, 1, 20),
    abilityScores,
    endowment,
    background: str(json.background, ''),
    carnalClass: json.carnalClass === undefined ? undefined : str(json.carnalClass, '') || undefined,
    carnalClassTraitIds: strArr(json.carnalClassTraitIds),
    sexualHistory:
      json.sexualHistory === undefined ? undefined : str(json.sexualHistory, '') || undefined,
    sexualHistoryTraitIds: strArr(json.sexualHistoryTraitIds),
    sexualHistoryPersonality,
    carnalFeatures: strArr(json.carnalFeatures),
    eroticTraits,
  }
  return normalizeCharacterBiology(draft)
}
