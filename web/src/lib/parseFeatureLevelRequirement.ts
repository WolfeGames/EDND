/**
 * Parse `levelN` keys from sexual history / carnal class feature objects.
 * Returns required character level, or null if the key is not a level gate.
 */
export function parseFeatureLevelRequirement(key: string): number | null {
  const m = key.match(/^level(\d+)$/i)
  return m ? Number(m[1]) : null
}
