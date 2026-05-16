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
  /** Thematic summary (from bundle overlay when present). */
  description: string
  /** Optional: points budget for history-granted carnal traits, etc. */
  traitPoints?: number
  eroticArts: string[]
  positionProficiencies: SexualHistoryPositionProficiencies
  toolProficiencies?: string[]
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

export interface CarnalClassFeatureObject {
  name: string
  description: string
}

export interface CarnalEntityRow {
  name: string
  features: string[]
}

export interface CarnalClassRow {
  id: string
  name: string
  description: string
  hitDie: number
  primarySexualAbility?: string
  sexDie?: string
  startingPleasurePoints?: string
  savingThrowProficiencies?: string[]
  stimulationProficiencies?: string[]
  eroticAptitude?: string
  eroticArts?: string[]
  positionProficiencies?: SexualHistoryPositionProficiencies
  toolProficiencies?: string[]
  startingEquipment?: Record<string, string>
  /** Keys vary by class (e.g. level1, level6, level10). */
  features: Record<string, string | CarnalClassFeatureObject>
  drives?: Record<string, Record<string, string>>
  carnalEntities?: Record<string, CarnalEntityRow>
  carnalBoons?: Record<string, string[]>
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
