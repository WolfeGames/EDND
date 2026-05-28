import type { Rng } from './classFeatures'
import {
  blissDieSides,
  EROTICIST_SPELL_EFFECTS,
  EQUIPMENT_PLEASURE_BONUSES,
  isNeedToBreedPosition,
  LUSTBOUND_PACT_PLEASURE,
  lustBonusFor,
  mergeClassFeatureContext,
  rollDice,
  type ClassFeatureAdjustmentResult,
  type ClassFeatureContext,
} from './classFeatures'
import type { PleasureCombatant, StimulationOptions, StimulationResult } from './pleasureTypes'

export type {
  ClassFeature,
  ClassFeatureAdjustmentResult,
  ClassFeatureContext,
  CombatantEncounterState,
  StimulationAbility,
} from './classFeatures'

export { NEED_TO_BREED_POSITIONS, EQUIPMENT_PLEASURE_BONUSES, EROTICIST_SPELL_EFFECTS } from './classFeatures'

type PreHandler = (
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  options: StimulationOptions,
  ctx: ClassFeatureContext,
  rng: Rng,
) => ClassFeatureAdjustmentResult

function emptyAdjustment(): ClassFeatureAdjustmentResult {
  return {
    pleasureDealtBonus: 0,
    targetPleasureReceivedBonus: 0,
    sexualityBonusBonus: 0,
    features: [],
  }
}

function mergeAdjustments(
  ...parts: ClassFeatureAdjustmentResult[]
): ClassFeatureAdjustmentResult {
  const out = emptyAdjustment()
  for (const p of parts) {
    out.pleasureDealtBonus += p.pleasureDealtBonus
    out.targetPleasureReceivedBonus += p.targetPleasureReceivedBonus
    out.sexualityBonusBonus += p.sexualityBonusBonus
    out.features.push(...p.features)
  }
  return out
}

/** Siren: Bliss die (Dex/Cha stimulation), Center of Attention, Erotic Performance. */
function sirenPreStimulation(
  attacker: PleasureCombatant,
  _target: PleasureCombatant,
  _options: StimulationOptions,
  ctx: ClassFeatureContext,
  rng: Rng,
): ClassFeatureAdjustmentResult {
  const out = emptyAdjustment()
  const ability = ctx.stimulationAbility
  const usesFinesse =
    ability === 'dexterity' || ability === 'charisma'

  if (usesFinesse) {
    const sides = blissDieSides(attacker.level)
    const roll = rollDice(1, sides, rng)
    out.pleasureDealtBonus += roll
    out.features.push({
      id: 'siren-bliss-die',
      name: 'Bliss die',
      source: 'attacker',
      amount: roll,
      dice: `1d${sides}`,
      description: `Add Bliss die when using ${ability === 'dexterity' ? 'Dex' : 'Cha'} for stimulation.`,
    })
  }

  if (ctx.audiencePresent && ctx.isPerformance) {
    const bonus = attacker.sexualityBonus
    out.pleasureDealtBonus += bonus
    out.features.push({
      id: 'siren-center-of-attention',
      name: 'Center of Attention',
      source: 'attacker',
      amount: bonus,
      description: 'Bonus pleasure when performing for an audience.',
    })
  }

  if (ctx.isPerformance) {
    const perfBonus = rollDice(2, 6, rng)
    out.pleasureDealtBonus += perfBonus
    out.features.push({
      id: 'siren-erotic-performance',
      name: 'Erotic Performance',
      source: 'attacker',
      amount: perfBonus,
      dice: '2d6',
      description: 'Extra pleasure during erotic performances.',
    })
  }

  return out
}

