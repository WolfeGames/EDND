import { isBodyType, type BodyType } from '../data/bodyTypes'
import { familyForSpeciesId } from '../data/speciesFamilies'
import type { EdndCharacter, EndowmentSize } from '../types/character'
import {
  endowmentShapeFromGenitalTrait,
  inferGenitalTraitFromCharacter,
} from './genitalTrait'
import {
  computePhallusLengthInches,
  resolveCharacterCreatureSize,
  type DndCreatureSize,
} from './phallusScale'
import {
  defaultMorphFromBodyType,
  normalizePhysiqueMorph,
  resolveBaseBlend,
  morphToTransforms,
  type BaseBlendStop,
  type MorphTransforms,
  type PhysiqueMorph,
} from './physiqueMorph'
import { resolveSpeciesTableId } from './speciesAliases'

export type DollPalette = {
  id: string
  label: string
  skin: string
  skinShadow: string
  skinHighlight: string
  hair: string
  hairShadow: string
  accent: string
  nipple: string
  phallus: string
  phallusTip: string
}

/** Painterly skin/hair palettes keyed by ancestry family (prototype human-first, with tints). */
export const DOLL_PALETTES: Record<string, DollPalette> = {
  human: {
    id: 'human',
    label: 'Human',
    skin: '#e8b892',
    skinShadow: '#c48a62',
    skinHighlight: '#f3d2b4',
    hair: '#4a3428',
    hairShadow: '#2c1d16',
    accent: '#8b5a3c',
    nipple: '#c47a6a',
    phallus: '#d4a07a',
    phallusTip: '#b87868',
  },
  elf: {
    id: 'elf',
    label: 'Elf',
    skin: '#f0d4bc',
    skinShadow: '#d4a888',
    skinHighlight: '#f8e8d8',
    hair: '#c9a227',
    hairShadow: '#8a7018',
    accent: '#6b8f71',
    nipple: '#c99088',
    phallus: '#e0b898',
    phallusTip: '#c88878',
  },
  dwarf: {
    id: 'dwarf',
    label: 'Dwarf',
    skin: '#d4a074',
    skinShadow: '#a8744e',
    skinHighlight: '#e8c49a',
    hair: '#6b3a22',
    hairShadow: '#3d2112',
    accent: '#8b6914',
    nipple: '#b86858',
    phallus: '#c89068',
    phallusTip: '#a86858',
  },
  tiefling: {
    id: 'tiefling',
    label: 'Tiefling',
    skin: '#c45c58',
    skinShadow: '#8e3838',
    skinHighlight: '#e88880',
    hair: '#1a1218',
    hairShadow: '#0a0608',
    accent: '#e8a020',
    nipple: '#8e3038',
    phallus: '#b04848',
    phallusTip: '#8e3038',
  },
  orc: {
    id: 'orc',
    label: 'Orc',
    skin: '#6a8f5a',
    skinShadow: '#456338',
    skinHighlight: '#8fb87a',
    hair: '#1e1a14',
    hairShadow: '#0c0a08',
    accent: '#8b4518',
    nipple: '#4a6340',
    phallus: '#5a7a4a',
    phallusTip: '#3e5634',
  },
  default: {
    id: 'default',
    label: 'Ancestry',
    skin: '#e0b898',
    skinShadow: '#b88868',
    skinHighlight: '#f0d4bc',
    hair: '#3a2a22',
    hairShadow: '#1e1612',
    accent: '#7a5a40',
    nipple: '#b87868',
    phallus: '#d0a080',
    phallusTip: '#b07060',
  },
}

const ENDOWMENT_SCALE: Record<EndowmentSize, number> = {
  Tiny: 0.45,
  Small: 0.7,
  Medium: 1,
  Large: 1.35,
  Huge: 1.75,
  Gargantuan: 2.2,
}

