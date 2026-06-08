import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  normalizeCharacterBiology,
  portraitBinaryForGender,
  sanitizeGenderForApp,
} from './biologicalSex'

describe('sanitizeGenderForApp', () => {
  it('keeps anatomy gender labels', () => {
    expect(sanitizeGenderForApp('Male')).toBe('Male')
    expect(sanitizeGenderForApp('Hermaphrodite')).toBe('Hermaphrodite')
    expect(sanitizeGenderForApp('Cuntboy')).toBe('Cuntboy')
    expect(sanitizeGenderForApp('Female')).toBe('Female')
    expect(sanitizeGenderForApp('Shemale')).toBe('Shemale')
  })

  it('maps legacy labels', () => {
    expect(sanitizeGenderForApp('Transgender')).toBe('Male')
    expect(sanitizeGenderForApp('Nonbinary')).toBe('Female')
  })

  it('clears unknown values', () => {
    expect(sanitizeGenderForApp('Other')).toBe('')
    expect(sanitizeGenderForApp('')).toBe('')
  })
})

describe('portraitBinaryForGender', () => {
  it('maps genders to portrait pairs', () => {
    expect(portraitBinaryForGender('Male')).toBe('Male')
    expect(portraitBinaryForGender('Cuntboy')).toBe('Male')
    expect(portraitBinaryForGender('Female')).toBe('Female')
    expect(portraitBinaryForGender('Shemale')).toBe('Female')
    expect(portraitBinaryForGender('Hermaphrodite')).toBe('Female')
  })
})

describe('normalizeCharacterBiology', () => {
  it('derives gender from endowment', () => {
    const c = createEmptyCharacter()
    c.genderIdentity = 'Female'
    c.endowment = { anatomy: 'phallus', phallusSize: 'Medium', vaginaPresent: false }
    const out = normalizeCharacterBiology(c)
    expect(out.genderIdentity).toBe('Male')
    expect(out.endowment.anatomy).toBe('phallus')
  })
})
