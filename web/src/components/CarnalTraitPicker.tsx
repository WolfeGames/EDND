import { getCarnalTrait } from '../data/registry'
import {
  type CarnalTraitPickContext,
  traitsForPickContext,
} from '../lib/carnalTraitSelection'
import type { CarnalTraitRow } from '../types/tables'
import './CarnalTraitPicker.css'

type CarnalTraitPickerProps = {
  context: CarnalTraitPickContext
  speciesId: string
  carnalClassId: string
  sexualHistoryId: string
  selectedIds: string[]
  maxSlots: number
  lede: string
  onChange: (ids: string[]) => void
}

function sourceHint(trait: CarnalTraitRow): string | null {
  const s = trait.sources
  if (!s?.exclusive) return null
  const parts: string[] = []
  if (s.carnalClassIds?.length) parts.push('class')
  if (s.sexualHistoryIds?.length) parts.push('history')
  if (s.speciesIds?.length) parts.push('species')
  if (!parts.length) return null
  return `Exclusive (${parts.join(', ')})`
}

export function CarnalTraitPicker({
  context,
  speciesId,
  carnalClassId,
  sexualHistoryId,
  selectedIds,
  maxSlots,
  lede,
  onChange,
}: CarnalTraitPickerProps) {
  const pool = traitsForPickContext(context, speciesId, carnalClassId, sexualHistoryId)

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
      return
    }
    if (selectedIds.length >= maxSlots) return
    onChange([...selectedIds, id])
  }

  return (
    <div className="carnal-trait-picker">
      <p className="carnal-trait-picker__lede muted">{lede}</p>
      <p className="carnal-trait-picker__meta">
        <strong>
          {selectedIds.length} / {maxSlots}
        </strong>{' '}
        selected
      </p>
      <div className="carnal-trait-picker__grid" role="list">
        {pool.map((trait) => {
          const selected = selectedIds.includes(trait.id)
          const full = !selected && selectedIds.length >= maxSlots
          const hint = sourceHint(trait)
          return (
            <button
              key={trait.id}
              type="button"
              role="listitem"
              className={`carnal-trait-picker__card${selected ? ' carnal-trait-picker__card--selected' : ''}${full ? ' carnal-trait-picker__card--disabled' : ''}`}
              onClick={() => toggle(trait.id)}
              disabled={full}
              aria-pressed={selected}
              title={trait.description}
            >
              <span className="carnal-trait-picker__name">{trait.name}</span>
              {hint ? <span className="carnal-trait-picker__tag">{hint}</span> : null}
              <span className="carnal-trait-picker__desc">{trait.description}</span>
            </button>
          )
        })}
      </div>
      {selectedIds.length > 0 && (
        <ul className="carnal-trait-picker__chosen muted">
          {selectedIds.map((id) => {
            const t = getCarnalTrait(id)
            return <li key={id}>{t?.name ?? id}</li>
          })}
        </ul>
      )}
    </div>
  )
}
