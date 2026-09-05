import { describe, expect, it } from 'vitest'
import {
  allowedPhallusSizes,
  clampPhallusSizeForCreature,
  computePhallusLengthInches,
  formatPhallusSizeLabel,
  phallusInchRange,
  resolveCharacterCreatureSize,
  rollPhallusSize,
} from './phallusScale'

describe('phallusScale', () => {
  it('uses Medium/Small baseline inch ranges', () => {
    expect(phallusInchRange('Tiny', 'Medium')).toEqual({ min: 1, max: 3 })
    expect(phallusInchRange('Small', 'Small')).toEqual({ min: 3, max: 4 })
    expect(phallusInchRange('Medium', 'Medium')).toEqual({ min: 4, max: 6 })
    expect(phallusInchRange('Large', 'Medium')).toEqual({ min: 6, max: 8 })
    expect(phallusInchRange('Huge', 'Medium')).toEqual({ min: 9, max: 11 })
    expect(phallusInchRange('Gargantuan', 'Medium')).toEqual({ min: 11, max: null })
  })

  it('shifts Large/Huge/Gargantuan creature scales by +2/+4/+8', () => {
    expect(phallusInchRange('Medium', 'Large')).toEqual({ min: 6, max: 8 })
    expect(phallusInchRange('Medium', 'Huge')).toEqual({ min: 8, max: 10 })
    expect(phallusInchRange('Medium', 'Gargantuan')).toEqual({ min: 12, max: 14 })
    expect(formatPhallusSizeLabel('Gargantuan', 'Large')).toBe('Gargantuan (13"+)')
  })

  it('caps Tiny creatures at Tiny phallus', () => {
    expect(allowedPhallusSizes('Tiny')).toEqual(['Tiny'])
    expect(clampPhallusSizeForCreature('Huge', 'Tiny')).toBe('Tiny')
    expect(rollPhallusSize('Tiny')).toBe('Tiny')
  })

  it('resolves player override over species table size', () => {
    expect(
      resolveCharacterCreatureSize({ species: 'human', creatureSize: 'Small' }),
    ).toBe('Small')
    expect(resolveCharacterCreatureSize({ species: 'centaur' })).toBe('Large')
    expect(resolveCharacterCreatureSize({ species: 'halfling' })).toBe('Small')
  })

  it('computes exact length as category base + 0.1" × 1d20', () => {
    expect(computePhallusLengthInches('Medium', 'Medium', 20)).toBe(6)
    expect(computePhallusLengthInches('Medium', 'Medium', 1)).toBe(4.1)
    expect(computePhallusLengthInches('Medium', 'Large', 20)).toBe(8)
    expect(computePhallusLengthInches('Tiny', 'Medium', 20)).toBe(3)
  })
})
