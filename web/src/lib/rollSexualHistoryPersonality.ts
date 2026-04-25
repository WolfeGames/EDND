import { getSexualHistory, pickRandom } from '../data/registry'
import type { SexualHistoryPersonality } from '../types/character'

export function emptySexualHistoryPersonality(): SexualHistoryPersonality {
  return { trait: '', ideal: '', bond: '', flaw: '' }
}

/** One random pick from each table for the given sexual history id. */
export function rollSexualHistoryPersonality(
  historyId: string,
): SexualHistoryPersonality {
  const h = getSexualHistory(historyId)
  if (!h?.personality) return emptySexualHistoryPersonality()
  const p = h.personality
  const idealRow = pickRandom(p.ideals)
  const ideal =
    idealRow != null ? `${idealRow.text} (${idealRow.alignment})` : ''
  return {
    trait: pickRandom(p.traits) ?? '',
    ideal,
    bond: pickRandom(p.bonds) ?? '',
    flaw: pickRandom(p.flaws) ?? '',
  }
}
