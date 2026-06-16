import { describe, expect, it } from 'vitest'
import { generateRandomCharacter } from './generateRandomCharacter'
import {
  getNamePoolKeyForSpecies,
  rollFantasyNameForSpecies,
} from './fantasyNameGenerator'

describe('rollFantasyNameForSpecies', () => {
  it('returns tiefling names with virtue surnames', () => {
    const virtues = new Set([
      'Honor', 'Lust', 'Despair', 'Hope', 'Fear', 'Glory', 'Art', 'Music', 'Open',
      'Reverence', 'Cunning', 'Sorrow', 'Chastity', 'Vengeance', 'Possession',
      'Torment', 'Wealth', 'Woe', 'Zeal', 'Dread', 'Ecstasy', 'Grief', 'Passion',
      'Pride', 'Wrath',
    ])
    for (let i = 0; i < 15; i++) {
      const name = rollFantasyNameForSpecies('tiefling')
      const parts = name.split(' ')
      expect(parts.length).toBe(2)
      expect(virtues.has(parts[1]!)).toBe(true)
    }
  })

  it('maps dwarf alias to dwarf pool', () => {
    expect(getNamePoolKeyForSpecies('dwarf')).toBe('dwarf')
    expect(getNamePoolKeyForSpecies('hilldwarf')).toBe('dwarf')
  })

  it('maps aasimar to angel pool', () => {
    expect(getNamePoolKeyForSpecies('aasimar')).toBe('angel')
    const name = rollFantasyNameForSpecies('aasimar')
    expect(name.length).toBeGreaterThan(2)
  })

  it('maps wood elf to elf pool', () => {
    expect(getNamePoolKeyForSpecies('woodelf')).toBe('elf')
  })
})

describe('generateRandomCharacter names', () => {
  it('uses species-appropriate fantasy names', () => {
    const c = generateRandomCharacter({ filters: { species: 'tiefling' } })
    expect(c.name.split(' ').length).toBeGreaterThanOrEqual(2)
    expect(c.name).not.toBe('Mira Vale')
  })
})
