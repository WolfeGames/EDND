import type { PleasureCombatant, StimulationOptions } from './pleasureTypes'

export type Rng = () => number

/**
 * Carnal class feature hooks for the pleasure engine.
 *
 * HOW TO EXTEND
 * ------------
 * 1. Add mechanical constants (positions, spell ids, item ids) in this file.
 * 2. Implement a handler in `applyClassFeatures.ts` and register it in CLASS_PRE_STIMULATION_HANDLERS.
 * 3. For purely numeric bonuses, you can instead set `combatant.modifiers` when building the combatant.
 * 4. Post-resolution hooks (orgasm save advantage from Lust) go in CLASS_POST_STIMULATION_HANDLERS.
 * 5. Max-PP changes (Primal Vitality) belong in `computeClassMaxPleasureBonus`.
 */

export type ClassFeatureSource = 'attacker' | 'target' | 'equipment' | 'spell' | 'racial' | 'history'

/** One applied bonus or rule invocation — surfaced in logs and the playtester UI. */
export interface ClassFeature {
  id: string
  name: string
  source: ClassFeatureSource
  /** Signed flat change to pleasure dealt or received (documented per feature). */
  amount: number
  /** Optional dice notation for display, e.g. "1d8". */
  dice?: string
  description: string
}

export type StimulationAbility =
  | 'dexterity'
  | 'charisma'
  | 'strength'
  | 'constitution'
  | 'wisdom'
  | 'intelligence'

/** Per-combatant toggles and gear — set from character sheet or QuickEncounterTester. */
export interface CombatantEncounterState {
  /** Ravager: Lust bonus action state. */
  lustActive?: boolean
  /** Defaults to Sexuality bonus when omitted. */
  lustBonus?: number
  /** Carnal Artificer / any class: crafted or mundane item ids from carnal-equipment.json. */
  equippedItemIds?: string[]
  /** Eroticist / warlock-style: active spell effect ids (see EROTICIST_SPELL_EFFECTS). */
  activeSpellIds?: string[]
  /** Lustbound pact entity id. */
  lustboundPactId?: 'nymph' | 'succubus' | 'velvetShade' | 'alienOrgan'
  /** Lustbound 18+: resistance to pleasure received. */
  transfiguredFlesh?: boolean
  /** Ravager: bonus max PP from Constitution (Primal Vitality). */
  primalVitality?: boolean
  /** Ravager 14+: narrative flag — Lust persists without stimulation (playtest toggle). */
  insatiable?: boolean
  /** Lustbound 1: Xenophilic — cross-species bonuses apply. */
  xenophilic?: boolean
  /** Species id for Xenophilic / pact targeting. */
  speciesId?: string
}

/** Stimulation-scene flags (often from the attacker). */
export interface ClassFeatureContext {
  stimulationAbility?: StimulationAbility
  audiencePresent?: boolean
  isPerformance?: boolean
}

export interface ClassFeatureAdjustmentResult {
  /** Added to attacker's pleasure roll before other modifiers. */
  pleasureDealtBonus: number
  /** Added to target's received total (negative = less pleasure taken). */
  targetPleasureReceivedBonus: number
  /** Extra effective Sexuality bonus for position-based features (Need to Breed). */
  sexualityBonusBonus: number
  features: ClassFeature[]
}

/** Positions that trigger Ravager Need to Breed (Sexuality doubled on checks). */
export const NEED_TO_BREED_POSITIONS = new Set([
  'mating press',
  'hound',
  'stallion',
  'missionary',
])

/** Crafted / tagged equipment pleasure bonuses (Artificer and general gear). */
export const EQUIPMENT_PLEASURE_BONUSES: Record<
  string,
  { name: string; dice: string; sides: number; count: number }
> = {
  'vibrating-olisbos': {
    name: 'Vibrating Olisbos',
    dice: '1d8',
    sides: 8,
    count: 1,
  },
  'vibrating-tongue-ring': {
    name: 'Vibrating Tongue Ring',
    dice: '1d4',
    sides: 4,
    count: 1,
  },
  'aphrodisiac-oil': { name: 'Aphrodisiac Oil', dice: '1d4', sides: 4, count: 0 },
}

/** Eroticist spell ids → flat or dice pleasure on stimulation. */
export const EROTICIST_SPELL_EFFECTS: Record<
  string,
  { name: string; flat?: number; dice?: { count: number; sides: number } }
> = {
  arouse: { name: 'Arouse', flat: 3 },
  'burst-of-bliss': { name: 'Burst of Bliss', dice: { count: 2, sides: 6 } },
  'ritual-sex': { name: 'Ritual sex', dice: { count: 1, sides: 6 } },
  sensation: { name: 'Sensation', flat: 2 },
}

/** Lustbound pact id → pleasure dealt bonus when active. */
export const LUSTBOUND_PACT_PLEASURE: Record<string, { name: string; bonus: number }> = {
  nymph: { name: 'Nymph pact (Blissful Presence)', bonus: 2 },
  succubus: { name: 'Succubus pact (Draining Pleasure)', bonus: 3 },
  velvetShade: { name: 'Velvet Shade pact (Necrotic Libido)', bonus: 2 },
  alienOrgan: { name: 'Alien Organ pact (Psychosexual)', bonus: 4 },
}

export function normalizePosition(position: string | undefined): string {
  return (position ?? '').trim().toLowerCase()
}

export function isNeedToBreedPosition(position: string | undefined): boolean {
  return NEED_TO_BREED_POSITIONS.has(normalizePosition(position))
}

export function blissDieSides(level: number): number {
  if (level >= 17) return 12
  if (level >= 11) return 10
  if (level >= 6) return 8
  return 6
}

export function rollDice(count: number, sides: number, rng: Rng): number {
  let total = 0
  for (let i = 0; i < count; i++) total += 1 + Math.floor(rng() * sides)
  return total
}

export function lustBonusFor(combatant: PleasureCombatant): number {
  const custom = combatant.encounter?.lustBonus
  if (typeof custom === 'number') return Math.max(0, custom)
  return Math.max(1, combatant.sexualityBonus)
}

export function mergeClassFeatureContext(
  options: StimulationOptions,
): ClassFeatureContext {
  return {
    stimulationAbility: options.stimulationAbility,
    audiencePresent: options.audiencePresent,
    isPerformance: options.isPerformance,
    ...options.classFeatureContext,
  }
}
