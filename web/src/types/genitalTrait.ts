/**
 * Genital configuration drives refractory, overstimulation, and fertility rules.
 * Distinct from endowment sizes (breasts/phallus/vagina) and biological sex (portraits).
 */

export type GenitalTraitId =
  | 'phallic'
  | 'vaginal'
  | 'cuntboy'
  | 'shemale'
  | 'hermaphrodite'

/** Which pleasure/refractory track is affected (hermaphrodites have both). */
export type GenitalTrack = 'phallic' | 'vaginal'

export interface GenitalTraitDefinition {
  id: GenitalTraitId
  label: string
  summary: string
  /** Shown on hover / detail panel in character creator. */
  tooltip: string
  defaultForBiologicalSex?: 'Male' | 'Female'
  /** Active refractory/overstim tracks for this trait. */
  tracks: GenitalTrack[]
  usesPhallicRules: boolean
  usesVaginalRules: boolean
  /** Can apply fertility bonus when impregnating another creature. */
  canImpregnateOthers: boolean
  /** Fertility bonus sets DC when this creature is impregnated. */
  setsImpregnationDc: boolean
}
