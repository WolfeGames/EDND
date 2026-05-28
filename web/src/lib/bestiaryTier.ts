export interface BestiaryTier {
  id: string
  label: string
  srRangeLabel: string
  description: string
}

export const BESTIARY_TIERS: BestiaryTier[] = [
  {
    id: 'tier-1',
    label: 'Tier 1',
    srRangeLabel: 'SR 0-1',
    description: 'Minor threats, familiars, lesser fey, and low-risk carnal encounters.',
  },
  {
    id: 'tier-2',
    label: 'Tier 2',
    srRangeLabel: 'SR 2-4',
    description: 'Established predators, seductive specialists, and meaningful scene threats.',
  },
  {
    id: 'tier-3',
    label: 'Tier 3',
    srRangeLabel: 'SR 5-10',
    description: 'Powerful monsters, major corruptors, and campaign-shaping intimate dangers.',
  },
  {
    id: 'tier-4',
    label: 'Tier 4',
    srRangeLabel: 'SR 11-16',
    description: 'Legendary creatures whose desire can reshape regions, courts, or bloodlines.',
  },
  {
    id: 'tier-5',
    label: 'Tier 5',
    srRangeLabel: 'SR 17-20',
    description: 'Near-mythic threats at the edge of mortal endurance.',
  },
  {
    id: 'tier-6',
    label: 'Tier 6',
    srRangeLabel: 'SR 21+',
    description: 'Epic and world-altering entities beyond ordinary carnal challenge.',
  },
]

export function getBestiaryTier(sr: number): BestiaryTier {
  if (sr <= 1) return BESTIARY_TIERS[0]
  if (sr <= 4) return BESTIARY_TIERS[1]
  if (sr <= 10) return BESTIARY_TIERS[2]
  if (sr <= 16) return BESTIARY_TIERS[3]
  if (sr <= 20) return BESTIARY_TIERS[4]
  return BESTIARY_TIERS[5]
}
