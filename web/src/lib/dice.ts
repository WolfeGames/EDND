/** Standard D&D polyhedral die sizes. */
export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const

export type DiceSides = (typeof DICE_SIDES)[number]

export function rollDie(sides: DiceSides): number {
  if (sides === 100) return 1 + Math.floor(Math.random() * 100)
  return 1 + Math.floor(Math.random() * sides)
}

export function rollDice(count: number, sides: DiceSides): number[] {
  const n = Math.max(1, Math.min(40, Math.floor(count) || 1))
  return Array.from({ length: n }, () => rollDie(sides))
}

export type SpectacleDie = {
  id: string
  sides: DiceSides
  value: number
  /** Dim / strike for 4d6 drop-lowest discarded die. */
  dropped?: boolean
  /** Optional cluster label (e.g. STR). */
  group?: string
}

let dieIdSeq = 0

export function makeSpectacleDie(
  sides: DiceSides,
  value: number,
  extras: Partial<Pick<SpectacleDie, 'dropped' | 'group'>> = {},
): SpectacleDie {
  dieIdSeq += 1
  return {
    id: `die-${dieIdSeq}-${value}-${sides}`,
    sides,
    value,
    ...extras,
  }
}

export function labelForSides(sides: DiceSides): string {
  return sides === 100 ? 'd100' : `d${sides}`
}
