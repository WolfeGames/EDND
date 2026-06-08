import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  getCarnalClassTraitSlotCount,
  getSexualHistoryTraitSlotCount,
  syncCharacterCarnalTraitSelections,
  traitsForPickContext,
} from './carnalTraitSelection'

describe('carnal trait slot counts', () => {
  it('grants 4 traits for Courtesan and 3 for others', () => {
    expect(getCarnalClassTraitSlotCount('courtesan')).toBe(4)
    expect(getCarnalClassTraitSlotCount('siren')).toBe(3)
    expect(getCarnalClassTraitSlotCount()).toBe(0)
  })

  it('grants 1 trait for chaste virgin and 2 for most histories', () => {
    expect(getSexualHistoryTraitSlotCount('chaste-virgin')).toBe(1)
    expect(getSexualHistoryTraitSlotCount('hedonist')).toBe(2)
  })
})

describe('traitsForPickContext', () => {
  it('includes general placeholders for class picks', () => {
    const pool = traitsForPickContext('class', 'human', 'siren', 'hedonist')
    expect(pool.some((t) => t.id === 'placeholder-trait-1')).toBe(true)
  })

  it('includes courtesan-exclusive trait only for courtesan class', () => {
    const courtesan = traitsForPickContext('class', 'human', 'courtesan', '')
    const siren = traitsForPickContext('class', 'human', 'siren', '')
    expect(courtesan.some((t) => t.id === 'placeholder-trait-x')).toBe(true)
    expect(siren.some((t) => t.id === 'placeholder-trait-x')).toBe(false)
  })

  it('includes hedonist-exclusive trait in history pool', () => {
    const pool = traitsForPickContext('history', 'human', '', 'hedonist')
    expect(pool.some((t) => t.id === 'placeholder-trait-history')).toBe(true)
  })
})

describe('syncCharacterCarnalTraitSelections', () => {
  it('trims selections to slot budget', () => {
    const c = createEmptyCharacter()
    c.carnalClass = 'siren'
    c.carnalClassTraitIds = [
      'placeholder-trait-1',
      'placeholder-trait-2',
      'placeholder-trait-3',
      'placeholder-trait-4',
    ]
    const out = syncCharacterCarnalTraitSelections(c)
    expect(out.carnalClassTraitIds).toHaveLength(3)
  })
})
