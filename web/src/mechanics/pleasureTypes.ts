import type { AbilityScores, EdndCharacter } from '../types/character'
import type { GenitalTraitId, GenitalTrack } from '../types/genitalTrait'
import { getFertilityBonus, inferGenitalTraitFromCharacter } from '../lib/genitalTrait'
import type { ClassFeature, ClassFeatureContext, CombatantEncounterState, StimulationAbility } from './classFeatures'

/** Who applies stimulation in an encounter step. */
export interface PleasureCombatant {
  id: string
  name: string
  level: number
  abilityScores: AbilityScores
  /** Proficiency-style bonus (levels 1–4: +2, etc.). */
  sexualityBonus: number
  carnalClassId?: string
  adventuringClassId?: string
  genitalTrait: GenitalTraitId
  fertilityBonus: number
  hasGenitalShift: boolean
  /** Add Sexuality bonus to Wisdom saves when true (per finalized arousal rules). */
  wisdomSaveProficient: boolean
  /** Flat bonuses for future traits / features. */
  modifiers: PleasureModifiers
  /** Encounter toggles: Lust, gear, spells, pacts. */
  encounter?: CombatantEncounterState
}

/** Hooks for racial traits, class features, gear, etc. */
export interface PleasureModifiers {
  maxPleasureBonus?: number
  pleasureDealtBonus?: number
  pleasureReceivedBonus?: number
  arousalSaveBonus?: number
  orgasmSaveBonus?: number
  pleasureResistanceIgnored?: boolean
  orgasmSaveAdvantage?: boolean
  orgasmSaveDisadvantage?: boolean
}

export type OrgasmSaveAbility = 'constitution' | 'sexuality'

export type SaveOutcome = 'success' | 'failure'

/** Per-genital-track refractory and overstimulation (hermaphrodites use both). */
export interface GenitalTrackState {
  orgasmsThisEncounter: number
  isRefractory: boolean
  overstimulatedLevel: number
}

export interface GenitalShiftStash {
  previousTrait: GenitalTraitId
  phallic: GenitalTrackState
  vaginal: GenitalTrackState
}

export interface PleasureState {
  maxPleasurePoints: number
  currentPleasurePoints: number
  isAroused: boolean
  isEdged: boolean
  /** Base trait from character sheet; may differ from activeTrait while shifted. */
  genitalTrait: GenitalTraitId
  /** Current configuration (Genital Shift). */
  activeGenitalTrait: GenitalTraitId
  hasGenitalShift: boolean
  phallic: GenitalTrackState
  vaginal: GenitalTrackState
  /** Saved when shifting away; restored on revert. */
  genitalShiftStash?: GenitalShiftStash
  orgasmSavesThisEncounter: number
  /** Total climaxes this encounter (all tracks). */
  orgasmsThisEncounter: number
  /** 0 = none; escalates when climax is denied at 0 PP. */
  deniedLevel: number
  /** Last orgasmic boon applied (1–6), if any. */
  lastBoonRoll?: number
  activeBoon?: OrgasmicBoon
}

export type OrgasmicBoonId = 1 | 2 | 3 | 4 | 5 | 6

export interface OrgasmicBoon {
  roll: OrgasmicBoonId
  name: string
  description: string
}

export interface StimulationOptions {
  /** Raw pleasure before resistance / arousal (dice total + bonuses). */
  pleasureRoll: number
  position?: string
  stimulationType?: string
  /** Which genital track is stimulated (hermaphrodite / dual stimulation). */
  genitalTrack?: GenitalTrack
  /** Constitution modifier or Sexuality bonus on triggered orgasm saves. */
  orgasmSaveAbility?: OrgasmSaveAbility
  /** If true, skip resistance (e.g. willing direct arousal). */
  bypassResistance?: boolean
  /** If true, do not roll arousal when not already Aroused. */
  skipArousalCheck?: boolean
  /** Prevent climax resolution when PP hits 0 (Denied). */
  denyClimax?: boolean
  /** Ability used for this stimulation (Siren Bliss die, etc.). */
  stimulationAbility?: StimulationAbility
  audiencePresent?: boolean
  isPerformance?: boolean
  classFeatureContext?: Partial<ClassFeatureContext>
}

export interface ArousalCheckRequest {
  target: PleasureCombatant
  targetState: PleasureState
  pleasureReceived: number
  roll?: number
}

