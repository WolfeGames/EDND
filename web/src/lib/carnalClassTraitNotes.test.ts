import { describe, expect, it } from 'vitest'
import { getCarnalClass } from '../data/registry'
import { getCarnalClassTraitNotes } from './carnalClassTraitNotes'

describe('getCarnalClassTraitNotes', () => {
  it('includes trait selection budget for Courtesan', () => {
    const row = getCarnalClass('courtesan')!
    const notes = getCarnalClassTraitNotes(row)
    expect(notes.some((n) => n.note.includes('Select 4 carnal traits'))).toBe(true)
  })

  it('includes trait selection budget for Siren', () => {
    const row = getCarnalClass('siren')!
    const notes = getCarnalClassTraitNotes(row)
    expect(notes.some((n) => n.note.includes('Select 3 carnal traits'))).toBe(true)
  })

  it('mentions automatic Multilover for Ravager drives', () => {
    const row = getCarnalClass('ravager')!
    const notes = getCarnalClassTraitNotes(row)
    expect(notes.some((n) => n.note.includes('Multilover'))).toBe(true)
  })
})
