import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import { normalizeCharacterBiology, sanitizeBiologicalSexForApp } from './biologicalSex'

describe('sanitizeBiologicalSexForApp', () => {
  it('keeps Male and Female', () => {
    expect(sanitizeBiologicalSexForApp('Male')).toBe('Male')
    expect(sanitizeBiologicalSexForApp('Female')).toBe('Female')
  })

  it('maps legacy labels to binary defaults', () => {
    expect(sanitizeBiologicalSexForApp('Transgender')).toBe('Male')
    expect(sanitizeBiologicalSexForApp('Nonbinary')).toBe('Female')
  })

  it('clears unknown values', () => {
    expect(sanitizeBiologicalSexForApp('Other')).toBe('')
    expect(sanitizeBiologicalSexForApp('')).toBe('')
  })
})

describe('normalizeCharacterBiology', () => {
  it('sanitizes gender and re-normalizes endowment', () => {
    const c = createEmptyCharacter()
    c.genderIdentity = 'Transgender'
    c.endowment = { anatomy: 'phallus', phallusSize: 'Medium' }
    const out = normalizeCharacterBiology(c)
    expect(out.genderIdentity).toBe('Male')
    expect(out.endowment.anatomy).toBe('phallus')
  })

  it('strips breast endowment when biology is Male', () => {
    const c = createEmptyCharacter()
    c.genderIdentity = 'Male'
    c.endowment = { anatomy: 'breasts', breastsSize: 'Large' }
    const out = normalizeCharacterBiology(c)
    expect(out.endowment.anatomy).toBe('phallus')
    expect(out.endowment.breastsSize).toBeUndefined()
  })
})
