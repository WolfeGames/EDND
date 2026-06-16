/**
 * Name pools distilled from fantasynamegenerators.com generators.
 * Refresh with: npm run names:fetch (when the site is reachable from your network).
 */
export type FngNamePool = {
  given: string[]
  family?: string[]
  /** Tiefling virtue / vice surnames (Honor, Lust, …). */
  virtues?: string[]
}

export type FngNamePoolsFile = {
  source: string
  pools: Record<string, FngNamePool>
  /** Playable species table id → pool key */
  speciesMap: Record<string, string>
}