const BODY_WIDTH: Record<BodyType, number> = {
  Frail: 0.82,
  Slim: 0.88,
  Lithe: 0.9,
  Fit: 1,
  Athletic: 1.06,
  Soft: 1.1,
  Heavyset: 1.22,
  Muscular: 1.14,
  Burly: 1.28,
  Giant: 1.35,
}

const CREATURE_BODY_SCALE: Record<DndCreatureSize, number> = {
  Tiny: 0.55,
  Small: 0.78,
  Medium: 1,
  Large: 1.18,
  Huge: 1.35,
  Gargantuan: 1.55,
}

/** 0–1 ratios describing how muscular / soft the body is. */
export type BodyComposition = {
  muscle: number
  fat: number
  heightBonus: number
}

const BODY_TYPE_COMPOSITION: Record<BodyType, BodyComposition> = {
  Frail:     { muscle: 0.05, fat: 0.05, heightBonus: 0 },
  Slim:      { muscle: 0.15, fat: 0.10, heightBonus: 0 },
  Lithe:     { muscle: 0.35, fat: 0.08, heightBonus: 0 },
  Fit:       { muscle: 0.40, fat: 0.18, heightBonus: 0 },
  Athletic:  { muscle: 0.65, fat: 0.12, heightBonus: 0 },
  Soft:      { muscle: 0.15, fat: 0.45, heightBonus: 0 },
  Heavyset:  { muscle: 0.25, fat: 0.70, heightBonus: 0 },
  Muscular:  { muscle: 0.80, fat: 0.15, heightBonus: 0 },
  Burly:     { muscle: 0.75, fat: 0.35, heightBonus: 0 },
  Giant:     { muscle: 0.60, fat: 0.30, heightBonus: 12 },
}

/** Species visual features for the doll. */
export type SpeciesFeatures = {
  ears: 'round' | 'pointed' | 'long-pointed' | 'droopy'
  tusks: boolean
  horns: boolean
  tail: boolean
  tailStyle: 'thin' | 'thick' | 'none'
}

const SPECIES_FEATURES: Record<string, Partial<SpeciesFeatures>> = {
  elf:      { ears: 'long-pointed' },
  halfelf:  { ears: 'pointed' },
  orc:      { ears: 'pointed', tusks: true },
  halforc:  { ears: 'pointed', tusks: true },
  tiefling: { horns: true, tail: true, tailStyle: 'thin' },
  dragonborn: { tail: true, tailStyle: 'thick' },
  gnome:    { ears: 'pointed' },
  halfling: { ears: 'pointed' },
  goblin:   { ears: 'long-pointed' },
  bugbear:  { ears: 'droopy' },
  hobgoblin: { ears: 'pointed', tusks: true },
  tabaxi:   { ears: 'pointed', tail: true, tailStyle: 'thin' },
  satyr:    { horns: true },
  minotaur: { horns: true, tail: true, tailStyle: 'thin' },
  centaur:  { ears: 'pointed', tail: true, tailStyle: 'thick' },
  firbolg:  { ears: 'pointed' },
  goliath:  {},
}

function resolveSpeciesFeatures(familyId: string): SpeciesFeatures {
  const partial = SPECIES_FEATURES[familyId] ?? {}
  return {
    ears: partial.ears ?? 'round',
    tusks: partial.tusks ?? false,
    horns: partial.horns ?? false,
    tail: partial.tail ?? false,
    tailStyle: partial.tailStyle ?? 'none',
  }
}

export type PaperDollModel = {
  palette: DollPalette
  presentation: 'masculine' | 'feminine' | 'androgynous'
  bodyWidth: number
  bodyScale: number
  composition: BodyComposition
  morph: PhysiqueMorph
  baseBlend: BaseBlendStop[]
  transforms: MorphTransforms
  features: SpeciesFeatures
  hasBreasts: boolean
  hasPhallus: boolean
  hasVagina: boolean
  breastScale: number
  phallusScale: number
  vaginaScale: number
  breastsSize: EndowmentSize | null
  phallusSize: EndowmentSize | null
  vaginaSize: EndowmentSize | null
  phallusLengthInches: number | null
  bodyType: BodyType | null
  creatureSize: DndCreatureSize
  speciesFamilyId: string
}

