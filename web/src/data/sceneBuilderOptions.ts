import type { StimulationAbility } from '../mechanics/classFeatures'
import type { PleasureCombatant } from '../mechanics/pleasureTypes'

export type PositionTier = 'Basic' | 'Advanced' | 'Exotic'

export interface ScenePosition {
  id: string
  name: string
  tier: PositionTier
  flavor: string
}

export interface StimulationTypeOption {
  id: string
  label: string
  flavor: string
  defaultAbility: StimulationAbility
  /** Siren treats performances as erotic performance. */
  isPerformance?: boolean
}

export const SCENE_POSITIONS: ScenePosition[] = [
  { id: 'missionary', name: 'Missionary', tier: 'Basic', flavor: 'Face to face, intimate eye contact — classic, close, and emotionally charged.' },
  { id: 'cowgirl', name: 'Cowgirl', tier: 'Basic', flavor: 'One partner astride, setting pace and depth with hips and balance.' },
  { id: 'reverse-cowgirl', name: 'Reverse Cowgirl', tier: 'Basic', flavor: 'Riding with back turned — all motion, less gaze, more sensation.' },
  { id: 'spoon', name: 'Spoon', tier: 'Basic', flavor: 'Curled together from behind — slow, warm, and deceptively deep.' },
  { id: 'standing', name: 'Standing', tier: 'Basic', flavor: 'Urgent and athletic; walls, doors, and stolen moments.' },
  { id: 'lotus', name: 'Lotus', tier: 'Basic', flavor: 'Wrapped legs and locked embrace — control through closeness, not force.' },
  { id: 'hound', name: 'Hound', tier: 'Basic', flavor: 'On all fours — primal rhythm; favored by Ravagers who hunt in heat.' },
  { id: 'stallion', name: 'Stallion', tier: 'Basic', flavor: 'Mounted from behind with height and leverage — raw, pounding drive.' },
  { id: 'mating-press', name: 'Mating Press', tier: 'Basic', flavor: 'Pinned and folded — overwhelming closeness; Need to Breed doubles Sexuality here.' },
  { id: 'side-saddle', name: 'Side Saddle', tier: 'Advanced', flavor: 'Angled entry with one leg raised — teasing depth and control.' },
  { id: 'butterfly', name: 'Butterfly', tier: 'Advanced', flavor: 'Hips at the edge, legs lifted — exposed, vulnerable, devastating access.' },
  { id: 'wheelbarrow', name: 'Wheelbarrow', tier: 'Advanced', flavor: 'Strength and trust; acrobatic, breathless, and showy.' },
  { id: 'suspended', name: 'Suspended', tier: 'Advanced', flavor: 'Lifted or braced mid-air — every muscle engaged, every gasp earned.' },
  { id: 'lotus-bloom', name: 'Lotus Bloom', tier: 'Advanced', flavor: 'Advanced lotus variants with binding grips and synchronized breathing.' },
  { id: 'tower', name: 'Tower', tier: 'Exotic', flavor: 'Size-difference geometry — one partner towers; Monstrous Rut ignores resistance.' },
  { id: 'mount', name: 'Mount', tier: 'Exotic', flavor: 'Pinned beneath a larger lover — weight, heat, and surrender.' },
  { id: 'size-difference', name: 'Size Difference', tier: 'Exotic', flavor: 'Deliberate mismatch of scale — careful angles, impossible fullness.' },
  { id: 'tentacle-garden', name: 'Tentacle Garden', tier: 'Exotic', flavor: 'Multiple points of contact — alien rhythm, no single center of pleasure.' },
  { id: 'otherworldly-congress', name: 'Otherworldly Congress', tier: 'Exotic', flavor: 'Pact-bound rites — planes blur; Lustbound signature position.' },
]

export const STIMULATION_TYPES: StimulationTypeOption[] = [
  { id: 'oral', label: 'Oral', flavor: 'Mouth, tongue, and breath — finesse and tease.', defaultAbility: 'dexterity' },
  { id: 'manual', label: 'Manual', flavor: 'Hands and touch — direct, adaptable pressure.', defaultAbility: 'dexterity' },
  { id: 'coital', label: 'Coital', flavor: 'Penetrative union — requires Aroused; strength and stamina matter.', defaultAbility: 'strength' },
  { id: 'anal', label: 'Anal', flavor: 'Rear entry — technique and care; often higher DCs.', defaultAbility: 'dexterity' },
  { id: 'object', label: 'Object', flavor: 'Toys, tools, crafted focuses — Artificer gear shines here.', defaultAbility: 'intelligence' },
  { id: 'tail', label: 'Tail', flavor: 'Prehensile appendages — unusual angles and double stimulation.', defaultAbility: 'dexterity' },
  { id: 'tentacle', label: 'Tentacle', flavor: 'Writhing multi-contact — overwhelming, alien cadence.', defaultAbility: 'dexterity' },
  { id: 'erogeny', label: 'Erogeny', flavor: 'Zones and sensitivity mapping — patient, knowing touch.', defaultAbility: 'wisdom' },
  { id: 'seduction', label: 'Seduction', flavor: 'Words, gaze, and promise — pleasure before contact.', defaultAbility: 'charisma' },
  {
    id: 'performance',
    label: 'Performance',
    flavor: 'Song, dance, or exhibition — Siren Bliss and audience bonuses apply.',
    defaultAbility: 'charisma',
    isPerformance: true,
  },
]

const CARNAL_PRIMARY_ABILITY: Record<string, StimulationAbility> = {
  siren: 'charisma',
  ravager: 'constitution',
  lustbound: 'charisma',
  'carnal-artificer': 'intelligence',
  eroticist: 'intelligence',
  'divine-consort': 'charisma',
  courtesan: 'charisma',
}

/**
 * Pick the most logical stimulation ability for type + attacker class.
 */
export function defaultStimulationAbilityFor(
  stimulationTypeId: string,
  attacker: PleasureCombatant | null,
): StimulationAbility {
  const type = STIMULATION_TYPES.find((t) => t.id === stimulationTypeId)
  let ability = type?.defaultAbility ?? 'charisma'

  const carnal = attacker?.carnalClassId
  const primary = carnal ? CARNAL_PRIMARY_ABILITY[carnal] : undefined

  if (carnal === 'siren' && (stimulationTypeId === 'oral' || stimulationTypeId === 'performance' || stimulationTypeId === 'seduction')) {
    return 'charisma'
  }
  if (carnal === 'ravager' && (stimulationTypeId === 'coital' || stimulationTypeId === 'manual')) {
    return 'constitution'
  }
  if (carnal === 'carnal-artificer' && stimulationTypeId === 'object') {
    return 'intelligence'
  }
  if (primary && (stimulationTypeId === 'seduction' || stimulationTypeId === 'performance')) {
    return primary
  }

  return ability
}

export function positionById(id: string): ScenePosition | undefined {
  return SCENE_POSITIONS.find((p) => p.id === id)
}

export function positionNameForEngine(id: string): string {
  return positionById(id)?.name ?? id
}

export function stimulationLabel(id: string): string {
  return STIMULATION_TYPES.find((t) => t.id === id)?.label ?? id
}
