import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import {
  applyGenitalTraitSelection,
  describeEndowmentShape,
  endowmentShapeFromGenitalTrait,
} from './genitalTrait'

describe('endowmentShapeFromGenitalTrait', () => {
  it('maps traits to present organs', () => {
    expect(endowmentShapeFromGenitalTrait('phallic')).toMatchObject({
      hasPhallus: true,
      hasBreasts: false,
      hasVagina: false,
    })
    expect(endowmentShapeFromGenitalTrait('vaginal')).toMatchObject({
      hasPhallus: false,
      hasBreasts: true,
      hasVagina: true,
    })
    expect(endowmentShapeFromGenitalTrait('cuntboy')).toMatchObject({
      hasPhallus: false,
      hasBreasts: false,
      hasVagina: true,
    })
    expect(endowmentShapeFromGenitalTrait('shemale')).toMatchObject({
      hasPhallus: true,
      hasBreasts: true,
      hasVagina: false,
    })
    expect(endowmentShapeFromGenitalTrait('hermaphrodite')).toMatchObject({
      hasPhallus: true,
      hasBreasts: false,
      hasVagina: true,
    })
  })

  it('applyGenitalTraitSelection reshapes endowment', () => {
    const c = applyGenitalTraitSelection(createEmptyCharacter(), 'shemale')
    expect(c.genitalTrait).toBe('shemale')
    expect(c.endowment.anatomy).toBe('both')
    expect(c.endowment.vaginaPresent).toBe(false)
    expect(describeEndowmentShape('shemale')).toContain('breasts')
  })
})
