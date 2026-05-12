import { describe, expect, it } from 'vitest'
import {
  coerceEndowmentForBiologicalSex,
  getAllowedAnatomiesForBiologicalSex,
  phallusAllowedForBiologicalSex,
} from './endowment'

describe('endowment biology rules', () => {
  it('phallus allowed only for Male and Transgender', () => {
    expect(phallusAllowedForBiologicalSex('Male')).toBe(true)
    expect(phallusAllowedForBiologicalSex('Transgender')).toBe(true)
    expect(phallusAllowedForBiologicalSex('Female')).toBe(false)
    expect(phallusAllowedForBiologicalSex('Nonbinary')).toBe(false)
    expect(phallusAllowedForBiologicalSex('')).toBe(true)
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
    })
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'both',
        breastsSize: 'Medium',
        phallusSize: 'Large',
      }),
    ).toEqual({ anatomy: 'breasts', breastsSize: 'Medium' })
  })
})
