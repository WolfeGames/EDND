import { getGenitalTraitDefinition } from '../data/genitalTraits'
import { getCarnalClass } from '../data/registry'
import { activeGenitalTracks } from '../lib/genitalTrait'
import { abilityModifier } from '../lib/abilityScores'
import { sexualityBonusForLevel } from '../lib/applyCharacterRules'
import type { EdndCharacter } from '../types/character'
import type { GenitalTraitId, GenitalTrack } from '../types/genitalTrait'
import {
  applyClassFeatures,
  computeClassFeatureAdjustments,
  computeClassMaxPleasureBonus,
} from './applyClassFeatures'
import {
  characterToCombatant,
  combinedOverstimulatedLevel,
  emptyGenitalTrack,
  type ArousalCheckRequest,
  type ArousalCheckResult,
  type ClimaxResult,
  type GenitalTrackState,
  type MaxPleasureBreakdown,
  type OrgasmSaveAbility,
  type OrgasmSaveRequest,
  type OrgasmSaveResult,
  type OrgasmicBoon,
  type OrgasmicBoonId,
  type OverstimulatedCheckRequest,
  type OverstimulatedCheckResult,
  type PhallicRefractorySaveRequest,
  type PhallicRefractorySaveResult,
  type PleasureCombatant,
  type PleasureState,
  type SaveOutcome,
  type StimulationOptions,
  type StimulationResult,
} from './pleasureTypes'

export type {
  ArousalCheckResult,
  ClimaxResult,
  GenitalTrackState,
  MaxPleasureBreakdown,
  OrgasmSaveAbility,
  OrgasmSaveResult,
  OrgasmicBoon,
  OverstimulatedCheckResult,
  PhallicRefractorySaveResult,
  PleasureCombatant,
  PleasureModifiers,
  PleasureState,
  StimulationOptions,
  StimulationResult,
} from './pleasureTypes'

export {
  applyClassFeatures,
  computeClassFeatureAdjustments,
  computeClassMaxPleasureBonus,
} from './applyClassFeatures'
export type {
  ClassFeature,
  ClassFeatureAdjustmentResult,
  ClassFeatureContext,
  CombatantEncounterState,
  StimulationAbility,
} from './applyClassFeatures'
export {
  characterToCombatant,
  combinedOverstimulatedLevel,
  emptyGenitalTrack,
  isPhallicRefractory,
  isRefractory,
  overstimulatedLevel,
} from './pleasureTypes'

const DEFAULT_ADVENTURING_PLEASURE_BASE = 8

/** Table from finalized rules — roll 1d6 on climax. */
export const ORGASMIC_BOONS: Record<OrgasmicBoonId, OrgasmicBoon> = {
  1: {
    roll: 1,
    name: 'Vitality surge',
    description: 'Gain temporary HP equal to Sexuality bonus × 2.',
  },
  2: {
    roll: 2,
    name: 'Resolute spirit',
    description: 'Advantage on one save type of your choice for 8 hours.',
  },
  3: {
    roll: 3,
    name: 'Swift initiative',
    description: 'Add half your Sexuality bonus (round down) to your next Initiative roll.',
  },
  4: {
    roll: 4,
    name: 'Focused talent',
    description: 'Advantage on skill checks using one ability score for 1 hour.',
  },
  5: {
    roll: 5,
    name: 'Arcane potency',
    description: '+1 Spell Save DC and Spell Attack rolls (one encounter or 1 hour).',
  },
  6: {
    roll: 6,
    name: 'Battle ecstasy',
    description: '+1 AC and +1 attack rolls for 1 hour.',
  },
}

export type Rng = () => number

const defaultRng: Rng = () => Math.random()

export function rollD6(rng: Rng = defaultRng): number {
  return 1 + Math.floor(rng() * 6)
}

