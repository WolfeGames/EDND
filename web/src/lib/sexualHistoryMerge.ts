import type { SexualHistoryRow } from '../types/tables'
import rawBundle from '../data/tables/sexual-histories-bundle.json'
import awakened from '../data/tables/sexual-histories/awakened.json'
import breedingStock from '../data/tables/sexual-histories/breeding-stock.json'
import chasteVirgin from '../data/tables/sexual-histories/chaste-virgin.json'
import courtesanHistory from '../data/tables/sexual-histories/courtesan.json'
import cultSeducer from '../data/tables/sexual-histories/cult-seducer.json'
import eroticDisciple from '../data/tables/sexual-histories/erotic-disciple.json'
import haremTender from '../data/tables/sexual-histories/harem-tender.json'
import hedonist from '../data/tables/sexual-histories/hedonist.json'
import houseServant from '../data/tables/sexual-histories/house-servant.json'
import indoctrinated from '../data/tables/sexual-histories/indoctrinated.json'
import paramour from '../data/tables/sexual-histories/paramour.json'

type BundleFeature = {
  level: number
  name: string
  mechanical: string
  flavor: string
}

type BundleEntry = {
  name: string
  traitPoints: number
  theme: string
  features: BundleFeature[]
}

const bundle = rawBundle as { sexualHistories: Record<string, BundleEntry> }

/** Maps legacy table `id` (filename / character JSON) → key in `sexual-histories-bundle.json`. */
const LEGACY_ID_TO_BUNDLE_KEY: Record<string, string> = {
  awakened: 'awakened',
  'breeding-stock': 'breedingStock',
  'chaste-virgin': 'chasteVirgin',
  courtesan: 'courtesan',
  'cult-seducer': 'cultSeducer',
  'erotic-disciple': 'eroticDisciple',
  'harem-tender': 'haremTender',
  hedonist: 'hedonist',
  'house-servant': 'houseServant',
  indoctrinated: 'indoctrinated',
  paramour: 'paramour',
}

const LEGACY_ROWS = [
  awakened,
  breedingStock,
  chasteVirgin,
  courtesanHistory,
  cultSeducer,
  eroticDisciple,
  haremTender,
  hedonist,
  houseServant,
  indoctrinated,
  paramour,
] as const

function featuresToRecord(features: BundleFeature[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of features) {
    const key = `level${f.level}`
    out[key] = [
      f.name,
      '',
      `Mechanical: ${f.mechanical}`,
      '',
      `Flavor: ${f.flavor}`,
    ].join('\n')
  }
  return out
}

function mergeOne(legacy: (typeof LEGACY_ROWS)[number]): SexualHistoryRow {
  const base = legacy as SexualHistoryRow
  const bundleKey = LEGACY_ID_TO_BUNDLE_KEY[legacy.id]
  if (!bundleKey) return base
  const b = bundle.sexualHistories[bundleKey]
  if (!b?.features?.length) return base
  return {
    ...base,
    name: b.name,
    description: b.theme,
    traitPoints: b.traitPoints,
    features: featuresToRecord(b.features),
  }
}

/** Full sexual history table: legacy JSON (personality, equipment, proficiencies, carnal trait labels) + bundle overlay (theme, trait points, structured features). */
export function buildSexualHistories(): SexualHistoryRow[] {
  return LEGACY_ROWS.map((row) => mergeOne(row))
}