export function dollPaletteForSpecies(speciesId: string): DollPalette {
  const family = familyForSpeciesId(resolveSpeciesTableId(speciesId.trim()))
  const key = family?.id ?? 'default'
  if (key === 'genasi') return DOLL_PALETTES.default
  return DOLL_PALETTES[key] ?? DOLL_PALETTES.default
}

/** Collapse 10 body types into 4 art bases for the layered pack. */
export type DollBodyArtKey = 'slim' | 'fit' | 'soft' | 'muscular'

export function bodyArtKey(composition: BodyComposition, bodyType: BodyType | null): DollBodyArtKey {
  if (bodyType === 'Soft' || bodyType === 'Heavyset') return 'soft'
  if (bodyType === 'Muscular' || bodyType === 'Burly' || bodyType === 'Athletic') return 'muscular'
  if (bodyType === 'Frail' || bodyType === 'Slim' || bodyType === 'Lithe') return 'slim'
  if (bodyType === 'Giant') return composition.muscle >= 0.55 ? 'muscular' : 'soft'
  if (composition.fat >= 0.4) return 'soft'
  if (composition.muscle >= 0.55) return 'muscular'
  if (composition.muscle <= 0.25 && composition.fat <= 0.2) return 'slim'
  return 'fit'
}

export type DollPresentationArtKey = 'masc' | 'fem' | 'andro'

export function presentationArtKey(
  presentation: PaperDollModel['presentation'],
): DollPresentationArtKey {
  if (presentation === 'feminine') return 'fem'
  if (presentation === 'masculine') return 'masc'
  return 'andro'
}

export type DollHairStyleKey = 'short' | 'long'

export function hairStyleKey(presentation: PaperDollModel['presentation']): DollHairStyleKey {
  return presentation === 'masculine' ? 'short' : 'long'
}

export function endowmentTierKey(size: EndowmentSize | undefined): EndowmentSize {
  return size ?? 'Medium'
}

/** Parse #RRGGBB into 0–255 channels. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = Number.parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * CSS filter that recolors a near-neutral gray layer toward `hex`.
 * Tuned for mid-gray (#9a9a9a) source art.
 */
export function tintFilterFromHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const max = Math.max(r, g, b, 1)
  const sat = Math.min(1.6, ((max - Math.min(r, g, b)) / max) * 2.2 + 0.35)
  const hue = (Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI
  const hueRotate = ((hue % 360) + 360) % 360
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 155
  return `brightness(0) saturate(100%) invert(${Math.min(90, brightness * 55)}%) sepia(1) saturate(${sat * 100}%) hue-rotate(${hueRotate}deg) brightness(${0.75 + brightness * 0.45})`
}

export function endowmentSizeScale(size: EndowmentSize | undefined, fallback = 1): number {
  if (!size) return fallback
  return ENDOWMENT_SCALE[size] ?? fallback
}

/** Extra length fine-tune from optional 1d20 (0.1" steps), normalized around Medium base. */
export function phallusFineScale(
  size: EndowmentSize | undefined,
  creatureSize: DndCreatureSize,
  lengthDie: number | undefined,
): number {
  const baseScale = endowmentSizeScale(size, 1)
  if (!size || lengthDie === undefined) return baseScale
  const inches = computePhallusLengthInches(size, creatureSize, lengthDie)
  const tierMin = computePhallusLengthInches(size, creatureSize, 1)
  const tierAt20 = computePhallusLengthInches(size, creatureSize, 20)
  const span = Math.max(0.1, tierAt20 - tierMin)
  const t = (inches - tierMin) / span
  return baseScale * (0.92 + t * 0.16)
}

