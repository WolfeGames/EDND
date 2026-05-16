import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'

type SpeciesPortraitProps = {
  speciesId: string
  genderIdentity: string
  className?: string
  imgClassName?: string
}

/**
 * Default premade art from `public/portraits/` by species table id and biological sex.
 */
export function SpeciesPortrait({
  speciesId,
  genderIdentity,
  className,
  imgClassName,
}: SpeciesPortraitProps) {
  const src = getDefaultSpeciesPortraitSrc(speciesId, genderIdentity)
  if (!src) return null
  return (
    <div className={className}>
      <img
        className={imgClassName ?? 'species-portrait__img'}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
