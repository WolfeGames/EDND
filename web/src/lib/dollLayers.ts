import dollManifest from '../data/dollManifest.json'
import type { EndowmentSize } from '../types/character'
import {
  bodyArtKey,
  hairStyleKey,
  presentationArtKey,
  tintFilterFromHex,
  type DollBodyArtKey,
  type DollHairStyleKey,
  type DollPalette,
  type DollPresentationArtKey,
  type PaperDollModel,
} from './paperDoll'

export type DollLayerSlot =
  | 'tail'
  | 'base'
  | 'vagina'
  | 'phallus'
  | 'breasts'
  | 'features'
  | 'hair'

export type DollTintKind = 'skin' | 'hair' | 'phallus' | 'none'

export type DollAnchor = { x: number; y: number }

export type ResolvedDollLayer = {
  id: string
  slot: DollLayerSlot
  src: string
  /** CSS filter string, or null for no tint. */
  tintFilter: string | null
  /** Uniform scale for endowment fine-tune (tier art already matches size). */
  scaleX: number
  scaleY: number
  originX: number
  originY: number
  zIndex: number
  /** Blend weight for stacked base bodies (default 1). */
  opacity: number
}

type ManifestEntry = {
  id: string
  slot: string
  src: string
  tint?: string
  presentation?: string
  bodyArt?: string
  hairStyle?: string
  tier?: string
  feature?: string
  anchor?: string
}

type Manifest = {
  canvas: { width: number; height: number }
  anchors: Record<string, DollAnchor>
  entries: ManifestEntry[]
}

const MANIFEST = dollManifest as Manifest

const SLOT_Z: Record<DollLayerSlot, number> = {
  tail: 10,
  base: 20,
  vagina: 30,
  phallus: 40,
  breasts: 50,
  features: 60,
  hair: 70,
}

const SLOT_ORDER: DollLayerSlot[] = [
  'tail',
  'base',
  'vagina',
  'phallus',
  'breasts',
  'features',
  'hair',
]

function entriesForSlot(slot: string): ManifestEntry[] {
  return MANIFEST.entries.filter((e) => e.slot === slot)
}

function findBase(
  presentation: DollPresentationArtKey,
  bodyArt: DollBodyArtKey,
): ManifestEntry | undefined {
  return entriesForSlot('base').find(
    (e) => e.presentation === presentation && e.bodyArt === bodyArt,
  )
}

function findHair(style: DollHairStyleKey): ManifestEntry | undefined {
  return entriesForSlot('hair').find((e) => e.hairStyle === style)
}

function findTier(slot: 'breasts' | 'phallus', tier: EndowmentSize): ManifestEntry | undefined {
  return entriesForSlot(slot).find((e) => e.tier === tier) ??
    entriesForSlot(slot).find((e) => e.tier === 'Medium')
}

function findFeature(feature: string): ManifestEntry | undefined {
  return MANIFEST.entries.find((e) => e.feature === feature)
}

function tintFor(
  kind: DollTintKind | string | undefined,
  palette: DollPalette,
): string | null {
  if (!kind || kind === 'none') return null
  if (kind === 'skin') return tintFilterFromHex(palette.skin)
  if (kind === 'hair') return tintFilterFromHex(palette.hair)
  if (kind === 'phallus') return tintFilterFromHex(palette.phallus)
  return null
}

function anchorFor(entry: ManifestEntry): DollAnchor {
  const key = entry.anchor
  if (key && MANIFEST.anchors[key]) return MANIFEST.anchors[key]!
  return { x: 0.5, y: 0.5 }
}

function toLayer(
  entry: ManifestEntry,
  palette: DollPalette,
  scaleX = 1,
  scaleY = 1,
  opacity = 1,
): ResolvedDollLayer {
  const slot = entry.slot as DollLayerSlot
  const anchor = anchorFor(entry)
  return {
    id: entry.id,
    slot,
    src: entry.src,
    tintFilter: tintFor(entry.tint, palette),
    scaleX,
    scaleY,
    originX: anchor.x,
    originY: anchor.y,
    zIndex: SLOT_Z[slot] ?? 0,
    opacity,
  }
}

