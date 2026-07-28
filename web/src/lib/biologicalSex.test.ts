import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  normalizeCharacterBiology,
  portraitBinaryForGender,
  sanitizeGenderForApp,
} from './biologicalSex'

describe('sanitizeGenderForApp', () => {
  it('keeps identity gender labels', () => {
    expect(sanitizeGenderForApp('Male')).toBe('Male')
    expect(sanitizeGenderForApp('Female')).toBe('Female')
    expect(sanitizeGenderForApp('Intersex')).toBe('Intersex')
    expect(sanitizeGenderForApp('Agender')).toBe('Agender')
  })

  it('maps legacy labels', () => {
    expect(sanitizeGenderForApp('Hermaphrodite')).toBe('Intersex')
    expect(sanitizeGenderForApp('Cuntboy')).toBe('Male')
    expect(sanitizeGenderForApp('Shemale')).toBe('Female')
    expect(sanitizeGenderForApp('Transgender')).toBe('Male')
    expect(sanitizeGenderForApp('Nonbinary')).toBe('Agender')
  })

  it('clears unknown values', () => {
    expect(sanitizeGenderForApp('Other')).toBe('')
    expect(sanitizeGenderForApp('')).toBe('')
  })
})

describe('portraitBinaryForGender', () => {
  it('maps genders to portrait pairs', () => {
    expect(portraitBinaryForGender('Male')).toBe('Male')
    expect(portraitBinaryForGender('Female')).toBe('Female')
    expect(portraitBinaryForGender('Intersex')).toBeNull()
    expect(portraitBinaryForGender('Agender')).toBeNull()
    expect(portraitBinaryForGender('Cuntboy')).toBe('Male')
    expect(portraitBinaryForGender('Shemale')).toBe('Female')
    expect(portraitBinaryForGender('Hermaphrodite')).toBeNull()
  })
})

describe('normalizeCharacterBiology', () => {
  it('preserves chosen gender independent of endowment', () => {
    const c = createEmptyCharacter()
    c.genderIdentity = 'Female'
    c.endowment = { anatomy: 'phallus', phallusSize: 'Medium', vaginaPresent: false }
    const out = normalizeCharacterBiology(c)
    expect(out.genderIdentity).toBe('Female')
    expect(out.endowment.anatomy).toBe('phallus')
  })
})
