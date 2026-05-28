import { getSexualHistory } from '../data/registry'
import type { EdndCharacter } from '../types/character'
import { deriveBeautyClass, highestAbilityModifier } from './abilityScores'
import { parseFeatureLevelRequirement } from './parseFeatureLevelRequirement'
import { getRacialSexualTraitSections } from './racialSexualTraits'
import { splitHistoryFeatureBody } from './sexualHistoryFeatureDisplay'

/** Sum flat "+N Beauty Class" style bonuses in rules text (ignores "becomes 20" setters). */
export function parseBeautyClassBonus(text: string): number {
  let sum = 0
  const patterns = [
    /\+\s*(\d+)\s+Beauty\s+Class/gi,
    /\+\s*(\d+)\s+to\s+Beauty\s+Class/gi,
    /Beauty\s+Class\s+increases?\s+by\s+(\d+)/gi,
    /increases?\s+(?:your\s+)?Beauty\s+Class\s+by\s+(\d+)/gi,
  ]
  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      sum += Number(m[1])
    }
  }
  return sum
}

export type BeautyClassBreakdown = {
  base: number
  abilityMod: number
  manualModifier: number
  traitBonus: number
  total: number
}

export function computeBeautyClassBreakdown(c: EdndCharacter): BeautyClassBreakdown {
  const base = 10
  const abilityMod = highestAbilityModifier(c.abilityScores)
  const manualModifier = c.eroticTraits.beautyModifier
  const traitBonus = computeTraitBeautyBonus(c)
  const total = deriveBeautyClass(c.abilityScores, manualModifier + traitBonus)
  return { base, abilityMod, manualModifier, traitBonus, total }
}

export function computeTraitBeautyBonus(c: EdndCharacter): number {
  let bonus = 0
  const raceId = (c.race || c.species || '').trim()
  if (raceId) {
    for (const section of getRacialSexualTraitSections(raceId)) {
      for (const t of section.traits) {
        bonus += parseBeautyClassBonus(t.mechanical)
      }
    }
  }

  const histId = (c.sexualHistory ?? '').trim()
  if (histId) {
    const row = getSexualHistory(histId)
    if (row) {
      for (const [key, text] of Object.entries(row.features)) {
        const req = parseFeatureLevelRequirement(key)
        if (req !== null && req > c.level) continue
        bonus += parseBeautyClassBonus(text)
      }
    }
  }

  return bonus
}

export function buildAppliedTraits(c: EdndCharacter): string[] {
  const out: string[] = []
  const raceId = (c.race || c.species || '').trim()

  if (raceId) {
    for (const section of getRacialSexualTraitSections(raceId)) {
      for (const t of section.traits) {
        out.push(`${t.name} (${section.name})`)
      }
    }
  }

  const histId = (c.sexualHistory ?? '').trim()
  if (histId) {
    const row = getSexualHistory(histId)
    if (row) {
      out.push(`Sexual history: ${row.name}`)
      for (const [key, text] of Object.entries(row.features)) {
        const req = parseFeatureLevelRequirement(key)
        if (req !== null && req > c.level) continue
        const split = splitHistoryFeatureBody(text)
        out.push(split ? `${split.titleLine} (Lv ${req ?? '?'})` : text.split('\n')[0] ?? key)
      }
    }
  }

  return out
}
