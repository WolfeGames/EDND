/**

 * Domain model for ED&D characters. IDs and string fields will be backed by

 * 5e species / class tables and homebrew data as the app grows.

 */



export type SpeciesId = string

export type AdventuringClassId = string

export type BackgroundId = string

export type CarnalClassId = string

export type SexualHistoryId = string



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

  /** Narrative or mechanical tier — align with your Beauty Class rules later. */

  beautyClass: string

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

  /** Gender and gender identity (preset label or custom text). */

  genderIdentity: string

  species: SpeciesId

  adventuringClass: AdventuringClassId

  level: number

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

    beautyClass: '',

    sexualityBonus: 0,

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

    background: '',

    carnalFeatures: [],

    eroticTraits: createEmptyEroticTraits(),

  }

}


