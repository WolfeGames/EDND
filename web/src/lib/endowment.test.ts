import { describe, expect, it } from 'vitest'
import { formatEndowmentLines, normalizedEndowment } from './endowment'

describe('normalizedEndowment', () => {
  it('strips phallus size when anatomy is breasts', () => {
    expect(
      normalizedEndowment({
        anatomy: 'breasts',
        breastsSize: 'Medium',
        phallusSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'breasts',
      breastsSize: 'Medium',
      vaginaPresent: false,
    })
  })

  it('clears vagina when not present', () => {
    expect(
      normalizedEndowment({
        anatomy: 'phallus',
        phallusSize: 'Medium',
        vaginaPresent: false,
        vaginaSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'phallus',
      phallusSize: 'Medium',
      vaginaPresent: false,
    })
  })

  it('keeps vagina when present', () => {
    expect(
      normalizedEndowment({
        anatomy: 'phallus',
        phallusSize: 'Medium',
        vaginaPresent: true,
        vaginaSize: 'Large',
      }),
    ).toEqual({
      anatomy: 'phallus',
      phallusSize: 'Medium',
      vaginaPresent: true,
      vaginaSize: 'Large',
    })
  })
})

describe('formatEndowmentLines', () => {
  it('includes vagina when present', () => {
    expect(
      formatEndowmentLines({
        anatomy: 'neither',
        vaginaPresent: true,
        vaginaSize: 'Huge',
      }),
    ).toEqual(['No breast or phallus size category (neither).', 'Vagina: Huge.'])
  })

  it('annotates phallus with inch range for creature size', () => {
    expect(
      formatEndowmentLines(
        { anatomy: 'phallus', phallusSize: 'Medium', vaginaPresent: false },
        'Medium',
      ),
    ).toEqual(['Phallus: Medium (4–6").'])
    expect(
      formatEndowmentLines(
        { anatomy: 'phallus', phallusSize: 'Medium', vaginaPresent: false },
        'Large',
      ),
    ).toEqual(['Phallus: Medium (6–8").'])
  })

  it('includes exact length when 1d20 fine measurement is set', () => {
    expect(
      formatEndowmentLines(
        {
          anatomy: 'phallus',
          phallusSize: 'Medium',
          phallusLengthDie: 20,
          vaginaPresent: false,
        },
        'Medium',
      ),
    ).toEqual([
      'Phallus: Medium (4–6") · 6" (base 4" + 1d20→20 × 0.1").',
    ])
  })
})