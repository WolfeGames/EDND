import { carnalTraits } from '../data/registry'
import type { CarnalTraitRow } from '../types/tables'

function labelToLikelyId(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Match sexual-history carnal trait labels to table rows (by name, then by slug id). */
export function resolveCarnalTraitLabels(labels: string[]): {
  resolved: CarnalTraitRow[]
  unresolved: string[]
} {
  const byName = new Map(carnalTraits.map((t) => [t.name.toLowerCase(), t]))
  const byId = new Map(carnalTraits.map((t) => [t.id, t]))
  const resolved: CarnalTraitRow[] = []
  const unresolved: string[] = []
  for (const label of labels) {
    const byN = byName.get(label.toLowerCase())
    if (byN) {
      resolved.push(byN)
      continue
    }
    const id = labelToLikelyId(label)
    const byI = byId.get(id)
    if (byI) {
      resolved.push(byI)
      continue
    }
    unresolved.push(label)
  }
  return { resolved, unresolved }
}
