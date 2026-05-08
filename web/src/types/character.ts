/**

 * Domain model for ED&D characters. IDs and string fields will be backed by

 * 5e species / class tables and homebrew data as the app grows.

 */



export type SpeciesId = string

export type AdventuringClassId = string

export type BackgroundId = string

export type CarnalClassId = string

export type SexualHistoryId = string

export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export type EndowmentSize =
  | 'Tiny'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'Huge'
  | 'Gargantuan'

export type EndowmentAnatomy = 'neither' | 'breasts' | 'phallus' | 'both'

export interface EndowmentProfile {
  anatomy: EndowmentAnatomy
  breastsSize?: EndowmentSize
  phallusSize?: EndowmentSize
}



/** Chosen or rolled from the active sexual history's personality tables. */

export interface SexualHistoryPersonality {

  trait: string

  ideal: string

  bond: string

  flaw: string

}



/** Proficiencies and tags tied to carnal activity (from your homebrew). */

export interface EroticTraits {

  carnalSkillProficiencies: string[]

  positionProficiencies: string[]

  eroticToolProficiencies: string[]

  /** Calculated: 10 + highest ability mod + modifiers. */
  beautyClass: number

  /** Other modifiers from features, gear, magic, etc. */
  beautyModifier: number

  /** Numeric or rules-defined bonus; keep flexible until mechanics are wired. */

  sexualityBonus: number

  /** Free text or structured tags later: who the character is attracted to. */

  attraction: string

  /** Who or what they are not attracted to / repulsed by. */

  repulsion: string

  /** Label + behavior hooks for your sexual morality system. */

  sexualMorality: string

  /** Orientation and related detail for play. */

  orientation: string

}



export interface EdndCharacter {

  id: string

  name: string

  /** e.g. she/her, they/them — any string the player prefers. */

  pronouns: string

  /**
   * Biological sex for body/endowment rules (Male, Female, Nonbinary, Transgender).
   * Pronouns and social identity are separate; phallus endowment is only for Male or Transgender.
   */

  genderIdentity: string

  species: SpeciesId

  adventuringClass: AdventuringClassId

  level: number
  abilityScores: AbilityScores
  endowment: EndowmentProfile

  background: BackgroundId

  carnalClass?: CarnalClassId

  sexualHistory?: SexualHistoryId

  /** From sexual history tables; cleared when history changes. */

  sexualHistoryPersonality?: SexualHistoryPersonality

  /** Carnal / adventuring features specific to erotic play — expand as you define them. */

  carnalFeatures: string[]

  eroticTraits: EroticTraits

}



export function createEmptyEroticTraits(): EroticTraits {

  return {

    carnalSkillProficiencies: [],

    positionProficiencies: [],

    eroticToolProficiencies: [],

    beautyClass: 10,
    beautyModifier: 0,

    sexualityBonus: 2,

    attraction: '',

    repulsion: '',

    sexualMorality: '',

    orientation: '',

  }

}



export function createEmptyCharacter(): EdndCharacter {

  return {

    id: crypto.randomUUID(),

    name: '',

    pronouns: '',

    genderIdentity: '',

    species: '',

    adventuringClass: '',

    level: 1,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    endowment: {
      anatomy: 'neither',
    },

    background: '',

    carnalFeatures: [],

    eroticTraits: createEmptyEroticTraits(),

  }

}


