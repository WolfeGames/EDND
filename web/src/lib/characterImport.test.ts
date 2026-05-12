import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import { parseCharacterJson } from './characterImport'

describe('parseCharacterJson', () => {
  it('accepts a minimal valid export', () => {
    const c = createEmptyCharacter()
    c.name = 'Test'
    c.level = 3
    const out = parseCharacterJson(JSON.parse(JSON.stringify(c)))
    expect(out.id).toBe(c.id)
    expect(out.name).toBe('Test')
    expect(out.level).toBe(3)
  })

  it('rejects non-objects', () => {
    expect(() => parseCharacterJson(null)).toThrow()
    expect(() => parseCharacterJson([])).toThrow()
  })

  it('rejects missing id', () => {
    expect(() => parseCharacterJson({ name: 'x' })).toThrow(/id/)
  })
})
