import { describe, expect, it } from 'vitest'
import {
  coerceEndowmentForBiologicalSex,
  formatEndowmentLines,
  getAllowedAnatomiesForBiologicalSex,
  normalizedEndowment,
  phallusAllowedForBiologicalSex,
  vaginaAllowedForBiologicalSex,
} from './endowment'

describe('endowment biology rules', () => {
  it('phallus allowed only for Male and Transgender', () => {
    expect(phallusAllowedForBiologicalSex('Male')).toBe(true)
    expect(phallusAllowedForBiologicalSex('Transgender')).toBe(true)
    expect(phallusAllowedForBiologicalSex('Female')).toBe(false)
    expect(phallusAllowedForBiologicalSex('Nonbinary')).toBe(false)
    expect(phallusAllowedForBiologicalSex('')).toBe(true)
  })

  it('vagina allowed except for biological Male', () => {
    expect(vaginaAllowedForBiologicalSex('Male')).toBe(false)
    expect(vaginaAllowedForBiologicalSex('Female')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('Nonbinary')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('Transgender')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('')).toBe(true)
  })

  it('getAllowedAnatomiesForBiologicalSex restricts Female and Nonbinary', () => {
    expect(getAllowedAnatomiesForBiologicalSex('Female')).toEqual(['neither', 'breasts'])
    expect(getAllowedAnatomiesForBiologicalSex('Nonbinary')).toEqual(['neither', 'breasts'])
    expect(getAllowedAnatomiesForBiologicalSex('Male').sort()).toEqual(
      ['both', 'breasts', 'neither', 'phallus'].sort(),
    )
  })

  it('coerceEndowmentForBiologicalSex strips phallus for Female', () => {
    expect(coerceEndowmentForBiologicalSex('Female', { anatomy: 'phallus', phallusSize: 'Large' })).toEqual({
      anatomy: 'neither',
      phallusSize: undefined,
    })
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'both',
        breastsSize: 'Medium',
        phallusSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'breasts',
      breastsSize: 'Medium',
      phallusSize: undefined,
    })
  })

  it('coerce preserves vagina when stripping phallus from both', () => {
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'both',
        breastsSize: 'Small',
        phallusSize: 'Large',
        vaginaPresent: true,
        vaginaSize: 'Tiny',
      }),
    ).toEqual({
      anatomy: 'breasts',
      breastsSize: 'Small',
      phallusSize: undefined,
      vaginaPresent: true,
      vaginaSize: 'Tiny',
    })
  })

  it('normalizedEndowment clears vagina for Male', () => {
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
      vaginaPresent: false,
      vaginaSize: undefined,
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
    ).toEqual([
      'No breast or phallus size category (neither).',
      'Vagina: Huge.',
    ])
  })
})
