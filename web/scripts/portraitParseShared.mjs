/** Shared portrait filename parsing for sync + manifest scripts. */

/** Portrait filename prefix → species table id (longest prefixes first at runtime). */
export const PORTRAIT_SPECIES_PREFIX_TO_TABLE = {
  dragpmborn: 'dragonborn',
  'drow-evil': 'drow',
  'human-dwarf': 'human',
  dwarf: 'hilldwarf',
  elf: 'highelf',
}

export const CARNAL_CLASS_ROLE_ALIASES = {
  divineconsort: 'divine-consort',
  carnalartificer: 'carnal-artificer',
  lustborn: 'lustbound',
}

export const CARNAL_CLASS_IDS = [
  'courtesan',
  'divine-consort',
  'siren',
  'ravager',
  'lustbound',
  'carnal-artificer',
]

const GENDER_TOKEN_RE = /^(f|m|they)(?:\d+)?$/i

export function normalizeGenderToken(token) {
  const t = token.toLowerCase()
  if (t.startsWith('f')) return 'f'
  if (t.startsWith('m')) return 'm'
  if (t === 'they') return 'they'
  return null
}

export function resolveRoleIdFromTag(tag) {
  const compact = tag.toLowerCase().replace(/[^a-z]/g, '')
  if (!compact) return undefined
  if (CARNAL_CLASS_ROLE_ALIASES[compact]) return CARNAL_CLASS_ROLE_ALIASES[compact]
  for (const id of CARNAL_CLASS_IDS) {
    const idCompact = id.replace(/-/g, '')
    if (compact === idCompact) return id
  }
  return undefined
}

/**
 * @param {string} stem filename without extension, lowercase
 * @param {string[]} speciesPrefixes longest-first species keys
 */
export function parsePortraitStem(stem, speciesPrefixes) {
  const parts = stem.split('-').filter(Boolean)
  if (parts.length < 2) return null

  let genderIdx = -1
  let genderToken = null
  for (let i = 1; i < parts.length; i++) {
    const g = normalizeGenderToken(parts[i])
    if (g) {
      genderIdx = i
      genderToken = g
      break
    }
  }
  if (genderIdx < 1 || !genderToken) return null

  const speciesKey = parts.slice(0, genderIdx).join('-')
  const tags = parts.slice(genderIdx + 1)
  let speciesId = PORTRAIT_SPECIES_PREFIX_TO_TABLE[speciesKey] ?? speciesKey
  if (!speciesPrefixes.includes(speciesKey) && !PORTRAIT_SPECIES_PREFIX_TO_TABLE[speciesKey]) {
    const matched = speciesPrefixes.find((p) => speciesKey === p || speciesKey.startsWith(`${p}-`))
    if (matched) {
      speciesId = PORTRAIT_SPECIES_PREFIX_TO_TABLE[matched] ?? matched
    }
  }

  let roleId
  const variantTags = []
  for (const tag of tags) {
    const role = resolveRoleIdFromTag(tag)
    if (role && !roleId) roleId = role
    else variantTags.push(tag)
  }

  return { speciesKey, speciesId, genderToken, roleId, variantTags, tags }
}

export function buildSpeciesPrefixList(tableSpeciesIds) {
  const extra = Object.keys(PORTRAIT_SPECIES_PREFIX_TO_TABLE)
  const all = [...new Set([...tableSpeciesIds, ...extra])]
  return all.sort((a, b) => b.length - a.length)
}
