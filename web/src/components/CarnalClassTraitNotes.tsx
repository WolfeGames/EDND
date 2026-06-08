import { getCarnalClassTraitNotes } from '../lib/carnalClassTraitNotes'
import type { CarnalClassRow } from '../types/tables'
import './CarnalClassTraitNotes.css'

type Props = {
  row: CarnalClassRow
  headingClassName?: string
  className?: string
}

export function CarnalClassTraitNotes({ row, headingClassName, className }: Props) {
  const notes = getCarnalClassTraitNotes(row)
  if (notes.length === 0) return null

  return (
    <div className={className ? `carnal-trait-notes ${className}` : 'carnal-trait-notes'}>
      <h4 className={headingClassName ?? 'carnal-trait-notes__title'}>Traits &amp; selections</h4>
      <ul className="carnal-trait-notes__list">
        {notes.map((n) => (
          <li key={`${n.at}-${n.note}`}>
            <strong>{n.at}</strong> — {n.note}
          </li>
        ))}
      </ul>
    </div>
  )
}
