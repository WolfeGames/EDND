import type { EdndCharacter, EndowmentSize } from '../types/character'

export type PleasureCondition =
  | 'Aroused'
  | 'Edged'
  | 'Refractory'
  | 'Overstimulation'
  | 'Transcendent'

export type RulesSnippet = {
  source: string
  text: string
  level?: number
  tags: string[]
}

export type ModifierEntry = {
  id: string
  label: string
  value: number
  kind: 'beauty' | 'pleasureDealt' | 'pleasureTaken' | 'pleasureReduction' | 'resistance' | 'other'
}

export type BeautyClassResult = {
  base: number
  abilityMod: number
  manualModifier: number
  fromRace: number
  fromHistory: number
  fromCarnalTraits: number
  fromSpecies: number
  total: number
  entries: ModifierEntry[]
}

export type MaxPleasureResult = {
  max: number
  formula: string
  sexDie: number
  constitutionMod: number
  sexualityBonus: number
  level: number
  usedClassOverride: boolean
}

export type OrgasmSaveTrack = {
  active: boolean
  successes: number
  failures: number
  dc: number
}

export type PleasureState = {
  max: number
  /** Remaining pleasure capacity (decreases when pleasure is received). */
  current: number
  tempMaxBonus: number
  conditions: PleasureCondition[]
  orgasmSave: OrgasmSaveTrack | null
  /** PP at or below this value triggers Edged / orgasm saves (default: half max). */
  edgedThreshold: number
}

export type StimulationOptions = {
  actor: EdndCharacter
  recipient: EdndCharacter
  /** Rolled stimulation die total (before per-source multiplication in some features). */
  dieResult: number
  /** Number of distinct pleasure sources this action applies. */
  sourceCount: number
  stimulationType?: string
  positionId?: string
  /** Override base pleasure before modifiers (defaults to dieResult). */
  basePleasure?: number
  /** Recipient already Aroused by this actor (skips non-aroused resistance). */
  recipientIsAroused?: boolean
  actorSize?: EndowmentSize
  recipientSize?: EndowmentSize
  /** Scene: recipient is being watched (Exhibitionist-style bonuses). */
  watched?: boolean
}

export type StimulationResult = {
  pleasureTaken: number
  pleasureBeforeResistance: number
  recipientState: PleasureState
  ledger: ModifierEntry[]
  notes: string[]
  forcedOrgasmSave: boolean
  climaxed: boolean
}

export type QuickEncounterInput = {
  actor: EdndCharacter
  recipient: EdndCharacter
  state: PleasureState
  dieResult: number
  sourceCount: number
  stimulationType?: string
  positionId?: string
  recipientIsAroused?: boolean
  watched?: boolean
}

export type QuickEncounterResult = StimulationResult & {
  ledger: ModifierEntry[]
  beautyClass: BeautyClassResult
  maxPleasure: MaxPleasureResult
}

export type OrgasmSaveRollInput = {
  state: PleasureState
  d20: number
  constitutionMod: number
  sexualityBonus: number
}

export type OrgasmSaveRollResult = {
  state: PleasureState
  success: boolean
  natural20: boolean
  note: string
  outcome?: 'continue' | 'edged' | 'climax'
}
