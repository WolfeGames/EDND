/**

 * Domain model for ED&D characters. IDs and string fields will be backed by

 * 5e species / class tables and homebrew data as the app grows.

 */

import type { GenitalTraitId } from './genitalTrait'

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
  /**
   * Optional 1d20 fine measurement for phallus length.
   * Exact inches = category base (min) + die × 0.1" (a 20 adds 2").
   */
  phallusLengthDie?: number
  /** Same 1d6 size categories as breasts/phallus; not used for biological Male in this app. */
  vaginaPresent?: boolean
  vaginaSize?: EndowmentSize
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
   * Player-chosen gender identity (Male, Female, Intersex, Agender).
   * Independent of endowment / genital trait configuration.
   */

  genderIdentity: string

  /** Optional override for sheet/creator art (`/portraits/...`). Falls back to species + gender default. */
  portraitSrc?: string

  /**
   * Body build (Frail…Giant). Adjusts base weight / height and may add Str or Dex to height mod.
   */
  bodyType?: string

  /**
   * Creature size category. Humans, elves, and dwarves may choose Medium or Small;
   * other species use their table default (omitted here).
   */
  creatureSize?: 'Medium' | 'Small'

  /**
   * Continuous paper-doll morph sliders (0–1). When omitted, defaults from body type.
   */
  physiqueMorph?: {
    muscle?: number
    fat?: number
    hipWidth?: number
    legGirth?: number
    breastScale?: number
  }

  /** Total height in inches (adjusted base + effective height modifier). */
  heightInches?: number

  /** Final weight in pounds after body-type base-weight factor and height×weight mods. */
  weightLbs?: number

  /** Raw height-modifier dice total (ability bonuses reapplied from body type + scores). */
  heightModifierRoll?: number

  /** Raw weight-modifier dice/quantity total. */
  weightModifierRoll?: number

  species: SpeciesId

  adventuringClass: AdventuringClassId

  level: number
  abilityScores: AbilityScores
  endowment: EndowmentProfile

  /**
   * Pleasure / refractory / fertility rules (phallic, vaginal, intersex, hermaphrodite).
   * Inferred from biology + endowment when omitted on import.
   */
  genitalTrait?: GenitalTraitId

  /** Changeling, plasmoid, shapeshift spells, etc. — enables Genital Shift in play. */
  hasGenitalShift?: boolean

  /**
   * Fertility bonus for conception: impregnators add this to d20; mothering types subtract
   * this from 20 to set the DC (20 − bonus). Defaults to Con mod + Sexuality bonus when unset.
   */
  fertilityBonus?: number

  background: BackgroundId

  carnalClass?: CarnalClassId

  /** Player-selected carnal traits from class budget (3, or 4 for Courtesan). */
  carnalClassTraitIds?: string[]

  sexualHistory?: SexualHistoryId

  /** Player-selected carnal traits from sexual history budget (1–2). */
  sexualHistoryTraitIds?: string[]

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