function earFeatureKey(ears: PaperDollModel['features']['ears']): string | null {
  if (ears === 'round') return null
  if (ears === 'long-pointed') return 'ears-long-pointed'
  if (ears === 'droopy') return 'ears-droopy'
  return 'ears-pointed'
}

/** Map a paper-doll model to ordered compositable image layers. */
export function resolveDollLayers(model: PaperDollModel): ResolvedDollLayer[] {
  const layers: ResolvedDollLayer[] = []
  const presentation = presentationArtKey(model.presentation)

  const { features } = model

  if (features.tail && features.tailStyle !== 'none') {
    const tailKey = features.tailStyle === 'thick' ? 'tail-thick' : 'tail-thin'
    const tail = findFeature(tailKey)
    if (tail) layers.push(toLayer(tail, model.palette))
  }

  const blend = model.baseBlend.length
    ? model.baseBlend
    : [{ bodyArt: bodyArtKey(model.composition, model.bodyType), weight: 1 }]

  for (const stop of blend) {
    const base = findBase(presentation, stop.bodyArt)
    if (!base) continue
    layers.push(toLayer(base, model.palette, 1, 1, stop.weight))
  }

  if (model.hasVagina) {
    const vagina = entriesForSlot('vagina')[0]
    if (vagina) {
      layers.push(
        toLayer(vagina, model.palette, Math.max(0.7, model.vaginaScale * 0.85), Math.max(0.7, model.vaginaScale * 0.85)),
      )
    }
  }

  if (model.hasPhallus && model.phallusSize) {
    const phallus = findTier('phallus', model.phallusSize)
    if (phallus) {
      // Tier PNG carries size; die roll adds slight length fine-tune around the tier.
      const tierBase = TIER_SCALE[model.phallusSize]
      const fineY =
        model.phallusLengthInches != null && tierBase > 0
          ? Math.min(1.12, Math.max(0.92, model.phallusScale / tierBase))
          : 1
      layers.push(toLayer(phallus, model.palette, 1, fineY))
    }
  }

  if (model.hasBreasts && model.breastsSize) {
    // Baked breasts: size approximated in PaperDollViewer via bust clip morph.
  }

  const earKey = earFeatureKey(features.ears)
  if (earKey) {
    const ears = findFeature(earKey)
    if (ears) layers.push(toLayer(ears, model.palette))
  }
  if (features.horns) {
    const horns = findFeature('horns')
    if (horns) layers.push(toLayer(horns, model.palette))
  }
  if (features.tusks) {
    const tusks = findFeature('tusks')
    if (tusks) layers.push(toLayer(tusks, model.palette))
  }

  // Procedural hair PNGs are placeholder blobs that cover painted faces on Grok bases.
  // Skip until real hair layers (with a face opening) are in the pack.
  const USE_PLACEHOLDER_HAIR = false
  if (USE_PLACEHOLDER_HAIR) {
    const hairEntry = findHair(hairStyleKey(model.presentation))
    if (hairEntry) layers.push(toLayer(hairEntry, model.palette))
  }

  return layers.sort((a, b) => a.zIndex - b.zIndex)
}

const TIER_ORDER: EndowmentSize[] = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
]

const TIER_SCALE: Record<EndowmentSize, number> = {
  Tiny: 0.45,
  Small: 0.7,
  Medium: 1,
  Large: 1.35,
  Huge: 1.75,
  Gargantuan: 2.2,
}

/** Pick closest endowment tier art from a numeric scale factor. */
export function endowmentTierFromScale(scale: number): EndowmentSize {
  let best: EndowmentSize = 'Medium'
  let bestDist = Infinity
  for (const tier of TIER_ORDER) {
    const dist = Math.abs(TIER_SCALE[tier] - scale)
    if (dist < bestDist) {
      bestDist = dist
      best = tier
    }
  }
  return best
}

export function dollCanvasSize(): { width: number; height: number } {
  return { ...MANIFEST.canvas }
}

export function dollSlotOrder(): readonly DollLayerSlot[] {
  return SLOT_ORDER
}

/** True when the base body layer resolved (pack is usable). */
export function hasDollBaseLayer(layers: ResolvedDollLayer[]): boolean {
  return layers.some((l) => l.slot === 'base')
}
