import { getCarnalTrait } from '../data/registry'
import type { CarnalTraitRow } from '../types/tables'
import './SelectedCarnalTraitsPanel.css'

type Props = {
  title: string
  traitIds: string[]
  emptyMessage?: string
  headingClassName?: string
  className?: string
}

function resolveTraits(ids: string[]): CarnalTraitRow[] {
  return ids.map((id) => getCarnalTrait(id)).filter((t): t is CarnalTraitRow => Boolean(t))
}

export function SelectedCarnalTraitsPanel({
  title,
  traitIds,
  emptyMessage = 'None selected.',
  headingClassName,
  className,
}: Props) {
  const traits = resolveTraits(traitIds)
  if (traits.length === 0) {
    return (
      <div className={className ? `selected-carnal-traits ${className}` : 'selected-carnal-traits'}>
        <h4 className={headingClassName ?? 'selected-carnal-traits__title'}>{title}</h4>
        <p className="muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={className ? `selected-carnal-traits ${className}` : 'selected-carnal-traits'}>
      <h4 className={headingClassName ?? 'selected-carnal-traits__title'}>{title}</h4>
      <ul className="selected-carnal-traits__list">
        {traits.map((t) => (
          <li key={t.id} className="selected-carnal-traits__item" title={t.description}>
            <strong>{t.name}</strong>
            <span className="selected-carnal-traits__desc">{t.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
