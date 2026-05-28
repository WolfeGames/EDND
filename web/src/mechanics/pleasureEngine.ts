import { getCarnalClass } from '../data/registry'
import type { CarnalClassRow } from '../types/tables'
import type { AbilityScores, EdndCharacter, EndowmentSize } from '../types/character'
import { abilityModifier } from '../lib/abilityScores'
import {
  computeBeautyClassBreakdown,
  computeTraitBeautyBonus,
  parseBeautyClassBonus,
} from '../lib/beautyClassCompute'
import { sexualityBonusForLevel } from '../lib/applyCharacterRules'
import { collectRulesSnippets } from './pleasureCollectors'
import {
  parsePleasureDealtBonus,
  parsePleasureTakenPerSource,
  parsePleasureTakenReduction,
} from './pleasureTextParsers'
import type {
  BeautyClassResult,
  MaxPleasureResult,
  ModifierEntry,
  OrgasmSaveRollInput,
  OrgasmSaveRollResult,
  PleasureCondition,
  PleasureState,
  QuickEncounterInput,
  QuickEncounterResult,
  StimulationOptions,
  StimulationResult,
} from './pleasureTypes'

export type {
  BeautyClassResult,
  MaxPleasureResult,
  ModifierEntry,
  OrgasmSaveRollInput,
  OrgasmSaveRollResult,
  PleasureCondition,
  PleasureState,
  QuickEncounterInput,
  QuickEncounterResult,
  StimulationOptions,
  StimulationResult,
} from './pleasureTypes'

const ABILITY_WORD_TO_KEY: Record<string, keyof AbilityScores> = {
  strength: 'strength',
  dexterity: 'dexterity',
  constitution: 'constitution',
  intelligence: 'intelligence',
  wisdom: 'wisdom',
  charisma: 'charisma',
}

const SIZE_ORDER: Record<EndowmentSize, number> = {
  Tiny: 0,
  Small: 1,
  Medium: 2,
  Large: 3,
  Huge: 4,
  Gargantuan: 5,
}

/** Optional scene modifiers keyed by stimulation type label. */
export const STIMULATION_TYPE_MODIFIERS: Record<string, number> = {
  Oral: 0,
  Manual: 0,
  Coital: 0,
  Anal: 0,
  'Psychic / Eromancy': 0,
}

/** Optional scene modifiers keyed by position id or display name (lowercase). */
export const POSITION_MODIFIERS: Record<string, { dealt?: number; taken?: number }> = {
  missionary: { taken: 0 },
  cowgirl: { dealt: 0 },
  'mating press': { dealt: 1 },
  hound: { dealt: 0 },
  tower: { dealt: 0 },
  mount: { dealt: 0 },
}

function ledgerId(prefix: string, index: number): string {
  return `${prefix}-${index}`
}

function parseSexDieFaces(raw: string | undefined): number {
  if (!raw) return 8
  const m = raw.match(/\bd(\d+)\b/i)
  return m ? Math.max(2, parseInt(m[1], 10)) : 8
}

function parseStartingPleasureMax(
  scores: AbilityScores,
  raw: string,
): number | null {
  const m = raw.match(
    /^(\d+)\s*\+\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+modifier\b/i,
  )
  if (!m) return null
  const base = parseInt(m[1], 10)
  const key = ABILITY_WORD_TO_KEY[m[2].toLowerCase()]
  if (!key) return null
  return Math.max(1, base + abilityModifier(scores[key]))
}

function speciesBeautyFromSnippets(c: EdndCharacter): number {
  let bonus = 0
  for (const s of collectRulesSnippets(c)) {
    if (!s.tags.includes('species')) continue
    bonus += parseBeautyClassBonus(s.text)
  }
  return bonus
}

function splitTraitBeautyBonus(c: EdndCharacter): {
  fromRace: number
  fromHistory: number
  fromCarnalTraits: number
} {
  let fromRace = 0
  let fromHistory = 0
  let fromCarnalTraits = 0
  for (const s of collectRulesSnippets(c)) {
    const n = parseBeautyClassBonus(s.text)
    if (!n) continue
    if (s.tags.includes('race')) fromRace += n
    else if (s.tags.includes('history')) fromHistory += n
    else if (s.tags.includes('carnalTrait') || s.tags.includes('carnalClass'))
      fromCarnalTraits += n
  }
  return { fromRace, fromHistory, fromCarnalTraits }
}

