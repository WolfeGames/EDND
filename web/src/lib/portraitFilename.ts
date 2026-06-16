import { portraitBinaryForGender } from './biologicalSex'
import { portraitSpeciesLookupOrder } from './portraitSpeciesFallback'

export type PortraitGenderToken = 'f' | 'm' | 'they'

export type PortraitManifestEntry = {
  filename: string
  src: string
  speciesId: string
  genderToken: PortraitGenderToken
  roleId?: string
  variantTags: string[]
  label: string
}

/** Portrait art gender token matches character gender for filtering. */
export function portraitMatchesGender(
  genderToken: PortraitGenderToken,
  genderIdentity: string,
): boolean {
  if (genderToken === 'they') return true
  const binary = portraitBinaryForGender(genderIdentity)
  if (!binary) return true
  if (genderToken === 'f') return binary === 'Female'
  if (genderToken === 'm') return binary === 'Male'
  return false
}

export function filterPortraitsForCharacter(
  entries: PortraitManifestEntry[],
  speciesId: string,
  genderIdentity: string,
  carnalClassId?: string,
): PortraitManifestEntry[] {
  const lookupOrder = portraitSpeciesLookupOrder(speciesId)
  if (!lookupOrder.length) return []

  for (const id of lookupOrder) {
    const bySpecies = entries.filter((e) => e.speciesId === id)
    const byGender = bySpecies.filter((e) => portraitMatchesGender(e.genderToken, genderIdentity))
    if (!byGender.length) continue

    if (!carnalClassId?.trim()) return byGender
    const cls = carnalClassId.trim()
    const withRole = byGender.filter((e) => e.roleId === cls)
    return withRole.length > 0 ? withRole : byGender
  }

  return []
}

/** Prefer base species+gender portraits (no role/variant tags). */
export function pickDefaultPortraitEntry(
  pool: PortraitManifestEntry[],
): PortraitManifestEntry | undefined {
  if (!pool.length) return undefined
  const base = pool.filter((e) => !e.roleId && e.variantTags.length === 0)
  const candidates = base.length > 0 ? base : pool
  return [...candidates].sort((a, b) => a.filename.localeCompare(b.filename))[0]
}

export function pickRandomPortraitEntry(
  pool: PortraitManifestEntry[],
): PortraitManifestEntry | undefined {
  if (!pool.length) return undefined
  return pool[Math.floor(Math.random() * pool.length)]
}
