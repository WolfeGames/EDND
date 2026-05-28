import type { GenitalTraitDefinition, GenitalTraitId } from '../types/genitalTrait'

export const GENITAL_TRAIT_DEFINITIONS: GenitalTraitDefinition[] = [
  {
    id: 'phallic',
    label: 'Phallic',
    summary: 'Default for Male — refractory after climax, pleasure becomes overstim while recovering.',
    defaultForBiologicalSex: 'Male',
    tracks: ['phallic'],
    usesPhallicRules: true,
    usesVaginalRules: false,
    canImpregnateOthers: true,
    setsImpregnationDc: false,
    tooltip:
      'After climax: enter Refractory (default duration = one short rest). While Refractory: immune to pleasure; any pleasure received becomes Overstimulation instead. You may attempt a Sexuality save (DC 10 + 2 per previous orgasm this encounter) to end Refractory early. Your Fertility Bonus applies when you impregnate others.',
  },
  {
    id: 'vaginal',
    label: 'Vaginal',
    summary: 'Default for Female — no default Refractory; Con saves after each orgasm.',
    defaultForBiologicalSex: 'Female',
    tracks: ['vaginal'],
    usesPhallicRules: false,
    usesVaginalRules: true,
    canImpregnateOthers: false,
    setsImpregnationDc: true,
    tooltip:
      'No default Refractory period. After each orgasm: Constitution save (DC 10, +2 per previous orgasm this encounter). Failure adds one level of Overstimulated (-2 Sexuality rolls and -5 max Pleasure Points per level). Your Fertility Bonus sets the DC when you are impregnated.',
  },
  {
    id: 'cuntboy',
    label: 'Cuntboy (intersex)',
    summary: 'Male with vagina — uses Vaginal refractory/overstim rules; can still impregnate others.',
    tracks: ['vaginal'],
    usesPhallicRules: false,
    usesVaginalRules: true,
    canImpregnateOthers: true,
    setsImpregnationDc: true,
    tooltip:
      'Intersex configuration: Male biology with a vagina. Uses Vaginal rules for Refractory and Overstimulation (no default Refractory; Con save after each orgasm). Still applies your Fertility Bonus when impregnating others, and sets impregnation DC when you are impregnated.',
  },
  {
    id: 'shemale',
    label: 'Shemale / Dickgirl (intersex)',
    summary: 'Female with cock — uses Phallic refractory rules; sets impregnation DC.',
    tracks: ['phallic'],
    usesPhallicRules: true,
    usesVaginalRules: false,
    canImpregnateOthers: false,
    setsImpregnationDc: true,
    tooltip:
      'Intersex configuration: Female biology with a phallus. Uses Phallic rules (Refractory after climax, pleasure → Overstim while Refractory, Sexuality save to recover early). Uses your Fertility Bonus as the DC when you are impregnated.',
  },
  {
    id: 'hermaphrodite',
    label: 'Hermaphrodite (both)',
    summary: 'Both sets — separate Refractory/Overstim per track; penalties stack across tracks.',
    tracks: ['phallic', 'vaginal'],
    usesPhallicRules: true,
    usesVaginalRules: true,
    canImpregnateOthers: true,
    setsImpregnationDc: true,
    tooltip:
      'Both Phallic and Vaginal traits apply. Refractory and Overstimulation are tracked separately for each configuration. Overstimulation in either track applies penalties to the whole creature (-2 Sexuality per combined level, -5 max PP per combined level). Fertility Bonus applies when impregnating others and sets DC when impregnated.',
  },
]

const BY_ID = new Map(GENITAL_TRAIT_DEFINITIONS.map((d) => [d.id, d]))

export function getGenitalTraitDefinition(id: GenitalTraitId): GenitalTraitDefinition {
  const row = BY_ID.get(id)
  if (!row) throw new Error(`Unknown genital trait: ${id}`)
  return row
}

export function isGenitalTraitId(value: string): value is GenitalTraitId {
  return BY_ID.has(value as GenitalTraitId)
}