/** Full beauty class breakdown from race, sexual history, traits, and ability scores. */
export function calculateBeautyClass(character: EdndCharacter): BeautyClassResult {
  const core = computeBeautyClassBreakdown(character)
  const { fromRace, fromHistory, fromCarnalTraits } = splitTraitBeautyBonus(character)
  const fromSpecies = speciesBeautyFromSnippets(character)
  const entries: ModifierEntry[] = []
  let i = 0
  entries.push({
    id: ledgerId('beauty', i++),
    label: 'Base',
    value: core.base,
    kind: 'beauty',
  })
  entries.push({
    id: ledgerId('beauty', i++),
    label: 'Highest ability modifier',
    value: core.abilityMod,
    kind: 'beauty',
  })
  if (core.manualModifier) {
    entries.push({
      id: ledgerId('beauty', i++),
      label: 'Manual modifier',
      value: core.manualModifier,
      kind: 'beauty',
    })
  }
  if (fromRace) {
    entries.push({
      id: ledgerId('beauty', i++),
      label: 'Racial sexual traits',
      value: fromRace,
      kind: 'beauty',
    })
  }
  if (fromHistory) {
    entries.push({
      id: ledgerId('beauty', i++),
      label: 'Sexual history features',
      value: fromHistory,
      kind: 'beauty',
    })
  }
  if (fromCarnalTraits) {
    entries.push({
      id: ledgerId('beauty', i++),
      label: 'Carnal class / traits',
      value: fromCarnalTraits,
      kind: 'beauty',
    })
  }
  if (fromSpecies) {
    entries.push({
      id: ledgerId('beauty', i++),
      label: 'Species carnal description',
      value: fromSpecies,
      kind: 'beauty',
    })
  }
  const traitTotal = computeTraitBeautyBonus(character)
  const unallocated = traitTotal - fromRace - fromHistory
  if (unallocated > 0 && unallocated !== fromCarnalTraits) {
    entries.push({
      id: ledgerId('beauty', i++),
      label: 'Other trait text',
      value: unallocated - fromCarnalTraits,
      kind: 'beauty',
    })
  }
  return {
    base: core.base,
    abilityMod: core.abilityMod,
    manualModifier: core.manualModifier,
    fromRace,
    fromHistory,
    fromCarnalTraits,
    fromSpecies,
    total: core.total,
    entries,
  }
}

/** Maximum pleasure points per core rules (class override when present). */
export function calculateMaxPleasure(character: EdndCharacter): MaxPleasureResult {
  const cls = character.carnalClass
    ? getCarnalClass(character.carnalClass)
    : undefined
  if (cls?.startingPleasurePoints) {
    const parsed = parseStartingPleasureMax(
      character.abilityScores,
      cls.startingPleasurePoints,
    )
    if (parsed !== null) {
      return {
        max: parsed,
        formula: cls.startingPleasurePoints,
        sexDie: parseSexDieFaces(cls.sexDie),
        constitutionMod: abilityModifier(character.abilityScores.constitution),
        sexualityBonus: character.eroticTraits.sexualityBonus,
        level: character.level,
        usedClassOverride: true,
      }
    }
  }
  const sexDie = parseSexDieFaces(cls?.sexDie)
  const constitutionMod = abilityModifier(character.abilityScores.constitution)
  const sexualityBonus =
    character.eroticTraits.sexualityBonus ?? sexualityBonusForLevel(character.level)
  const level = character.level
  const max = Math.max(1, sexDie + constitutionMod + sexualityBonus + level)
  return {
    max,
    formula: `Sex Die (${sexDie}) + CON (${constitutionMod}) + Sexuality (${sexualityBonus}) + level (${level})`,
    sexDie,
    constitutionMod,
    sexualityBonus,
    level,
    usedClassOverride: false,
  }
}

export function createPleasureState(
  character: EdndCharacter,
  current?: number,
): PleasureState {
  const { max } = calculateMaxPleasure(character)
  const remaining = current ?? max
  return {
    max,
    current: Math.min(remaining, max),
    tempMaxBonus: 0,
    conditions: [],
    orgasmSave: null,
    edgedThreshold: Math.floor(max / 2),
  }
}