/** Ravager: Lust, Need to Breed, Primal Vitality / Insatiable (flags). */
function ravagerPreStimulation(
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  options: StimulationOptions,
  _ctx: ClassFeatureContext,
  _rng: Rng,
): ClassFeatureAdjustmentResult {
  const out = emptyAdjustment()

  if (attacker.encounter?.lustActive) {
    const lust = lustBonusFor(attacker)
    out.pleasureDealtBonus += lust
    out.features.push({
      id: 'ravager-lust-dealt',
      name: 'Lust',
      source: 'attacker',
      amount: lust,
      description: 'Bonus pleasure dealt while in Lust.',
    })
  }

  if (target.encounter?.lustActive) {
    const lust = lustBonusFor(target)
    out.targetPleasureReceivedBonus -= lust
    out.features.push({
      id: 'ravager-lust-received',
      name: 'Lust',
      source: 'target',
      amount: -lust,
      description: 'Reduce pleasure received while in Lust (minimum 1 after rules).',
    })
  }

  if (isNeedToBreedPosition(options.position)) {
    out.sexualityBonusBonus += attacker.sexualityBonus
    out.features.push({
      id: 'ravager-need-to-breed',
      name: 'Need to Breed',
      source: 'attacker',
      amount: attacker.sexualityBonus,
      description:
        'Double Sexuality bonus on checks in Mating Press, Hound, Stallion, or Missionary (+bonus to dealt pleasure).',
    })
  }

  if (attacker.encounter?.insatiable) {
    out.features.push({
      id: 'ravager-insatiable',
      name: 'Insatiable',
      source: 'attacker',
      amount: 0,
      description: 'Lust does not end from lack of stimulation (Unending Lust / Primal Lust).',
    })
  }

  if (attacker.encounter?.primalVitality) {
    out.features.push({
      id: 'ravager-primal-vitality',
      name: 'Primal Vitality',
      source: 'attacker',
      amount: 0,
      description: 'Increased max Pleasure Points from primal constitution (applied at state creation).',
    })
  }

  return out
}

function lustboundPreStimulation(
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  _options: StimulationOptions,
  _ctx: ClassFeatureContext,
  _rng: Rng,
): ClassFeatureAdjustmentResult {
  const out = emptyAdjustment()
  const enc = attacker.encounter

  if (enc?.xenophilic) {
    const aSpecies = enc.speciesId?.trim()
    const tSpecies = target.encounter?.speciesId?.trim()
    if (aSpecies && tSpecies && aSpecies !== tSpecies) {
      out.pleasureDealtBonus += 1
      out.features.push({
        id: 'lustbound-xenophilic',
        name: 'Xenophilic',
        source: 'attacker',
        amount: 1,
        description: 'Cross-species stimulation without disadvantage — +1 pleasure dealt.',
      })
    }
  }

  const pactId = enc?.lustboundPactId
  if (pactId && LUSTBOUND_PACT_PLEASURE[pactId]) {
    const row = LUSTBOUND_PACT_PLEASURE[pactId]
    out.pleasureDealtBonus += row.bonus
    out.features.push({
      id: `lustbound-pact-${pactId}`,
      name: row.name,
      source: 'attacker',
      amount: row.bonus,
      description: 'Carnal Pact elemental / patron pleasure bonus.',
    })
  }

  if (enc?.transfiguredFlesh && attacker.level >= 18) {
    out.features.push({
      id: 'lustbound-transfigured-flesh',
      name: 'Transfigured Flesh',
      source: 'attacker',
      amount: 0,
      description: 'Manifested flesh grants pleasure resistance (applied when this creature is target).',
    })
  }

  return out
}

function equipmentPreStimulation(
  attacker: PleasureCombatant,
  _target: PleasureCombatant,
  _options: StimulationOptions,
  _ctx: ClassFeatureContext,
  rng: Rng,
): ClassFeatureAdjustmentResult {
  const out = emptyAdjustment()
  const ids = attacker.encounter?.equippedItemIds ?? []
  for (const id of ids) {
    const row = EQUIPMENT_PLEASURE_BONUSES[id]
    if (!row || row.count === 0) continue
    const roll = rollDice(row.count, row.sides, rng)
    out.pleasureDealtBonus += roll
    out.features.push({
      id: `equipment-${id}`,
      name: row.name,
      source: 'equipment',
      amount: roll,
      dice: row.dice,
      description: `Equipped item adds ${row.dice} to pleasure dealt.`,
    })
  }
  return out
}

function eroticistPreStimulation(
  attacker: PleasureCombatant,
  _target: PleasureCombatant,
  _options: StimulationOptions,
  _ctx: ClassFeatureContext,
  rng: Rng,
): ClassFeatureAdjustmentResult {
  const out = emptyAdjustment()
  if (attacker.carnalClassId !== 'eroticist' && attacker.carnalClassId !== 'divine-consort') {
    /* Eroticist spells can be taken by other casters via activeSpellIds */
  }
  const spellIds = attacker.encounter?.activeSpellIds ?? []
  for (const spellId of spellIds) {
    const row = EROTICIST_SPELL_EFFECTS[spellId]
    if (!row) continue
    let amount = row.flat ?? 0
    if (row.dice) amount += rollDice(row.dice.count, row.dice.sides, rng)
    out.pleasureDealtBonus += amount
    out.features.push({
      id: `spell-${spellId}`,
      name: row.name,
      source: 'spell',
      amount,
      dice: row.dice ? `${row.dice.count}d${row.dice.sides}` : undefined,
      description: 'Active spell effect modifies pleasure dealt.',
    })
  }
  return out
}

