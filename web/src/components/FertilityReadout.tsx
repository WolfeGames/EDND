import { getFertilityProfile } from '../mechanics/fertilityEngine'
import type { EdndCharacter } from '../types/character'
import './FertilityReadout.css'

type Props = {
  character: EdndCharacter
  className?: string
}

export function FertilityReadout({ character, className }: Props) {
  const profile = getFertilityProfile(character)

  return (
    <div className={className ? `fertility-readout ${className}` : 'fertility-readout'}>
      <h4 className="fertility-readout__title">Fertility</h4>
      <p className="fertility-readout__bonus">
        Fertility bonus: <strong>+{profile.fertilityBonus}</strong>
      </p>
      {profile.isMothering && (
        <p className="fertility-readout__dc">
          Conception DC (20 − fertility bonus):{' '}
          <strong>{profile.conceptionDc}</strong>
          <span className="muted"> — {profile.conceptionDcFormula}</span>
        </p>
      )}
      {profile.canImpregnate && (
        <p className="fertility-readout__roll muted">
          When impregnating: roll <strong>{profile.impregnatorRollFormula}</strong> vs the
          mothering partner&apos;s DC.
        </p>
      )}
      {!profile.isMothering && !profile.canImpregnate && (
        <p className="muted fertility-readout__note">
          This genital configuration does not set impregnation DC or impregnate others under
          standard rules.
        </p>
      )}
    </div>
  )
}