function gatherPleasureModifiers(
  character: EdndCharacter,
  role: 'dealt' | 'taken',
): { perSource: number; flat: number; reduction: number; ignoreResistance: boolean } {
  let perSource = 0
  let flat = 0
  let reduction = 0
  let ignoreResistance = false
  for (const s of collectRulesSnippets(character)) {
    const text = s.text
    if (role === 'dealt') {
      flat += parsePleasureDealtBonus(text)
    } else {
      perSource += parsePleasureTakenPerSource(text)
      reduction += parsePleasureTakenReduction(text)
    }
    if (/ignore\s+resistance\s+to\s+pleasure/i.test(text)) ignoreResistance = true
  }
  return { perSource, flat, reduction, ignoreResistance }
}

function sizeCategoryDelta(a?: EndowmentSize, b?: EndowmentSize): number {
  if (!a || !b) return 0
  return Math.abs(SIZE_ORDER[a] - SIZE_ORDER[b])
}

function stimulationTypeBonus(type: string | undefined): number {
  if (!type) return 0
  const key = Object.keys(STIMULATION_TYPE_MODIFIERS).find(
    (k) => k.toLowerCase() === type.toLowerCase(),
  )
  return key ? STIMULATION_TYPE_MODIFIERS[key]! : 0
}

function positionBonuses(positionId: string | undefined): { dealt: number; taken: number } {
  if (!positionId) return { dealt: 0, taken: 0 }
  const key = Object.keys(POSITION_MODIFIERS).find(
    (k) => k.toLowerCase() === positionId.toLowerCase(),
  )
  const row = key ? POSITION_MODIFIERS[key] : undefined
  return { dealt: row?.dealt ?? 0, taken: row?.taken ?? 0 }
}

function hasCondition(state: PleasureState, c: PleasureCondition): boolean {
  return state.conditions.includes(c)
}

function withCondition(state: PleasureState, c: PleasureCondition): PleasureState {
  if (hasCondition(state, c)) return state
  return { ...state, conditions: [...state.conditions, c] }
}

function withoutCondition(state: PleasureState, c: PleasureCondition): PleasureState {
  return {
    ...state,
    conditions: state.conditions.filter((x) => x !== c),
  }
}

export function orgasmSaveDc(
  attacker: EdndCharacter,
  abilityMod = 0,
): number {
  const sexuality =
    attacker.eroticTraits.sexualityBonus ??
    sexualityBonusForLevel(attacker.level)
  return 10 + sexuality + abilityMod
}

export function beginOrgasmSave(
  state: PleasureState,
  dc: number,
): PleasureState {
  return {
    ...state,
    conditions: state.conditions.includes('Edged')
      ? state.conditions
      : [...state.conditions.filter((c) => c !== 'Edged'), 'Edged'],
    orgasmSave: {
      active: true,
      successes: 0,
      failures: 0,
      dc,
    },
  }
}

export function resolveOrgasmSaveRoll(
  input: OrgasmSaveRollInput,
): OrgasmSaveRollResult {
  const track = input.state.orgasmSave
  if (!track?.active) {
    return {
      state: input.state,
      success: false,
      natural20: false,
      note: 'No active orgasm save.',
    }
  }
  const natural20 = input.d20 === 20
  const total = input.d20 + input.constitutionMod + input.sexualityBonus
  const success = natural20 || total >= track.dc
  let successes = track.successes
  let failures = track.failures
  let note: string
  if (natural20) {
    note = 'Natural 20 — rally: recover Sex Die + CON in pleasure and continue.'
    const recovered = Math.max(1, input.state.max - input.state.current)
    return {
      state: {
        ...withoutCondition(input.state, 'Edged'),
        orgasmSave: null,
        current: Math.min(
          input.state.max,
          input.state.current + recovered,
        ),
      },
      success: true,
      natural20: true,
      outcome: 'continue',
      note,
    }
  }
  if (success) {
    successes += 1
    note = `Success (${successes}/3).`
  } else {
    failures += 1
    note = `Failure (${failures}/3).`
  }
  let state: PleasureState = {
    ...input.state,
    orgasmSave: { ...track, successes, failures },
  }
  if (successes >= 3) {
    state = {
      ...withoutCondition(state, 'Edged'),
      orgasmSave: null,
      current: Math.max(1, state.current),
    }
    return {
      state,
      success,
      natural20: false,
      outcome: 'edged',
      note: `${note} Three successes — Edge: retain 1 PP.`,
    }
  }
  if (failures >= 3) {
    state = {
      ...withoutCondition(state, 'Edged'),
      orgasmSave: null,
      current: 0,
      conditions: [
        ...state.conditions.filter((c) => c !== 'Refractory'),
        'Refractory',
      ],
    }
    return {
      state,
      success,
      natural20: false,
      outcome: 'climax',
      note: `${note} Three failures — Climax and Refractory.`,
    }
  }
  return { state, success, natural20: false, note }
}

