import { describe, expect, it } from 'vitest'
import {
  deriveGenderFromEndowment,
  rollPronounsForGender,
  rollRandomEndowmentForGender,
} from './anatomyGender'
import { PRONOUN_POOLS } from '../data/identityOptions'

describe('deriveGenderFromEndowment', () => {
  it('maps anatomy combinations to gender labels', () => {
    expect(
      deriveGenderFromEndowment({ anatomy: 'phallus', phallusSize: 'Medium', vaginaPresent: false }),
    ).toBe('Male')
    expect(
      deriveGenderFromEndowment({
        anatomy: 'phallus',
        phallusSize: 'Medium',
        vaginaPresent: true,
      }),
    ).toBe('Hermaphrodite')
    expect(
      deriveGenderFromEndowment({ anatomy: 'neither', vaginaPresent: true, vaginaSize: 'Small' }),
    ).toBe('Cuntboy')
    expect(
      deriveGenderFromEndowment({
        anatomy: 'breasts',
        breastsSize: 'Large',
        vaginaPresent: true,
      }),
    ).toBe('Female')
    expect(
      deriveGenderFromEndowment({
        anatomy: 'both',
        breastsSize: 'Medium',
        phallusSize: 'Large',
        vaginaPresent: false,
      }),
    ).toBe('Shemale')
  })

  it('prefers Hermaphrodite when phallus and vagina both present', () => {
    expect(
      deriveGenderFromEndowment({
        anatomy: 'both',
        breastsSize: 'Medium',
        phallusSize: 'Large',
        vaginaPresent: true,
      }),
    ).toBe('Hermaphrodite')
  })
})

describe('rollRandomEndowmentForGender', () => {
  it('builds consistent endowment per gender', () => {
    expect(deriveGenderFromEndowment(rollRandomEndowmentForGender('Male'))).toBe('Male')
    expect(deriveGenderFromEndowment(rollRandomEndowmentForGender('Female'))).toBe('Female')
    expect(deriveGenderFromEndowment(rollRandomEndowmentForGender('Cuntboy'))).toBe('Cuntboy')
    expect(deriveGenderFromEndowment(rollRandomEndowmentForGender('Shemale'))).toBe('Shemale')
    expect(deriveGenderFromEndowment(rollRandomEndowmentForGender('Hermaphrodite'))).toBe(
      'Hermaphrodite',
    )
  })
})

describe('rollPronounsForGender', () => {
  it('returns a pronoun from the gender pool', () => {
    for (const gender of Object.keys(PRONOUN_POOLS) as Array<keyof typeof PRONOUN_POOLS>) {
      expect(PRONOUN_POOLS[gender]).toContain(rollPronounsForGender(gender))
    }
  })
})
