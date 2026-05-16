import { describe, expect, it } from 'vitest'
import { getRacialSexualTraitSections } from './racialSexualTraits'

describe('getRacialSexualTraitSections', () => {
  it('merges dwarf + duergar for duergar', () => {
    const s = getRacialSexualTraitSections('duergar')
    expect(s.map((x) => x.groupId)).toEqual(['dwarf', 'duergar'])
    expect(s[0].traits).toHaveLength(3)
    expect(s[1].traits).toHaveLength(1)
  })

  it('uses only dwarf block for hill dwarf', () => {
    const s = getRacialSexualTraitSections('hilldwarf')
    expect(s.map((x) => x.groupId)).toEqual(['dwarf'])
  })

  it('merges elf + drow for drow', () => {
    const s = getRacialSexualTraitSections('drow')
    expect(s.map((x) => x.groupId)).toEqual(['elf', 'drow'])
  })

  it('returns empty for species without bundle', () => {
    expect(getRacialSexualTraitSections('tabaxi')).toEqual([])
  })
})