export interface ArousalCheckResult {
  dc: number
  roll: number
  modifier: number
  total: number
  outcome: SaveOutcome
  becameAroused: boolean
  state: PleasureState
  log: string[]
}

export interface OrgasmSaveRequest {
  character: PleasureCombatant
  state: PleasureState
  ability: OrgasmSaveAbility
  roll?: number
}

export interface OrgasmSaveResult {
  dc: number
  roll: number
  modifier: number
  total: number
  outcome: SaveOutcome
  climaxed: boolean
  state: PleasureState
  boon?: OrgasmicBoon
  log: string[]
}

export interface StimulationResult {
  attacker: PleasureCombatant
  target: PleasureCombatant
  /** Base roll before class feature bonuses. */
  basePleasureRoll?: number
  pleasureDealt: number
  pleasureAfterResistance: number
  classFeatureEffects?: ClassFeature[]
  arousalCheck?: ArousalCheckResult
  orgasmSave?: OrgasmSaveResult
  climax?: ClimaxResult
  forcedOrgasmSave?: OrgasmSaveResult
  refractoryOverstim?: OverstimulatedCheckResult
  state: PleasureState
  log: string[]
}

export interface ClimaxResult {
  boon: OrgasmicBoon
  state: PleasureState
  overstimulatedChecks?: OverstimulatedCheckResult[]
  log: string[]
}

export interface OverstimulatedCheckRequest {
  character: PleasureCombatant
  state: PleasureState
  track: GenitalTrack
  roll?: number
}

export interface OverstimulatedCheckResult {
  dc: number
  roll: number
  modifier: number
  total: number
  outcome: SaveOutcome
  track: GenitalTrack
  state: PleasureState
  log: string[]
}

export interface PhallicRefractorySaveRequest {
  character: PleasureCombatant
  state: PleasureState
  roll?: number
}

export interface PhallicRefractorySaveResult {
  dc: number
  roll: number
  modifier: number
  total: number
  outcome: SaveOutcome
  state: PleasureState
  log: string[]
}

export interface MaxPleasureBreakdown {
  classBase: number
  modifier: number
  modifierLabel: string
  traitBonus: number
  overstimulatedPenalty: number
  total: number
}

export function emptyGenitalTrack(): GenitalTrackState {
  return { orgasmsThisEncounter: 0, isRefractory: false, overstimulatedLevel: 0 }
}

/** Combined overstim levels — penalties apply to the whole creature. */
export function combinedOverstimulatedLevel(state: PleasureState): number {
  return Math.max(state.phallic.overstimulatedLevel, state.vaginal.overstimulatedLevel)
}

export function isPhallicRefractory(state: PleasureState): boolean {
  return state.phallic.isRefractory
}

/** @deprecated Use isPhallicRefractory — only phallic-side traits enter Refractory. */
export function isRefractory(state: PleasureState): boolean {
  return isPhallicRefractory(state)
}

/** @deprecated Use combinedOverstimulatedLevel */
export function overstimulatedLevel(state: PleasureState): number {
  return combinedOverstimulatedLevel(state)
}

export function characterToCombatant(
  character: EdndCharacter,
  overrides?: Partial<PleasureCombatant>,
): PleasureCombatant {
  const genitalTrait = inferGenitalTraitFromCharacter(character)
  const speciesId = character.species?.trim() || undefined
  const encounterFromCharacter: CombatantEncounterState | undefined = character.carnalClass
    ? {
        speciesId,
        xenophilic: character.carnalClass === 'lustbound',
        primalVitality: character.carnalClass === 'ravager',
      }
    : undefined
  const { encounter: encounterOverride, ...restOverrides } = overrides ?? {}
  const encounter = { ...encounterFromCharacter, ...encounterOverride }
  return {
    id: character.id,
    name: character.name || 'Unnamed',
    level: character.level,
    abilityScores: character.abilityScores,
    sexualityBonus: character.eroticTraits.sexualityBonus,
    carnalClassId: character.carnalClass,
    adventuringClassId: character.adventuringClass,
    genitalTrait,
    fertilityBonus: getFertilityBonus(character),
    hasGenitalShift: character.hasGenitalShift ?? false,
    wisdomSaveProficient: false,
    modifiers: {},
    ...restOverrides,
    encounter,
  }
}
