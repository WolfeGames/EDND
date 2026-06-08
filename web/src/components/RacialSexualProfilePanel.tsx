import {
  formatFeatureName,
  formatSpecialFeatureValue,
  getPrimarySexualType,
  getRacialProfileSheetMechanics,
  getRacialSexualProfileGeneralNotes,
  getRacialSexualProfileSections,
} from '../lib/racialSexualProfiles'
import './RacialSexualProfilePanel.css'

type Props = {
  speciesId: string
  headingClassName?: string
  className?: string
  groupClassName?: string
  /** Show glossary lede on first mount (creator). */
  showGlossaryIntro?: boolean
}

export function RacialSexualProfilePanel({
  speciesId,
  headingClassName = 'immersive-subheading',
  className,
  groupClassName = 'immersive-panel',
  showGlossaryIntro = false,
}: Props) {
  const sections = getRacialSexualProfileSections(speciesId)
  if (sections.length === 0) return null

  const sexualType = getPrimarySexualType(speciesId)
  const mechanics = getRacialProfileSheetMechanics(speciesId)
  const hasMechanics =
    mechanics.beautyClassBonus > 0 ||
    mechanics.fertilityNotes.length > 0 ||
    mechanics.pleasureNotes.length > 0 ||
    mechanics.saveNotes.length > 0

  return (
    <div className={className ? `racial-profile ${className}` : 'racial-profile'}>
      <h4 className={headingClassName}>Racial sexual glossary</h4>
      {showGlossaryIntro && (
        <p className="racial-profile__lede muted">{getRacialSexualProfileGeneralNotes()}</p>
      )}
      {sexualType && (
        <p className="racial-profile__type">
          <span className="racial-profile__type-badge">{sexualType} sexual type</span>
        </p>
      )}

      {hasMechanics && (
        <div className="racial-profile__mechanics">
          <h5 className="racial-profile__mechanics-title">Mechanical highlights</h5>
          <ul className="racial-profile__mechanics-list">
            {mechanics.beautyClassBonus > 0 && (
              <li>
                <strong>Beauty class</strong> +{mechanics.beautyClassBonus}
                {mechanics.beautyClassNote ? ` — ${mechanics.beautyClassNote}` : ''}
              </li>
            )}
            {mechanics.fertilityNotes.map((n) => (
              <li key={n.slice(0, 24)}>{n}</li>
            ))}
            {mechanics.pleasureNotes.map((n) => (
              <li key={n.slice(0, 24)}>{n}</li>
            ))}
            {mechanics.saveNotes.map((n) => (
              <li key={n.slice(0, 24)}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {sections.map(({ raceKey, profile, isSubrace }) => (
        <article
          key={raceKey}
          className={`racial-profile__group ${groupClassName}${isSubrace ? ' racial-profile__group--subrace' : ''}`}
        >
          <h5 className="racial-profile__group-title">
            {formatFeatureName(raceKey)}
            {profile.parentRace && (
              <span className="racial-profile__parent muted"> · {profile.parentRace} ancestry</span>
            )}
          </h5>
          {profile.sexualType && !isSubrace && (
            <p className="racial-profile__meta muted">Sexual type: {profile.sexualType}</p>
          )}
          {profile.coreAttitude && (
            <p className="racial-profile__body">{profile.coreAttitude}</p>
          )}
          {profile.orientationAndDuty && (
            <details className="racial-profile__details">
              <summary>Orientation &amp; duty</summary>
              <p>{profile.orientationAndDuty}</p>
            </details>
          )}
          {profile.specialFeatures && Object.keys(profile.specialFeatures).length > 0 && (
            <div className="racial-profile__features">
              <h6 className="racial-profile__features-title">Special features</h6>
              <ul className="racial-profile__features-list">
                {Object.entries(profile.specialFeatures).map(([key, value]) => (
                  <li key={key}>
                    <strong>{formatFeatureName(key)}</strong>
                    <p>{formatSpecialFeatureValue(value)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {profile.pregnancy && (
            <details className="racial-profile__details">
              <summary>Pregnancy &amp; birth</summary>
              <p>{profile.pregnancy}</p>
            </details>
          )}
          {profile.family && (
            <details className="racial-profile__details">
              <summary>Family &amp; parenting</summary>
              <p>{profile.family}</p>
            </details>
          )}
          {profile.interracial && (
            <details className="racial-profile__details">
              <summary>Interracial relations</summary>
              <p>{profile.interracial}</p>
            </details>
          )}
        </article>
      ))}
    </div>
  )
}