function applyPleasureToState(
  state: PleasureState,
  pleasureTaken: number,
  options: {
    forcedOrgasmSaveDc?: number
  },
): { state: PleasureState; forcedOrgasmSave: boolean; climaxed: boolean } {
  if (hasCondition(state, 'Refractory') || pleasureTaken <= 0) {
    return { state, forcedOrgasmSave: false, climaxed: false }
  }
  const nextCurrent = Math.max(0, state.current - pleasureTaken)
  let next: PleasureState = { ...state, current: nextCurrent }
  let forcedOrgasmSave = false
  let climaxed = false

  if (nextCurrent <= 0) {
    climaxed = true
    next = {
      ...next,
      conditions: [...next.conditions.filter((c) => c !== 'Refractory'), 'Refractory'],
      orgasmSave: null,
    }
    return { state: next, forcedOrgasmSave, climaxed }
  }

  if (nextCurrent <= next.edgedThreshold && pleasureTaken > 0) {
    next = withCondition(next, 'Edged')
    if (options.forcedOrgasmSaveDc !== undefined) {
      next = beginOrgasmSave(next, options.forcedOrgasmSaveDc)
      forcedOrgasmSave = true
    }
  }

  return { state: next, forcedOrgasmSave, climaxed }
}

/**
 * Resolve a Stimulate action: compute pleasure taken on the recipient and update pleasure state.
 */
