import { isCanonicalBiologicalSex } from '../lib/biologicalSex'
import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'

type SpeciesPortraitProps = {
  speciesId: string
  genderIdentity: string
  /** Accessible label, e.g. display species name */
  alt?: string
  className?: string
  imgClassName?: string
}

/**
 * Default premade art from `public/portraits/` by species table id and biological sex.
 */
export function SpeciesPortrait({
  speciesId,
  genderIdentity,
  alt,
  className,
  imgClassName,
}: SpeciesPortraitProps) {
  if (!isCanonicalBiologicalSex(genderIdentity)) return null
  const src = getDefaultSpeciesPortraitSrc(speciesId, genderIdentity)
  if (!src) return null
  return (
    <div className={className}>
      <img
        className={imgClassName ?? 'species-portrait__img'}
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
