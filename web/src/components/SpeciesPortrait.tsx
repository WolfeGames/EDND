import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'

type SpeciesPortraitProps = {
  speciesId?: string
  genderIdentity?: string
  /** When set, overrides species + gender default. */
  src?: string | null
  /** Accessible label, e.g. display species name */
  alt?: string
  className?: string
  imgClassName?: string
}

export function SpeciesPortrait({
  speciesId,
  genderIdentity,
  src,
  alt,
  className,
  imgClassName,
}: SpeciesPortraitProps) {
  const resolved =
    src ??
    (speciesId && genderIdentity
      ? getDefaultSpeciesPortraitSrc(speciesId, genderIdentity)
      : null)
  if (!resolved) return null
  return (
    <div className={className}>
      <img
        className={imgClassName ?? 'species-portrait__img'}
        src={resolved}
        alt={alt ?? ''}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
