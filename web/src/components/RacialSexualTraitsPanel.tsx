import {
  formatRacialTraitBody,
  getRacialSexualTraitSections,
} from '../lib/racialSexualTraits'
import './RacialSexualTraitsPanel.css'

type Props = {
  speciesId: string
  /** e.g. immersive-subheading, sheet-section-title */
  headingClassName?: string
  /** Extra wrapper class for layout in parent */
  className?: string
  /** Class on each ancestry block (default: immersive-panel on summary) */
  groupClassName?: string
}

export function RacialSexualTraitsPanel({
  speciesId,
  headingClassName = 'immersive-subheading',
  className,
  groupClassName = 'immersive-panel',
}: Props) {
  const sections = getRacialSexualTraitSections(speciesId)
  if (sections.length === 0) return null

  return (
    <div className={className ? `racial-traits ${className}` : 'racial-traits'}>
      <h4 className={headingClassName}>Racial sexual traits</h4>
      <p className="racial-traits__lede muted">
        Shared ancestry features apply first; subrace entries add only what is listed for that
        lineage.
      </p>
      {sections.map((sec) => (
        <div key={sec.groupId} className={`racial-traits__group ${groupClassName}`}>
          <h5 className="racial-traits__group-title">{sec.name}</h5>
          <p className="racial-traits__theme muted">{sec.theme}</p>
          <ul className="racial-traits__list">
            {sec.traits.map((t) => (
              <li key={t.name} className="racial-traits__item">
                <strong className="racial-traits__name">{t.name}</strong>
                <p className="feature-body racial-traits__body">{formatRacialTraitBody(t)}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
