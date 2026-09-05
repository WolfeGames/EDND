import { describe, expect, it } from 'vitest'
import {
  defaultCreatureSizeForSpecies,
  speciesAllowsCreatureSizeChoice,
} from './creatureSize'

describe('creatureSize', () => {
  it('allows Medium/Small for humans, elves, and dwarves', () => {
    for (const id of [
      'human',
      'highelf',
      'woodelf',
      'drow',
      'hilldwarf',
      'mountaindwarf',
      'duergar',
    ]) {
      expect(speciesAllowsCreatureSizeChoice(id)).toBe(true)
      expect(defaultCreatureSizeForSpecies(id)).toBe('Medium')
    }
  })

  it('does not offer size choice for other species', () => {
    expect(speciesAllowsCreatureSizeChoice('tiefling')).toBe(false)
    expect(speciesAllowsCreatureSizeChoice('halfling')).toBe(false)
    expect(defaultCreatureSizeForSpecies('orc')).toBeUndefined()
  })
})
