import { describe, expect, it } from 'vitest'
import {
  breastsAllowedForBiologicalSex,
  coerceEndowmentForBiologicalSex,
  formatEndowmentLines,
  getAllowedAnatomiesForBiologicalSex,
  normalizedEndowment,
  phallusAllowedForBiologicalSex,
  rollRandomEndowmentForBiologicalSex,
  vaginaAllowedForBiologicalSex,
} from './endowment'

const FULL = ['neither', 'breasts', 'phallus', 'both'] as const

describe('endowment biology rules', () => {
  it('phallus allowed only for Male and unset biology', () => {
    expect(phallusAllowedForBiologicalSex('Male')).toBe(true)
    expect(phallusAllowedForBiologicalSex('Female')).toBe(false)
    expect(phallusAllowedForBiologicalSex('')).toBe(true)
  })

  it('breasts allowed only for Female and unset biology', () => {
    expect(breastsAllowedForBiologicalSex('Female')).toBe(true)
    expect(breastsAllowedForBiologicalSex('Male')).toBe(false)
    expect(breastsAllowedForBiologicalSex('')).toBe(true)
  })

  it('vagina allowed for Male, Female, and unset biology', () => {
    expect(vaginaAllowedForBiologicalSex('Male')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('Female')).toBe(true)
    expect(vaginaAllowedForBiologicalSex('')).toBe(true)
  })

  it('getAllowedAnatomiesForBiologicalSex matches sex-specific options', () => {
    expect(getAllowedAnatomiesForBiologicalSex('Male').sort()).toEqual(
      ['neither', 'phallus'].sort(),
    )
    expect(getAllowedAnatomiesForBiologicalSex('Female').sort()).toEqual(
      ['neither', 'breasts'].sort(),
    )
    expect(getAllowedAnatomiesForBiologicalSex('').sort()).toEqual([...FULL].sort())
  })

  it('coerceEndowmentForBiologicalSex strips breasts from Male', () => {
    expect(
      coerceEndowmentForBiologicalSex('Male', {
        anatomy: 'breasts',
        breastsSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'phallus',
      phallusSize: undefined,
    })
  })

  it('coerceEndowmentForBiologicalSex strips phallus from Female', () => {
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'phallus',
        phallusSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'breasts',
      breastsSize: undefined,
    })
  })

  it('coerceEndowmentForBiologicalSex converts both to phallus for Male', () => {
    expect(
      coerceEndowmentForBiologicalSex('Male', {
        anatomy: 'both',
        breastsSize: 'Medium',
        phallusSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'phallus',
      phallusSize: 'Large',
    })
  })

  it('coerceEndowmentForBiologicalSex converts both to breasts for Female', () => {
    expect(
      coerceEndowmentForBiologicalSex('Female', {
        anatomy: 'both',
        breastsSize: 'Small',
        phallusSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'breasts',
      breastsSize: 'Small',
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

  it('rollRandomEndowmentForBiologicalSex never assigns breasts to Male', () => {
    for (let i = 0; i < 40; i++) {
      const e = rollRandomEndowmentForBiologicalSex('Male')
      expect(e.anatomy).not.toBe('breasts')
      expect(e.anatomy).not.toBe('both')
      expect(e.breastsSize).toBeUndefined()
    }
  })

  it('rollRandomEndowmentForBiologicalSex never assigns phallus to Female', () => {
    for (let i = 0; i < 40; i++) {
      const e = rollRandomEndowmentForBiologicalSex('Female')
      expect(e.anatomy).not.toBe('phallus')
      expect(e.anatomy).not.toBe('both')
      expect(e.phallusSize).toBeUndefined()
    }
  })
})
