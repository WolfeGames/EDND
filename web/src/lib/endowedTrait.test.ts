import { describe, expect, it } from 'vitest'
import { createEmptyCharacter, type EdndCharacter, type EndowmentProfile } from '../types/character'
import {
  applyEndowedToEndowment,
  bumpEndowmentSizeOneTier,
  characterHasEndowedTrait,
  getSheetEndowmentProfile,
} from './endowedTrait'

describe('Endowed trait sizing', () => {
  it('bumps one tier and caps at Gargantuan', () => {
    expect(bumpEndowmentSizeOneTier('Small')).toBe('Medium')
    expect(bumpEndowmentSizeOneTier('Gargantuan')).toBe('Gargantuan')
  })

  it('applyEndowed bumps breasts and phallus when present', () => {
    const e: EndowmentProfile = {
      anatomy: 'both',
      breastsSize: 'Medium',
      phallusSize: 'Large',
    }
    expect(applyEndowedToEndowment(e, true)).toEqual({
      anatomy: 'both',
      breastsSize: 'Large',
      phallusSize: 'Huge',
    })
    expect(applyEndowedToEndowment(e, false)).toEqual(e)
  })

  it('detects Endowed from resolved sexual history carnal traits', () => {
    const withTrait = { sexualHistory: 'breeding-stock' } as EdndCharacter
    const without = { sexualHistory: 'courtesan' } as EdndCharacter
    expect(characterHasEndowedTrait(withTrait)).toBe(true)
    expect(characterHasEndowedTrait(without)).toBe(false)
    expect(characterHasEndowedTrait({ sexualHistory: '' } as EdndCharacter)).toBe(false)
  })

  it('getSheetEndowmentProfile applies Endowed after biology normalization', () => {
    const c = createEmptyCharacter()
    c.genderIdentity = 'Female'
    c.sexualHistory = 'breeding-stock'
    c.endowment = {
      anatomy: 'breasts',
      breastsSize: 'Medium',
      vaginaPresent: true,
      vaginaSize: 'Small',
    }
    expect(getSheetEndowmentProfile(c).breastsSize).toBe('Large')
    expect(getSheetEndowmentProfile(c).vaginaSize).toBe('Small')
  })
})
