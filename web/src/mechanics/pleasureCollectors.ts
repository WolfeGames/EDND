import {
  getCarnalClass,
  getSexualHistory,
  getSpecies,
} from '../data/registry'
import { parseFeatureLevelRequirement } from '../lib/parseFeatureLevelRequirement'
import { resolveCarnalTraitLabels } from '../lib/resolveCarnalTraitLabels'
import { getRacialSexualTraitSections } from '../lib/racialSexualTraits'
import { splitHistoryFeatureBody } from '../lib/sexualHistoryFeatureDisplay'
import type { EdndCharacter } from '../types/character'
import type { RulesSnippet } from './pleasureTypes'

function pushSnippet(
  out: RulesSnippet[],
  source: string,
  text: string,
  level?: number,
  tags: string[] = [],
): void {
  const t = text.trim()
  if (!t) return
  out.push({ source, text: t, level, tags })
}

/** Gather all rules-bearing text for a character relevant to pleasure/beauty. */
export function collectRulesSnippets(c: EdndCharacter): RulesSnippet[] {
  const out: RulesSnippet[] = []
  const raceId = (c.race || c.species || '').trim()

  if (raceId) {
    const species = getSpecies(raceId)
    if (species) {
      pushSnippet(out, `Species: ${species.name}`, species.carnalTraitDescription, undefined, [
        'species',
      ])
    }
    for (const section of getRacialSexualTraitSections(raceId)) {
      for (const trait of section.traits) {
        pushSnippet(
          out,
          `${section.name}: ${trait.name}`,
          `${trait.mechanical}\n${trait.flavor}`,
          undefined,
          ['race', section.groupId],
        )
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
        const split = splitHistoryFeatureBody(text)
        pushSnippet(
          out,
          `History: ${split?.titleLine ?? key}`,
          split?.body ?? text,
          req ?? undefined,
          ['history', histId],
        )
      }
    }
  }

  if (c.carnalClass) {
    const cls = getCarnalClass(c.carnalClass)
    if (cls) {
      for (const [key, val] of Object.entries(cls.features)) {
        const req = parseFeatureLevelRequirement(key)
        if (req !== null && req > c.level) continue
        const text = typeof val === 'string' ? val : `${val.name}: ${val.description}`
        pushSnippet(out, `Class: ${cls.name} (${key})`, text, req ?? undefined, [
          'carnalClass',
          c.carnalClass,
        ])
      }
    }
  }

  const histRow = histId ? getSexualHistory(histId) : undefined
  const { resolved: carnalTraitRows } = resolveCarnalTraitLabels(histRow?.carnalTraits ?? [])
  for (const trait of carnalTraitRows) {
    pushSnippet(out, `Carnal trait: ${trait.name}`, trait.description, undefined, [
      'carnalTrait',
      trait.id,
    ])
  }

  return out
}
