import { carnalClassTraitSelectionLabel } from './carnalTraitSelection'
import type { CarnalClassRow } from '../types/tables'

export type CarnalClassTraitNote = {
  at: string
  note: string
}

/** Trait selection budget and automatic class-feature trait mentions. */
export function getCarnalClassTraitNotes(row: CarnalClassRow): CarnalClassTraitNote[] {
  const notes: CarnalClassTraitNote[] = [
    {
      at: 'Trait selection',
      note: carnalClassTraitSelectionLabel(row.id),
    },
  ]

  for (const [, value] of Object.entries(row.features)) {
    const text = typeof value === 'string' ? value : `${value.name}: ${value.description}`
    const lower = text.toLowerCase()
    if (
      lower.includes('trait') &&
      (lower.includes('gain') || lower.includes('choose') || lower.includes('multilover'))
    ) {
      notes.push({
        at: 'Class feature (automatic)',
        note: text,
      })
    }
  }

  if (row.drives) {
    for (const drive of Object.values(row.drives)) {
      for (const [key, text] of Object.entries(drive)) {
        if (key === 'name' || key === 'description') continue
        if (text.toLowerCase().includes('trait')) {
          notes.push({ at: 'Drive feature (automatic)', note: text })
        }
      }
    }
  }

  if (row.carnalEntities) {
    const names = Object.values(row.carnalEntities)
      .map((e) => e.name)
      .join(', ')
    notes.push({
      at: 'Level 3 — Carnal Pact (automatic)',
      note: `Choose one Carnal Entity: ${names}.`,
    })
  }

  return notes
}
