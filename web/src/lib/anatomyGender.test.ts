import { describe, expect, it } from 'vitest'
import {
  endowmentFlags,
  rollPronounsForGender,
  rollRandomEndowmentForGender,
} from './anatomyGender'
import { PRONOUN_POOLS } from '../data/identityOptions'

describe('rollRandomEndowmentForGender', () => {
  it('builds typical endowment per gender', () => {
    const male = rollRandomEndowmentForGender('Male')
    expect(endowmentFlags(male)).toEqual({
      hasPhallus: true,
      hasBreasts: false,
      hasVagina: false,
    })

    const female = rollRandomEndowmentForGender('Female')
    expect(endowmentFlags(female)).toEqual({
      hasPhallus: false,
      hasBreasts: true,
      hasVagina: true,
    })

    const intersex = rollRandomEndowmentForGender('Intersex')
    expect(endowmentFlags(intersex)).toEqual({
      hasPhallus: true,
      hasBreasts: true,
      hasVagina: true,
    })

    const agender = rollRandomEndowmentForGender('Agender')
    const flags = endowmentFlags(agender)
    expect(flags.hasPhallus || flags.hasBreasts || flags.hasVagina).toBe(true)
  })
})

describe('rollPronounsForGender', () => {
  it('returns a pronoun from the gender pool', () => {
    for (const gender of Object.keys(PRONOUN_POOLS) as Array<keyof typeof PRONOUN_POOLS>) {
      expect(PRONOUN_POOLS[gender]).toContain(rollPronounsForGender(gender))
    }
  })
})
