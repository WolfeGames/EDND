import type { BodyType } from '../data/bodyTypes'
import type { EndowmentSize } from '../types/character'
import type { DollBodyArtKey } from './paperDoll'

/** Continuous 0–1 physique controls for the paper doll. */
export type PhysiqueMorph = {
  /** Muscle / fitness. */
  muscle: number
  /** Soft tissue / weight. */
  fat: number
  /** Hip flare. */
  hipWidth: number
  /** Thigh / calf thickness. */
  legGirth: number
  /** Bust emphasis (approximate on baked breasts). */
  breastScale: number
}

export const DEFAULT_PHYSIQUE_MORPH: PhysiqueMorph = {
  muscle: 0.4,
  fat: 0.2,
  hipWidth: 0.5,
  legGirth: 0.5,
  breastScale: 0.5,
}

const BODY_TYPE_MORPH: Record<BodyType, PhysiqueMorph> = {
  Frail: { muscle: 0.08, fat: 0.08, hipWidth: 0.35, legGirth: 0.3, breastScale: 0.4 },
  Slim: { muscle: 0.18, fat: 0.12, hipWidth: 0.4, legGirth: 0.35, breastScale: 0.45 },
  Lithe: { muscle: 0.35, fat: 0.1, hipWidth: 0.42, legGirth: 0.4, breastScale: 0.45 },
  Fit: { muscle: 0.42, fat: 0.2, hipWidth: 0.5, legGirth: 0.5, breastScale: 0.5 },
  Athletic: { muscle: 0.68, fat: 0.14, hipWidth: 0.48, legGirth: 0.55, breastScale: 0.5 },
  Soft: { muscle: 0.18, fat: 0.55, hipWidth: 0.65, legGirth: 0.6, breastScale: 0.6 },
  Heavyset: { muscle: 0.28, fat: 0.75, hipWidth: 0.75, legGirth: 0.75, breastScale: 0.65 },
  Muscular: { muscle: 0.82, fat: 0.16, hipWidth: 0.5, legGirth: 0.65, breastScale: 0.5 },
  Burly: { muscle: 0.75, fat: 0.4, hipWidth: 0.65, legGirth: 0.75, breastScale: 0.55 },
  Giant: { muscle: 0.62, fat: 0.35, hipWidth: 0.7, legGirth: 0.8, breastScale: 0.55 },
}

const BREAST_SIZE_TO_MORPH: Record<EndowmentSize, number> = {
  Tiny: 0.12,
  Small: 0.28,
  Medium: 0.5,
  Large: 0.68,
  Huge: 0.84,
  Gargantuan: 1,
}

/** Art-key anchors in (muscle, fat) space for nearest-neighbor blending. */
const BODY_ART_POINTS: Record<DollBodyArtKey, { muscle: number; fat: number }> = {
  slim: { muscle: 0.18, fat: 0.12 },
  fit: { muscle: 0.42, fat: 0.2 },
  soft: { muscle: 0.22, fat: 0.65 },
  muscular: { muscle: 0.8, fat: 0.16 },
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function normalizePhysiqueMorph(
  partial?: Partial<PhysiqueMorph> | null,
  fallback: PhysiqueMorph = DEFAULT_PHYSIQUE_MORPH,
): PhysiqueMorph {
  return {
    muscle: clamp01(partial?.muscle ?? fallback.muscle),
    fat: clamp01(partial?.fat ?? fallback.fat),
    hipWidth: clamp01(partial?.hipWidth ?? fallback.hipWidth),
    legGirth: clamp01(partial?.legGirth ?? fallback.legGirth),
    breastScale: clamp01(partial?.breastScale ?? fallback.breastScale),
  }
}

export function defaultMorphFromBodyType(bodyType: BodyType | null | undefined): PhysiqueMorph {
  if (bodyType && BODY_TYPE_MORPH[bodyType]) return { ...BODY_TYPE_MORPH[bodyType] }
  return { ...DEFAULT_PHYSIQUE_MORPH }
}

export function breastMorphFromEndowmentSize(size: EndowmentSize | undefined): number {
  if (!size) return 0.5
  return BREAST_SIZE_TO_MORPH[size] ?? 0.5
}

export type BaseBlendStop = {
  bodyArt: DollBodyArtKey
  /** 0–1 contribution (stops sum to 1). */
  weight: number
}

/** Pick up to two nearest body arts and blend by inverse distance in muscle/fat space. */
export function resolveBaseBlend(morph: PhysiqueMorph): BaseBlendStop[] {
  const scored = (Object.keys(BODY_ART_POINTS) as DollBodyArtKey[]).map((bodyArt) => {
    const p = BODY_ART_POINTS[bodyArt]
    const d = Math.hypot(morph.muscle - p.muscle, morph.fat - p.fat)
    return { bodyArt, d }
  })
  scored.sort((a, b) => a.d - b.d)
  const a = scored[0]!
  const b = scored[1]!
  if (a.d < 0.04) return [{ bodyArt: a.bodyArt, weight: 1 }]
  const invA = 1 / Math.max(0.08, a.d)
  const invB = 1 / Math.max(0.08, b.d)
  const sum = invA + invB
  return [
    { bodyArt: a.bodyArt, weight: invA / sum },
    { bodyArt: b.bodyArt, weight: invB / sum },
  ]
}

export type MorphTransforms = {
  /** Bust clip overlay scale (1 = native). */
  bustScale: number
  /** Mild upper-torso scale when reducing bust (≤1). */
  upperScale: number
  hipScaleX: number
  legScaleX: number
  legScaleY: number
  /** Show enlarged bust clip overlay. */
  showBustOverlay: boolean
}

/** Map 0–1 morph sliders to CSS transform magnitudes. */
export function morphToTransforms(morph: PhysiqueMorph): MorphTransforms {
  const bust = 0.88 + morph.breastScale * 0.52 // 0.88 … 1.4
  return {
    bustScale: Math.max(1, bust),
    upperScale: Math.min(1, bust),
    hipScaleX: 0.86 + morph.hipWidth * 0.32,
    legScaleX: 0.88 + morph.legGirth * 0.28,
    legScaleY: 0.94 + morph.legGirth * 0.14,
    showBustOverlay: bust > 1.02,
  }
}
