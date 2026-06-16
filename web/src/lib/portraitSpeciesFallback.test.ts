import { describe, expect, it } from 'vitest'
import portraitManifest from '../data/portraitManifest.json'
import {
  filterPortraitsForCharacter,
  type PortraitManifestEntry,
} from './portraitFilename'

const ENTRIES = (portraitManifest as { entries: PortraitManifestEntry[] }).entries

describe('portrait species fallbacks', () => {
  it('wood elf male uses high elf art when no male wood elf portrait exists', () => {
    const pool = filterPortraitsForCharacter(ENTRIES, 'woodelf', 'Male')
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.some((e) => e.speciesId === 'highelf')).toBe(true)
  })

  it('aasimar resolves to portrait via highelf fallback', () => {
    const pool = filterPortraitsForCharacter(ENTRIES, 'aasimar', 'Female')
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((e) => e.speciesId === 'highelf' || e.speciesId === 'human')).toBe(true)
  })

  it('duergar resolves to drow portrait fallback', () => {
    const pool = filterPortraitsForCharacter(ENTRIES, 'duergar', 'Male')
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.some((e) => e.speciesId === 'drow')).toBe(true)
  })

  it('wood elf female still prefers wood elf art', () => {
    const pool = filterPortraitsForCharacter(ENTRIES, 'woodelf', 'Female')
    expect(pool.some((e) => e.speciesId === 'woodelf')).toBe(true)
  })

  it('returns male high elf portrait for wood elf male', () => {
    const pool = filterPortraitsForCharacter(ENTRIES, 'woodelf', 'Male')
    expect(pool.some((e) => e.filename.startsWith('highelf-m'))).toBe(true)
  })
})