export function rollD20(rng: Rng = defaultRng): number {
  return 1 + Math.floor(rng() * 20)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function cloneTrack(track: GenitalTrackState): GenitalTrackState {
  return { ...track }
}

function cloneState(state: PleasureState): PleasureState {
  return {
    ...state,
    phallic: cloneTrack(state.phallic),
    vaginal: cloneTrack(state.vaginal),
    genitalShiftStash: state.genitalShiftStash
      ? {
          ...state.genitalShiftStash,
          phallic: cloneTrack(state.genitalShiftStash.phallic),
          vaginal: cloneTrack(state.genitalShiftStash.vaginal),
        }
      : undefined,
    activeBoon: state.activeBoon ? { ...state.activeBoon } : undefined,
  }
}

/** Parse leading integer from carnal class `startingPleasurePoints` (e.g. "12 + Constitution modifier"). */
export function parseCarnalClassPleasureBase(carnalClassId: string | undefined): number | null {
  if (!carnalClassId) return null
  const row = getCarnalClass(carnalClassId)
  if (!row?.startingPleasurePoints) return null
  const m = row.startingPleasurePoints.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

/** Class base for max / starting PP. Carnal classes use table text; others use default + level scaling. */
export function getClassPleasureBase(combatant: PleasureCombatant): number {
  const carnalBase = parseCarnalClassPleasureBase(combatant.carnalClassId)
  if (carnalBase !== null) return carnalBase
  return DEFAULT_ADVENTURING_PLEASURE_BASE + Math.max(0, combatant.level - 1)
}

/**
 * Carnal classes: class base + Sexuality bonus.
 * Others: class base + Constitution modifier.
 */
export function getPleasurePoolModifier(combatant: PleasureCombatant): {
  value: number
  label: string
} {
  if (combatant.carnalClassId) {
    return {
      value: combatant.sexualityBonus,
      label: 'Sexuality modifier (carnal class)',
    }
  }
  return {
    value: abilityModifier(combatant.abilityScores.constitution),
    label: 'Constitution modifier',
  }
}

export function calculateMaxPleasureBreakdown(
  combatant: PleasureCombatant,
  state?: Pick<PleasureState, 'phallic' | 'vaginal'>,
): MaxPleasureBreakdown {
  const classBase = getClassPleasureBase(combatant)
  const mod = getPleasurePoolModifier(combatant)
  const traitBonus =
    (combatant.modifiers.maxPleasureBonus ?? 0) + computeClassMaxPleasureBonus(combatant)
  const overstim =
    state != null
      ? combinedOverstimulatedLevel(state as PleasureState)
      : 0
  const overstimulatedPenalty = overstim * 5
  const total = Math.max(1, classBase + mod.value + traitBonus - overstimulatedPenalty)
  return {
    classBase,
    modifier: mod.value,
    modifierLabel: mod.label,
    traitBonus,
    overstimulatedPenalty,
    total,
  }
}

export function calculateMaxPleasure(
  combatant: PleasureCombatant,
  state?: Pick<PleasureState, 'phallic' | 'vaginal'>,
): number {
  return calculateMaxPleasureBreakdown(combatant, state).total
}

function syncMaxPleasure(
  combatant: PleasureCombatant,
  state: PleasureState,
): PleasureState {
  const next = cloneState(state)
  next.maxPleasurePoints = calculateMaxPleasure(combatant, next)
  next.currentPleasurePoints = clamp(
    next.currentPleasurePoints,
    0,
    next.maxPleasurePoints,
  )
  return next
}

export function createPleasureState(
  combatant: PleasureCombatant,
  partial?: Partial<PleasureState>,
): PleasureState {
  const trait = partial?.genitalTrait ?? partial?.activeGenitalTrait ?? combatant.genitalTrait
  const {
    phallic: phallicPartial,
    vaginal: vaginalPartial,
    currentPleasurePoints: ppPartial,
    ...restPartial
  } = partial ?? {}
  const draft: PleasureState = {
    maxPleasurePoints: 1,
    currentPleasurePoints: 1,
    isAroused: false,
    isEdged: false,
    genitalTrait: trait,
    activeGenitalTrait: partial?.activeGenitalTrait ?? trait,
    hasGenitalShift: partial?.hasGenitalShift ?? combatant.hasGenitalShift,
    phallic: phallicPartial ?? emptyGenitalTrack(),
    vaginal: vaginalPartial ?? emptyGenitalTrack(),
    orgasmSavesThisEncounter: 0,
    orgasmsThisEncounter: 0,
    deniedLevel: 0,
    ...restPartial,
  }
  return syncMaxPleasure(combatant, {
    ...draft,
    currentPleasurePoints:
      ppPartial ?? calculateMaxPleasure(combatant, draft),
  })
}

export function createPleasureStateFromCharacter(
  character: EdndCharacter,
  overrides?: Partial<PleasureCombatant>,
  statePartial?: Partial<PleasureState>,
): { combatant: PleasureCombatant; state: PleasureState } {
  const combatant = characterToCombatant(character, {
    sexualityBonus: sexualityBonusForLevel(character.level),
    ...overrides,
  })
  const state = createPleasureState(combatant, statePartial)
  return { combatant, state }
}

/** Tracks affected by a stimulation instance (defaults to all active tracks for the trait). */
export function stimulationTracksFor(
  state: PleasureState,
  explicit?: GenitalTrack,
): GenitalTrack[] {
  if (explicit) return [explicit]
  return activeGenitalTracks(state.activeGenitalTrait)
}

/** Tracks that receive post-climax rules for this climax. */
export function climaxTracksFor(
  state: PleasureState,
  explicit?: GenitalTrack,
): GenitalTrack[] {
  return stimulationTracksFor(state, explicit)
}

function traitUsesPhallicRules(traitId: GenitalTraitId): boolean {
  return getGenitalTraitDefinition(traitId).usesPhallicRules
}

function traitUsesVaginalRules(traitId: GenitalTraitId): boolean {
  return getGenitalTraitDefinition(traitId).usesVaginalRules
}

/** DC for post-orgasm Con save or early phallic refractory end: 10 + 2 per prior orgasm on that track. */
export function postOrgasmSaveDc(track: GenitalTrackState): number {
  return 10 + 2 * Math.max(0, track.orgasmsThisEncounter - 1)
}

/** Apply pleasure resistance when not Aroused: half, minimum 1. */
export function applyPleasureResistance(
  pleasure: number,
  targetState: PleasureState,
  bypass = false,
): number {
  if (bypass || targetState.isAroused) return Math.max(0, pleasure)
  return Math.max(1, Math.floor(pleasure / 2))
}

export function getOrgasmicBoon(roll: number): OrgasmicBoon {
  const id = clamp(Math.round(roll), 1, 6) as OrgasmicBoonId
  return ORGASMIC_BOONS[id]
}

export function wisdomSaveModifier(combatant: PleasureCombatant): number {
  let mod = abilityModifier(combatant.abilityScores.wisdom)
  if (combatant.wisdomSaveProficient) {
    mod += combatant.sexualityBonus
  }
  mod += combatant.modifiers.arousalSaveBonus ?? 0
  return mod
}

export function orgasmSaveModifier(
  combatant: PleasureCombatant,
  ability: OrgasmSaveAbility,
): number {
  if (ability === 'sexuality') {
    return combatant.sexualityBonus + (combatant.modifiers.orgasmSaveBonus ?? 0)
  }
  return (
    abilityModifier(combatant.abilityScores.constitution) +
    (combatant.modifiers.orgasmSaveBonus ?? 0)
  )
}

export function deniedOrgasmSaveModifier(state: PleasureState): {
  disadvantage: boolean
  autoFailMental: boolean
} {
  return {
    disadvantage: state.deniedLevel >= 1,
    autoFailMental: state.deniedLevel >= 3,
  }
}

/**
 * Not Aroused + pleasure: Wisdom save DC 10 + pleasure from that instance.
 * Proficient in Wisdom saves adds Sexuality bonus.
 */
export function makeArousalCheck(req: ArousalCheckRequest): ArousalCheckResult {
  const state = cloneState(req.targetState)
  const log: string[] = []
  const dc = 10 + Math.max(0, req.pleasureReceived)
  const roll = req.roll ?? rollD20()
  const modifier = wisdomSaveModifier(req.target)
  const total = roll + modifier

  const outcome: SaveOutcome = total >= dc ? 'success' : 'failure'
  const becameAroused = outcome === 'failure'
  if (becameAroused) {
    state.isAroused = true
    log.push(`${req.target.name} fails the Wisdom save and becomes Aroused.`)
  } else {
    log.push(`${req.target.name} resists becoming Aroused.`)
  }

  log.unshift(
    `Arousal save: d20 (${roll}) + ${modifier} = ${total} vs DC ${dc} (10 + ${req.pleasureReceived} pleasure).`,
  )

  return { dc, roll, modifier, total, outcome, becameAroused, state, log }
}

/**
 * Phallic refractory: Sexuality save to end early (default duration = one short rest in play).
 */
export function attemptEndPhallicRefractory(
  req: PhallicRefractorySaveRequest,
): PhallicRefractorySaveResult {
  const state = cloneState(req.state)
  const log: string[] = []
  if (!state.phallic.isRefractory) {
    log.push('Not in phallic Refractory — no save needed.')
    return {
      dc: 0,
      roll: 0,
      modifier: 0,
      total: 0,
      outcome: 'success',
      state,
      log,
    }
  }

  const dc = postOrgasmSaveDc(state.phallic)
  const roll = req.roll ?? rollD20()
  const modifier = req.character.sexualityBonus
  const total = roll + modifier
  const outcome: SaveOutcome = total >= dc ? 'success' : 'failure'

  log.push(
    `End Refractory (Sexuality): d20 (${roll}) + ${modifier} = ${total} vs DC ${dc}.`,
  )

  if (outcome === 'success') {
    state.phallic.isRefractory = false
    log.push('Success — phallic Refractory ends.')
  } else {
    log.push('Failure — still in phallic Refractory.')
  }

  return { dc, roll, modifier, total, outcome, state, log }
}

/** Pleasure during phallic Refractory does not reduce PP; it adds Overstimulation on the phallic track. */
export function applyPhallicRefractoryPleasure(
  combatant: PleasureCombatant,
  state: PleasureState,
  pleasureAmount: number,
): { state: PleasureState; log: string[] } {
  const next = cloneState(state)
  const log: string[] = []
  if (pleasureAmount <= 0) return { state: next, log }

  log.push(
    `${combatant.name} is immune to pleasure while in phallic Refractory (${pleasureAmount} becomes Overstimulation).`,
  )
  next.phallic.overstimulatedLevel += 1
  const synced = syncMaxPleasure(combatant, next)
  log.push(
    `Phallic Overstimulated level ${synced.phallic.overstimulatedLevel} (combined ${combinedOverstimulatedLevel(synced)}: -2 Sexuality, -5 max PP per level).`,
  )
  return { state: synced, log }
}

/** After each vaginal-side orgasm: Con save or gain one Overstimulated level on the vaginal track. */
export function makeOverstimulatedCheck(
  req: OverstimulatedCheckRequest & { rng?: Rng },
): OverstimulatedCheckResult {
  const rng = req.rng ?? defaultRng
  const state = cloneState(req.state)
  const log: string[] = []
  const trackState = req.track === 'phallic' ? state.phallic : state.vaginal
  const dc = postOrgasmSaveDc(trackState)
  const roll = req.roll ?? rollD20(rng)
  const modifier = abilityModifier(req.character.abilityScores.constitution)
  const total = roll + modifier
  const outcome: SaveOutcome = total >= dc ? 'success' : 'failure'

  log.push(
    `Overstimulated check (${req.track}): d20 (${roll}) + ${modifier} = ${total} vs DC ${dc}.`,
  )

  if (outcome === 'failure') {
    trackState.overstimulatedLevel += 1
    log.push(
      `Failure — ${req.track} Overstimulated level ${trackState.overstimulatedLevel}.`,
    )
  } else {
    log.push('Success — no additional Overstimulated level on this track.')
  }

  const synced = syncMaxPleasure(req.character, state)
  const combined = combinedOverstimulatedLevel(synced)
  if (combined > 0) {
    log.push(
      `Combined Overstimulated ${combined} (-${combined * 2} Sexuality, -${combined * 5} max PP).`,
    )
  }

  return { dc, roll, modifier, total, outcome, track: req.track, state: synced, log }
}

export function makeOrgasmSave(req: OrgasmSaveRequest): OrgasmSaveResult {
  const state = cloneState(req.state)
  const log: string[] = []
  const dc = 10 + state.orgasmSavesThisEncounter
  state.orgasmSavesThisEncounter += 1

  const denied = deniedOrgasmSaveModifier(state)
  const roll = req.roll ?? rollD20()
  const modifier = orgasmSaveModifier(req.character, req.ability)

  if (denied.disadvantage) {
    log.push('Denied (level 1+): disadvantage on Orgasm save.')
  }
  if (denied.autoFailMental) {
    log.push('Denied (level 3+): auto-fail — dominated by denier.')
  }

  let total: number
  if (denied.autoFailMental) {
    total = 0
  } else if (denied.disadvantage) {
    const r2 = rollD20()
    const t1 = roll + modifier
    const t2 = r2 + modifier
    total = Math.min(t1, t2)
    log.push(`Disadvantage rolls: ${t1}, ${t2} → using ${total}.`)
  } else {
    total = roll + modifier
    const lustAdvantage = req.character.encounter?.lustActive === true
    if (lustAdvantage) {
      log.push('Lust: advantage on Orgasm save.')
    }
    if (req.character.modifiers.orgasmSaveAdvantage || lustAdvantage) {
      const r2 = rollD20()
      total = Math.max(total, r2 + modifier)
      log.push(`Advantage: kept ${total}.`)
    }
    if (req.character.modifiers.orgasmSaveDisadvantage) {
      const r2 = rollD20()
      total = Math.min(total, r2 + modifier)
      log.push(`Disadvantage: kept ${total}.`)
    }
  }

  const outcome: SaveOutcome = total >= dc ? 'success' : 'failure'
  const climaxed = outcome === 'failure'

  log.unshift(
    `Orgasm save (${req.ability}): d20 (${roll}) + ${modifier} = ${total} vs DC ${dc}.`,
  )

  if (climaxed) {
    log.push('Failure — Climax!')
    const climax = applyClimax(req.character, state)
    return {
      dc,
      roll,
      modifier,
      total,
      outcome,
      climaxed: true,
      state: climax.state,
      boon: climax.boon,
      log: [...log, ...climax.log],
    }
  }

  state.currentPleasurePoints = Math.max(1, Math.floor(state.maxPleasurePoints / 2))
  state.isEdged = true
  log.push(
    `Success — Pleasure Points set to half max (${state.currentPleasurePoints}/${state.maxPleasurePoints}) and Edged.`,
  )

  return { dc, roll, modifier, total, outcome, climaxed: false, state, log }
}

export function applyClimax(
  character: PleasureCombatant,
  state: PleasureState,
  options?: { genitalTrack?: GenitalTrack; boonRoll?: number },
  rng: Rng = defaultRng,
): ClimaxResult {
  const next = cloneState(state)
  const log: string[] = []
  const roll = options?.boonRoll ?? rollD6(rng)
  const boon = getOrgasmicBoon(roll)
  const traitId = next.activeGenitalTrait
  const tracks = climaxTracksFor(next, options?.genitalTrack)

  next.orgasmsThisEncounter += 1
  next.isEdged = false
  next.lastBoonRoll = roll
  next.activeBoon = boon
  next.currentPleasurePoints = 0

  log.push(`Climax! Orgasmic Boon (${roll}): ${boon.name} — ${boon.description}.`)

  const overstimulatedChecks: OverstimulatedCheckResult[] = []

  for (const track of tracks) {
    const trackState = track === 'phallic' ? next.phallic : next.vaginal
    trackState.orgasmsThisEncounter += 1

    if (track === 'phallic' && traitUsesPhallicRules(traitId)) {
      trackState.isRefractory = true
      log.push(
        'Phallic track: enter Refractory (immune to pleasure; pleasure becomes Overstimulation). Short rest default; Sexuality save to end early.',
      )
    }

    if (track === 'vaginal' && traitUsesVaginalRules(traitId)) {
      const check = makeOverstimulatedCheck({ character, state: next, track: 'vaginal', rng })
      Object.assign(next, check.state)
      overstimulatedChecks.push(check)
      log.push(...check.log)
    }
  }

  const synced = syncMaxPleasure(character, next)
  log.push(
    `Fertility bonus ${character.fertilityBonus} (${getGenitalTraitDefinition(traitId).canImpregnateOthers ? 'applies when impregnating' : '—'} / ${getGenitalTraitDefinition(traitId).setsImpregnationDc ? 'sets impregnation DC' : '—'}).`,
  )

  return {
    boon,
    state: synced,
    overstimulatedChecks: overstimulatedChecks.length ? overstimulatedChecks : undefined,
    log,
  }
}

/** Escalate Denied when climax is prevented at 0 PP. */
export function applyDenied(state: PleasureState): PleasureState {
  const next = cloneState(state)
  next.deniedLevel = clamp(next.deniedLevel + 1, 0, 3)
  next.currentPleasurePoints = 0
  return next
}

export function effectiveSexualityBonus(
  combatant: PleasureCombatant,
  state: PleasureState,
): number {
  return Math.max(0, combatant.sexualityBonus - combinedOverstimulatedLevel(state) * 2)
}

function applyPleasureDamage(state: PleasureState, amount: number): PleasureState {
  const next = cloneState(state)
  next.currentPleasurePoints = clamp(
    next.currentPleasurePoints - Math.max(0, amount),
    0,
    next.maxPleasurePoints,
  )
  return next
}

/**
 * Genital Shift: changing configuration clears Refractory/Overstim for the new config.
 * Reverting restores the stashed state from before the shift.
 */
export function applyGenitalShift(
  state: PleasureState,
  newTrait: GenitalTraitId,
): PleasureState {
  if (!state.hasGenitalShift) return state
  const next = cloneState(state)
  next.genitalShiftStash = {
    previousTrait: next.activeGenitalTrait,
    phallic: cloneTrack(next.phallic),
    vaginal: cloneTrack(next.vaginal),
  }
  next.activeGenitalTrait = newTrait
  next.phallic = emptyGenitalTrack()
  next.vaginal = emptyGenitalTrack()
  return next
}

export function revertGenitalShift(state: PleasureState): PleasureState {
  const stash = state.genitalShiftStash
  if (!stash) return state
  const next = cloneState(state)
  next.activeGenitalTrait = stash.previousTrait
  next.phallic = cloneTrack(stash.phallic)
  next.vaginal = cloneTrack(stash.vaginal)
  next.genitalShiftStash = undefined
  return next
}

function phallicRefractoryBlocksPleasure(
  state: PleasureState,
  tracks: GenitalTrack[],
): boolean {
  return state.phallic.isRefractory && tracks.includes('phallic')
}

/**
 * Resolve one stimulation instance: pleasure dealt, resistance, arousal, orgasm saves, climax.
 */
function finalizeStimulationResult(
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  partial: StimulationResult,
  options: StimulationOptions,
  classAdj: ReturnType<typeof computeClassFeatureAdjustments>,
  basePleasureRoll: number,
): StimulationResult {
  return applyClassFeatures(
    attacker,
    target,
    { ...partial, basePleasureRoll },
    options,
    classAdj,
  )
}

export function resolveStimulation(
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  targetState: PleasureState,
  options: StimulationOptions,
  rng: Rng = defaultRng,
): StimulationResult {
  const log: string[] = []
  let state = syncMaxPleasure(target, cloneState(targetState))
  const tracks = stimulationTracksFor(state, options.genitalTrack)
  const classAdj = computeClassFeatureAdjustments(attacker, target, options, rng)
  const basePleasureRoll = options.pleasureRoll

  const rawPleasure = Math.max(
    0,
    basePleasureRoll +
      classAdj.pleasureDealtBonus +
      classAdj.sexualityBonusBonus +
      (attacker.modifiers.pleasureDealtBonus ?? 0),
  )
  const receivedMod =
    (target.modifiers.pleasureReceivedBonus ?? 0) + classAdj.targetPleasureReceivedBonus
  const afterMods = Math.max(0, rawPleasure + receivedMod)
  let pleasureAfterResistance = options.bypassResistance
    ? afterMods
    : applyPleasureResistance(afterMods, state, target.modifiers.pleasureResistanceIgnored)
  if (target.encounter?.lustActive && pleasureAfterResistance > 0) {
    pleasureAfterResistance = Math.max(1, pleasureAfterResistance)
  }

  log.push(
    `${attacker.name} deals ${rawPleasure} pleasure (roll ${basePleasureRoll}${classAdj.pleasureDealtBonus + classAdj.sexualityBonusBonus > 0 ? ` + class ${classAdj.pleasureDealtBonus + classAdj.sexualityBonusBonus}` : ''}) → ${pleasureAfterResistance} after resistance${state.isAroused ? '' : ' (not Aroused)'}.`,
  )

  if (
    phallicRefractoryBlocksPleasure(state, tracks) &&
    pleasureAfterResistance > 0
  ) {
    const refractory = applyPhallicRefractoryPleasure(
      target,
      state,
      pleasureAfterResistance,
    )
    state = refractory.state
    log.push(...refractory.log)
    return finalizeStimulationResult(
      attacker,
      target,
      {
        attacker,
        target,
        pleasureDealt: rawPleasure,
        pleasureAfterResistance,
        state,
        log,
      },
      options,
      classAdj,
      basePleasureRoll,
    )
  }

  if (state.isEdged && pleasureAfterResistance > 0) {
    state = applyPleasureDamage(state, pleasureAfterResistance)
    log.push(
      `Edged: ${target.name} loses ${pleasureAfterResistance} PP (${state.currentPleasurePoints}/${state.maxPleasurePoints}) and must make an Orgasm save.`,
    )
    const orgasmSave = makeOrgasmSave({
      character: target,
      state,
      ability: options.orgasmSaveAbility ?? 'constitution',
    })
    return finalizeStimulationResult(
      attacker,
      target,
      {
        attacker,
        target,
        pleasureDealt: rawPleasure,
        pleasureAfterResistance,
        forcedOrgasmSave: orgasmSave,
        orgasmSave,
        climax: orgasmSave.climaxed
          ? { boon: orgasmSave.boon!, state: orgasmSave.state, log: orgasmSave.log }
          : undefined,
        state: orgasmSave.state,
        log: [...log, ...orgasmSave.log],
      },
      options,
      classAdj,
      basePleasureRoll,
    )
  }

  let arousalCheck: ArousalCheckResult | undefined
  if (!state.isAroused && pleasureAfterResistance > 0 && !options.skipArousalCheck) {
    arousalCheck = makeArousalCheck({
      target,
      targetState: state,
      pleasureReceived: pleasureAfterResistance,
    })
    state = arousalCheck.state
    log.push(...arousalCheck.log)
  }

  if (pleasureAfterResistance > 0) {
    state = applyPleasureDamage(state, pleasureAfterResistance)
    log.push(
      `${target.name} loses ${pleasureAfterResistance} PP (${state.currentPleasurePoints}/${state.maxPleasurePoints}).`,
    )
  }

  if (state.currentPleasurePoints <= 0) {
    if (options.denyClimax) {
      state = applyDenied(state)
      log.push(`Climax denied — Denied level ${state.deniedLevel}.`)
      return finalizeStimulationResult(
        attacker,
        target,
        {
          attacker,
          target,
          pleasureDealt: rawPleasure,
          pleasureAfterResistance,
          state,
          log,
        },
        options,
        classAdj,
        basePleasureRoll,
      )
    }

    log.push('Pleasure Points at 0 — Orgasm save triggered.')
    const orgasmSave = makeOrgasmSave({
      character: target,
      state,
      ability: options.orgasmSaveAbility ?? 'constitution',
    })
    return finalizeStimulationResult(
      attacker,
      target,
      {
        attacker,
        target,
        pleasureDealt: rawPleasure,
        pleasureAfterResistance,
        arousalCheck,
        orgasmSave,
        climax: orgasmSave.climaxed
          ? { boon: orgasmSave.boon!, state: orgasmSave.state, log: orgasmSave.log }
          : undefined,
        state: orgasmSave.state,
        log: [...log, ...orgasmSave.log],
      },
      options,
      classAdj,
      basePleasureRoll,
    )
  }

  return finalizeStimulationResult(
    attacker,
    target,
    {
      attacker,
      target,
      pleasureDealt: rawPleasure,
      pleasureAfterResistance,
      arousalCheck,
      state,
      log,
    },
    options,
    classAdj,
    basePleasureRoll,
  )
}
