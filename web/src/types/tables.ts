/** Shapes for rows in `src/data/tables/*.json`. */

export interface SpeciesRow {
  id: string
  name: string
  size: string
  speed: number
  carnalTrait: string
  /** Mechanical effect of the species carnal trait (rules text). */
  carnalTraitDescription: string
  eroticGrants: string[]
  description: string
}

export interface SexualHistoryPositionProficiencies {
  tiers: string[]
  specific?: string[]
}

export interface SexualHistoryIdeal {
  text: string
  alignment: string
}

/** Tables for trait / ideal / bond / flaw tied to this sexual history (5e-style). */
export interface SexualHistoryPersonalityTables {
  traits: string[]
  ideals: SexualHistoryIdeal[]
  bonds: string[]
  flaws: string[]
}

export interface SexualHistoryRow {
  id: string
  name: string
  description: string
  eroticArts: string[]
  positionProficiencies: SexualHistoryPositionProficiencies
  carnalTraits: string[]
  /** Keys vary by row (e.g. level1, level3, level5). */
  features: Record<string, string>
  equipment: string[]
  personality: SexualHistoryPersonalityTables
}

export interface CarnalTraitRow {
  id: string
  name: string
  description: string
}

export interface CarnalClassSubclassRow {
  name: string
  description?: string
}

export interface CarnalClassRow {
  id: string
  name: string
  description: string
  hitDie: number
  eroticArts?: string[]
  positionProficiencies?: SexualHistoryPositionProficiencies
  /** Keys vary by class (e.g. level1, level6, level10). */
  features: Record<string, string>
  subclasses: Array<string | CarnalClassSubclassRow>
  domainSpells?: Record<string, Record<string, string>>
  fullFeatures?: Record<string, string>
}

export interface CarnalEquipmentRow {
  id: string
  name: string
  cost: string
  weight: string
  description: string
  category: string
}