export function resolveStimulation(
  attacker: EdndCharacter,
  recipient: EdndCharacter,
  options: StimulationOptions,
  recipientState?: PleasureState,
): StimulationResult {
  const state =
    recipientState ?? createPleasureState(recipient, calculateMaxPleasure(recipient).max)
  const ledger: ModifierEntry[] = []
  const notes: string[] = []
  let li = 0

  if (hasCondition(state, 'Refractory')) {
    notes.push('Refractory — immune to pleasure.')
    return {
      pleasureTaken: 0,
      pleasureBeforeResistance: 0,
      recipientState: state,
      ledger,
      notes,
      forcedOrgasmSave: false,
      climaxed: false,
    }
  }

  const base = options.basePleasure ?? options.dieResult
  ledger.push({
    id: ledgerId('pleasure', li++),
    label: 'Die / base',
    value: base,
    kind: 'pleasureTaken',
  })

  const actorMods = gatherPleasureModifiers(attacker, 'dealt')
  const recipientMods = gatherPleasureModifiers(recipient, 'taken')
  const pos = positionBonuses(options.positionId)
  const stimBonus = stimulationTypeBonus(options.stimulationType)
  const sizeDelta = sizeCategoryDelta(options.actorSize, options.recipientSize)
  const sizeBonus = sizeDelta > 0 ? sizeDelta : 0

  if (actorMods.flat) {
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: 'Attacker pleasure dealt (text)',
      value: actorMods.flat,
      kind: 'pleasureDealt',
    })
  }
  if (recipientMods.perSource && options.sourceCount > 0) {
    const v = recipientMods.perSource * options.sourceCount
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: `Recipient +${recipientMods.perSource}/source × ${options.sourceCount}`,
      value: v,
      kind: 'pleasureTaken',
    })
  }
  if (pos.dealt) {
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: `Position (dealt): ${options.positionId}`,
      value: pos.dealt,
      kind: 'pleasureDealt',
    })
  }
  if (pos.taken) {
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: `Position (taken): ${options.positionId}`,
      value: pos.taken,
      kind: 'pleasureTaken',
    })
  }
  if (stimBonus) {
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: `Stimulation: ${options.stimulationType}`,
      value: stimBonus,
      kind: 'pleasureTaken',
    })
  }
  if (sizeBonus) {
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: 'Size difference',
      value: sizeBonus,
      kind: 'pleasureTaken',
    })
  }

  const perSourceTotal = recipientMods.perSource * Math.max(0, options.sourceCount)
  let pleasureBeforeResistance =
    base +
    actorMods.flat +
    perSourceTotal +
    pos.dealt +
    pos.taken +
    stimBonus +
    sizeBonus

  if (recipientMods.reduction) {
    pleasureBeforeResistance -= recipientMods.reduction
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: 'Pleasure reduction (text)',
      value: -recipientMods.reduction,
      kind: 'pleasureReduction',
    })
  }

  pleasureBeforeResistance = Math.max(0, pleasureBeforeResistance)

  const aroused =
    options.recipientIsAroused ??
    hasCondition(state, 'Aroused')

  let pleasureTaken = pleasureBeforeResistance
  const bypassResistance =
    actorMods.ignoreResistance || recipientMods.ignoreResistance

  if (!aroused && !bypassResistance && pleasureBeforeResistance > 0) {
    const resisted = Math.floor(pleasureBeforeResistance / 2)
    ledger.push({
      id: ledgerId('pleasure', li++),
      label: 'Not Aroused (resistance)',
      value: resisted - pleasureBeforeResistance,
      kind: 'resistance',
    })
    pleasureTaken = resisted
    notes.push('Recipient not Aroused — half pleasure (resistance).')
  }

  pleasureTaken = Math.max(pleasureTaken > 0 ? 1 : 0, pleasureTaken)

  const dc = orgasmSaveDc(attacker)
  const applied = applyPleasureToState(state, pleasureTaken, {
    forcedOrgasmSaveDc: dc,
  })

  if (applied.climaxed) {
    notes.push('Pleasure capacity depleted — climax.')
  } else if (applied.forcedOrgasmSave) {
    notes.push(`Edged — orgasm save begun (DC ${dc}).`)
  }

  if (options.recipientIsAroused && !hasCondition(applied.state, 'Aroused')) {
    applied.state = withCondition(applied.state, 'Aroused')
  }

  return {
    pleasureTaken,
    pleasureBeforeResistance,
    recipientState: applied.state,
    ledger,
    notes,
    forcedOrgasmSave: applied.forcedOrgasmSave,
    climaxed: applied.climaxed,
  }
}

/** Quick Encounter Tester: one-shot stimulation with full modifier ledger. */
export function resolveQuickEncounter(
  input: QuickEncounterInput,
): QuickEncounterResult {
  const stimulation = resolveStimulation(
    input.actor,
    input.recipient,
    {
      actor: input.actor,
      recipient: input.recipient,
      dieResult: input.dieResult,
      sourceCount: input.sourceCount,
      stimulationType: input.stimulationType,
      positionId: input.positionId,
      recipientIsAroused: input.recipientIsAroused,
      watched: input.watched,
    },
    input.state,
  )
  return {
    ...stimulation,
    beautyClass: calculateBeautyClass(input.recipient),
    maxPleasure: calculateMaxPleasure(input.recipient),
  }
}

export function markAroused(state: PleasureState): PleasureState {
  return withCondition(state, 'Aroused')
}

export function clearRefractory(state: PleasureState): PleasureState {
  return withoutCondition(state, 'Refractory')
}

export function sexDieLabel(character: EdndCharacter): string {
  const cls: CarnalClassRow | undefined = character.carnalClass
    ? getCarnalClass(character.carnalClass)
    : undefined
  return cls?.sexDie ?? 'd8'
}

export function formatModifierLedger(entries: ModifierEntry[]): string {
  return entries
    .filter((e) => e.value !== 0)
    .map((e) => `${e.label}: ${e.value >= 0 ? '+' : ''}${e.value}`)
    .join(' · ')
}
