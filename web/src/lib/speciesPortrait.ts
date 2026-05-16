import { isCanonicalBiologicalSex, sanitizeBiologicalSexForApp } from './biologicalSex'
import { resolveSpeciesPortraitId } from './speciesAliases'

/** Portrait paths under `public/portraits/`; keys are species table ids (see species.json). */
const PAIRED: Record<string, { male: string; female: string }> = {
  aasimar: { male: '/portraits/aasimar-male.jpg', female: '/portraits/aasimar-female.jpg' },
  airgenasi: { male: '/portraits/airgenasi-male.jpg', female: '/portraits/airgenasi-female.jpg' },
  bugbear: { male: '/portraits/bugbear-male.png', female: '/portraits/bugbear-female.png' },
  centaur: { male: '/portraits/centaur-male.jpg', female: '/portraits/centaur-female.png' },
  dragonborn: { male: '/portraits/dragonborn-male.png', female: '/portraits/dragonborn-female.png' },
  drow: { male: '/portraits/drow-male.png', female: '/portraits/drow-female.png' },
  duergar: { male: '/portraits/duergar-male.png', female: '/portraits/duergar-female.png' },
  earthgenasi: { male: '/portraits/earthgenasi-male.jpg', female: '/portraits/earthgenasi-female.jpg' },
  firbolg: { male: '/portraits/firbolg-male.jpg', female: '/portraits/firbolg-female.jpg' },
  firegenasi: { male: '/portraits/firegenasi-male.jpg', female: '/portraits/firegenasi-female.jpg' },
  gnome: { male: '/portraits/gnome-male.jpg', female: '/portraits/gnome-female.jpg' },
  goblin: { male: '/portraits/goblin-male.png', female: '/portraits/goblin-female.png' },
  goliath: { male: '/portraits/goliath-male.jpg', female: '/portraits/goliath-female.jpg' },
  halfling: { male: '/portraits/halfling-male.png', female: '/portraits/halfling-female.png' },
  highelf: { male: '/portraits/highelf-male.png', female: '/portraits/highelf-female.png' },
  hilldwarf: { male: '/portraits/hilldwarf-male.png', female: '/portraits/hilldwarf-female.png' },
  hobgoblin: { male: '/portraits/hobgoblin-male.png', female: '/portraits/hobgoblin-female.png' },
  human: { male: '/portraits/human-male.png', female: '/portraits/human-female.png' },
  minotaur: { male: '/portraits/minotaur-male.jpg', female: '/portraits/minotaur-female.jpg' },
  mountaindwarf: { male: '/portraits/mountaindwarf-male.png', female: '/portraits/mountaindwarf-female.jpg' },
  orc: { male: '/portraits/orc-male.jpg', female: '/portraits/orc-female.jpg' },
  tabaxi: { male: '/portraits/tabaxi-male.jpg', female: '/portraits/tabaxi-female.jpg' },
  tiefling: { male: '/portraits/tiefling-male.jpg', female: '/portraits/tiefling-female.jpg' },
  watergenasi: { male: '/portraits/watergenasi-male.jpg', female: '/portraits/watergenasi-female.jpg' },
  woodelf: { male: '/portraits/woodelf-male.png', female: '/portraits/woodelf-female.png' },
}

const UNISEX: Record<string, string> = {
  satyr: '/portraits/satyr.jpg',
}

/**
 * Default premade portrait for a species + biological sex.
 * Only Male/Female select paired art; anything else returns null (no silent mismatch).
 */
export function getDefaultSpeciesPortraitSrc(
  speciesId: string,
  genderIdentity: string,
): string | null {
  const id = resolveSpeciesPortraitId(speciesId)
  if (!id) return null
  const uni = UNISEX[id]
  if (uni) return uni
  const pair = PAIRED[id]
  if (!pair) return null
  const g = sanitizeBiologicalSexForApp(genderIdentity)
  if (!isCanonicalBiologicalSex(g)) return null
  return g === 'Male' ? pair.male : pair.female
}

export function speciesHasPortrait(speciesId: string): boolean {
  const id = resolveSpeciesPortraitId(speciesId)
  return Boolean(UNISEX[id] || PAIRED[id])
}