const CLASS_HANDLERS: Record<string, PreHandler> = {
  siren: sirenPreStimulation,
  ravager: ravagerPreStimulation,
  lustbound: lustboundPreStimulation,
  'carnal-artificer': equipmentPreStimulation,
  eroticist: eroticistPreStimulation,
}

/**
 * Compute all class / gear / spell bonuses before core pleasure math runs.
 */
export function computeClassFeatureAdjustments(
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  options: StimulationOptions,
  rng: Rng,
): ClassFeatureAdjustmentResult {
  const ctx = mergeClassFeatureContext(options)
  const parts: ClassFeatureAdjustmentResult[] = []

  const attackerClass = attacker.carnalClassId
  if (attackerClass && CLASS_HANDLERS[attackerClass]) {
    parts.push(CLASS_HANDLERS[attackerClass](attacker, target, options, ctx, rng))
  }

  /* Artificer always processes equipment; other classes can equip items too. */
  if (attackerClass !== 'carnal-artificer') {
    parts.push(equipmentPreStimulation(attacker, target, options, ctx, rng))
  }

  if (
    attacker.encounter?.activeSpellIds?.length &&
    attackerClass !== 'eroticist' &&
    attackerClass !== 'divine-consort'
  ) {
    parts.push(eroticistPreStimulation(attacker, target, options, ctx, rng))
  }

  /* Transfigured Flesh on target reduces pleasure received. */
  if (target.encounter?.transfiguredFlesh && target.level >= 18) {
    const resist = 2
    parts.push({
      pleasureDealtBonus: 0,
      targetPleasureReceivedBonus: -resist,
      sexualityBonusBonus: 0,
      features: [
        {
          id: 'lustbound-transfigured-flesh-target',
          name: 'Transfigured Flesh',
          source: 'target',
          amount: -resist,
          description: 'Resistance to pleasure received.',
        },
      ],
    })
  }

  return mergeAdjustments(...parts)
}

/**
 * Attach class feature effects to a resolved stimulation and apply post-rules
 * (e.g. minimum 1 pleasure received after Lust reduction).
 */
export function applyClassFeatures(
  attacker: PleasureCombatant,
  target: PleasureCombatant,
  result: StimulationResult,
  _options: StimulationOptions,
  preAdjustments?: ClassFeatureAdjustmentResult,
): StimulationResult {
  const features = preAdjustments?.features ?? []
  const log = [...result.log]

  if (features.length > 0) {
    log.unshift(
      `Class features (${features.length}): ${features.map((f) => `${f.name}${f.amount ? ` ${f.amount >= 0 ? '+' : ''}${f.amount}` : ''}`).join('; ')}.`,
    )
  }

  if (target.encounter?.lustActive && result.pleasureAfterResistance > 0) {
    const minReceived = 1
    if (result.pleasureAfterResistance < minReceived) {
      log.push(`Lust reduction floor: pleasure received minimum ${minReceived}.`)
    }
  }

  const lustOrgasmNote = attacker.encounter?.lustActive || target.encounter?.lustActive
  if (lustOrgasmNote && !features.some((f) => f.id === 'ravager-lust-orgasm')) {
    features.push({
      id: 'ravager-lust-orgasm',
      name: 'Lust',
      source: attacker.encounter?.lustActive ? 'attacker' : 'target',
      amount: 0,
      description: 'Advantage on Orgasm saving throws while in Lust.',
    })
  }

  return {
    ...result,
    classFeatureEffects: features,
    log,
  }
}

/** Max PP bonus from class features (Primal Vitality, future Insatiable scaling). */
export function computeClassMaxPleasureBonus(combatant: PleasureCombatant): number {
  let bonus = 0
  if (
    combatant.carnalClassId === 'ravager' &&
    combatant.encounter?.primalVitality
  ) {
    bonus += Math.max(0, Math.floor(combatant.level / 2))
  }
  return bonus
}
