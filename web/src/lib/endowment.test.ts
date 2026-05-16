import { describe, expect, it } from 'vitest'
import {
  coerceEndowmentForBiologicalSex,
  formatEndowmentLines,
  getAllowedAnatomiesForBiologicalSex,
  normalizedEndowment,
  phallusAllowedForBiologicalSex,
  vaginaAllowedForBiologicalSex,
} from './endowment'

const FULL = ['neither', 'breasts', 'phallus', 'both'] as const

describe('endowment biology rules', () => {
  it('phallus allowed for Male, Female, and unset biology', () => {
    expect(phallusAllowedForBiologicalSex('Male')).toBe(true)
    expect(phallusAllowedForBiologicalSex('Female')).toBe(true)
    expect(phallusAllowedForBiologicalSex('')).toBe(true)
  })

  it('vagina allowed for Male, Female, and unset biology', () => {
    expect(vaginaAllowedForBiologicalSex('Male')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('Female')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('')).toBe(true)
  })

  it('getAllowedAnatomiesForBiologicalSex is full set for Male and Female', () => {
    expect(getAllowedAnatomiesForBiologicalSex('Female').sort()).toEqual([...FULL].sort())
    expect(getAllowedAnatomiesForBiologicalSex('Male').sort()).toEqual([...FULL].sort())
    expect(getAllowedAnatomiesForBiologicalSex('').sort()).toEqual([...FULL].sort())
  })

  it('coerceEndowmentForBiologicalSex preserves phallus for Female', () => {
    expect(
      coerceEndowmentForBiologicalSex('Female', { anatomy: 'phallus', phallusSize: 'Large' }),
    ).toEqual({
      anatomy: 'phallus',
      phallusSize: 'Large',
    })
  })

  it('coerce preserves both anatomy for Female', () => {
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'both',
        breastsSize: 'Medium',
        phallusSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'both',
      breastsSize: 'Medium',
      phallusSize: 'Large',
    })
  })

  it('coerce preserves vagina when present on Female both', () => {
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'both',
        breastsSize: 'Small',
        phallusSize: 'Large',
        vaginaPresent: true,
        vaginaSize: 'Tiny',
      }),
    ).toEqual({
      anatomy: 'both',
      breastsSize: 'Small',
      phallusSize: 'Large',
      vaginaPresent: true,
      vaginaSize: 'Tiny',
    })
  })

  it('normalizedEndowment keeps vagina for Male when set', () => {
    expect(
      normalizedEndowment('Male', {
        anatomy: 'phallus',
        phallusSize: 'Medium',
        vaginaPresent: true,
        vaginaSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'phallus',
      phallusSize: 'Medium',
      vaginaPresent: true,
      vaginaSize: 'Large',
    })
  })

  it('normalizedEndowment defaults Male vagina absent when unset', () => {
    expect(normalizedEndowment('Male', { anatomy: 'phallus', phallusSize: 'Medium' })).toEqual({
      anatomy: 'phallus',
      phallusSize: 'Medium',
      vaginaPresent: false,
    })
  })

  it('normalizedEndowment defaults Female vagina to present when unset', () => {
    expect(normalizedEndowment('Female', { anatomy: 'breasts', breastsSize: 'Medium' })).toEqual({
      anatomy: 'breasts',
      breastsSize: 'Medium',
      vaginaPresent: true,
    })
  })

  it('formatEndowmentLines includes vagina when present', () => {
    expect(
      formatEndowmentLines({
        anatomy: 'neither',
        vaginaPresent: true,
        vaginaSize: 'Huge',
      }),
    ).toEqual(['No breast or phallus size category (neither).', 'Vagina: Huge.'])
  })
})
