import { getSexualHistory } from '../data/registry'
import type { EdndCharacter, EndowmentProfile, EndowmentSize } from '../types/character'
import { normalizedEndowment } from './endowment'
import {
  clampPhallusSizeForCreature,
  resolveCharacterCreatureSize,
} from './phallusScale'
import { resolveCarnalTraitLabels } from './resolveCarnalTraitLabels'

/** Carnal trait id from `carnal-traits.json` — +1 bust/genital size tier on the sheet. */
export const ENDOWED_TRAIT_ID = 'endowed'

const SIZE_ORDER: EndowmentSize[] = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
]

/** One tier larger, capped at Gargantuan (Endowed trait). */
export function bumpEndowmentSizeOneTier(size: EndowmentSize): EndowmentSize {
  const i = SIZE_ORDER.indexOf(size)
  if (i === -1) return size
  return SIZE_ORDER[Math.min(i + 1, SIZE_ORDER.length - 1)]!
}

export function characterHasEndowedTrait(character: EdndCharacter): boolean {
  const hid = character.sexualHistory?.trim()
  if (!hid) return false
  const row = getSexualHistory(hid)
  if (!row?.carnalTraits?.length) return false
  const { resolved } = resolveCarnalTraitLabels(row.carnalTraits)
  return resolved.some((t) => t.id === ENDOWED_TRAIT_ID)
}

/** Applies Endowed (+1 tier) to bust and/or phallus sizes when rolled; does not change vagina. */
export function applyEndowedToEndowment(
  profile: EndowmentProfile,
  hasEndowed: boolean,
): EndowmentProfile {
  if (!hasEndowed) return profile
  const out: EndowmentProfile = { ...profile }
  if ((out.anatomy === 'breasts' || out.anatomy === 'both') && out.breastsSize) {
    out.breastsSize = bumpEndowmentSizeOneTier(out.breastsSize)
  }
  if ((out.anatomy === 'phallus' || out.anatomy === 'both') && out.phallusSize) {
    out.phallusSize = bumpEndowmentSizeOneTier(out.phallusSize)
  }
  return out
}

/** Biology-normalized endowment plus Endowed bumps for sheets and readouts. */
export function getSheetEndowmentProfile(character: EdndCharacter): EndowmentProfile {
  const base = normalizedEndowment(character.endowment)
  const withEndowed = applyEndowedToEndowment(base, characterHasEndowedTrait(character))
  const creatureSize = resolveCharacterCreatureSize(character)
  if (
    (withEndowed.anatomy === 'phallus' || withEndowed.anatomy === 'both') &&
    withEndowed.phallusSize
  ) {
    return {
      ...withEndowed,
      phallusSize: clampPhallusSizeForCreature(withEndowed.phallusSize, creatureSize),
    }
  }
  return withEndowed
}
