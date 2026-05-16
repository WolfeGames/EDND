import { describe, expect, it } from 'vitest'
import { createEmptyEroticTraits } from '../types/character'
import { mergeTableProficiencies } from './mergeEroticProficiencies'

describe('mergeTableProficiencies', () => {
  it('merges species grants, history arts, positions, and tools', () => {
    const base = createEmptyEroticTraits()
    base.eroticToolProficiencies = ['Player-added tool']
    const merged = mergeTableProficiencies('aasimar', 'courtesan', undefined, base)
    expect(merged.carnalSkillProficiencies).toContain('Seduction')
    expect(merged.carnalSkillProficiencies).toContain('Exhibitionism')
    expect(merged.positionProficiencies).toContain('Basic')
    expect(merged.positionProficiencies).toContain('Lotus')
    expect(merged.eroticToolProficiencies).toContain('Player-added tool')
  })

  it('resolves legacy dwarf id to hill dwarf table row', () => {
    const base = createEmptyEroticTraits()
    const merged = mergeTableProficiencies('dwarf', 'courtesan', undefined, base)
    expect(merged.carnalSkillProficiencies).toContain('Endurance')
    expect(merged.carnalSkillProficiencies).toContain('Exhibitionism')
  })
})
