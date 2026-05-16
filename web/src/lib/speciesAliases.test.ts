import { describe, expect, it } from 'vitest'
import {
  resolveSpeciesPortraitId,
  resolveSpeciesTableId,
} from './speciesAliases'

describe('resolveSpeciesTableId', () => {
  it('maps ambiguous legacy ids for table lookup', () => {
    expect(resolveSpeciesTableId('elf')).toBe('highelf')
    expect(resolveSpeciesTableId('dwarf')).toBe('hilldwarf')
  })

  it('leaves canonical subrace ids unchanged', () => {
    expect(resolveSpeciesTableId('drow')).toBe('drow')
    expect(resolveSpeciesTableId('woodelf')).toBe('woodelf')
    expect(resolveSpeciesTableId('mountaindwarf')).toBe('mountaindwarf')
  })
})

describe('resolveSpeciesPortraitId', () => {
  it('does not map ambiguous legacy ids', () => {
    expect(resolveSpeciesPortraitId('elf')).toBe('elf')
    expect(resolveSpeciesPortraitId('dwarf')).toBe('dwarf')
  })

  it('leaves canonical subrace ids unchanged', () => {
    expect(resolveSpeciesPortraitId('drow')).toBe('drow')
    expect(resolveSpeciesPortraitId('duergar')).toBe('duergar')
  })
})