export function resolvePresentation(
  character: Pick<EdndCharacter, 'genderIdentity' | 'genitalTrait' | 'endowment'>,
): PaperDollModel['presentation'] {
  const trait = character.genitalTrait ?? inferGenitalTraitFromCharacter(character)
  const shape = endowmentShapeFromGenitalTrait(trait)
  if (shape.hasBreasts && !shape.hasPhallus) return 'feminine'
  if (shape.hasPhallus && !shape.hasBreasts) return 'masculine'
  if (shape.hasBreasts && shape.hasPhallus) return 'androgynous'
  const g = character.genderIdentity.trim().toLowerCase()
  if (g === 'female') return 'feminine'
  if (g === 'male') return 'masculine'
  return 'androgynous'
}

export function buildPaperDollModel(
  character: Pick<
    EdndCharacter,
    | 'species'
    | 'creatureSize'
    | 'bodyType'
    | 'genderIdentity'
    | 'genitalTrait'
    | 'endowment'
    | 'physiqueMorph'
  >,
): PaperDollModel {
  const trait = character.genitalTrait ?? inferGenitalTraitFromCharacter(character)
  const shape = endowmentShapeFromGenitalTrait(trait)
  const creatureSize = resolveCharacterCreatureSize(character)
  const rawBody = character.bodyType ?? ''
  const bodyType: BodyType | null = isBodyType(rawBody) ? rawBody : null
  const family = familyForSpeciesId(resolveSpeciesTableId(character.species.trim()))
  const breastScale = shape.hasBreasts
    ? endowmentSizeScale(character.endowment.breastsSize, 1)
    : 0
  const phallusScale = shape.hasPhallus
    ? phallusFineScale(
        character.endowment.phallusSize,
        creatureSize,
        character.endowment.phallusLengthDie,
      )
    : 0
  const vaginaScale = shape.hasVagina
    ? endowmentSizeScale(character.endowment.vaginaSize, 1)
    : 0

  const composition: BodyComposition = bodyType
    ? BODY_TYPE_COMPOSITION[bodyType]
    : { muscle: 0.35, fat: 0.18, heightBonus: 0 }

  const familyId = family?.id ?? 'default'
  const morph = normalizePhysiqueMorph(
    character.physiqueMorph,
    defaultMorphFromBodyType(bodyType),
  )
  // Keep composition in sync with morph sliders for any legacy consumers.
  const liveComposition: BodyComposition = {
    muscle: morph.muscle,
    fat: morph.fat,
    heightBonus: composition.heightBonus,
  }

  return {
    palette: dollPaletteForSpecies(character.species),
    presentation: resolvePresentation(character),
    bodyWidth: bodyType ? BODY_WIDTH[bodyType] : 1,
    bodyScale: CREATURE_BODY_SCALE[creatureSize],
    composition: liveComposition,
    morph,
    baseBlend: resolveBaseBlend(morph),
    transforms: morphToTransforms(morph),
    features: resolveSpeciesFeatures(familyId),
    hasBreasts: shape.hasBreasts,
    hasPhallus: shape.hasPhallus,
    hasVagina: shape.hasVagina,
    breastScale,
    phallusScale,
    vaginaScale,
    breastsSize: shape.hasBreasts ? (character.endowment.breastsSize ?? 'Medium') : null,
    phallusSize: shape.hasPhallus ? (character.endowment.phallusSize ?? 'Medium') : null,
    vaginaSize: shape.hasVagina ? (character.endowment.vaginaSize ?? 'Medium') : null,
    phallusLengthInches:
      shape.hasPhallus &&
      character.endowment.phallusSize &&
      character.endowment.phallusLengthDie !== undefined
        ? computePhallusLengthInches(
            character.endowment.phallusSize,
            creatureSize,
            character.endowment.phallusLengthDie,
          )
        : null,
    bodyType,
    creatureSize,
    speciesFamilyId: familyId,
  }
}
