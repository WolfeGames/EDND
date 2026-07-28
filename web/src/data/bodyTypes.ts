/** Body build options (1d10 or player choice). */
export const BODY_TYPES = [
  'Frail',
  'Slim',
  'Lithe',
  'Fit',
  'Athletic',
  'Soft',
  'Heavyset',
  'Muscular',
  'Burly',
  'Giant',
] as const

export type BodyType = (typeof BODY_TYPES)[number]

export function isBodyType(value: string): value is BodyType {
  return (BODY_TYPES as readonly string[]).includes(value)
}

/** Index 0 unused; 1d10 maps 1–10 → BODY_TYPES[0–9]. */
export function bodyTypeFromD10(roll: number): BodyType {
  const n = Math.max(1, Math.min(10, Math.floor(roll)))
  return BODY_TYPES[n - 1]!
}

export const BODY_TYPE_DESCRIPTIONS: Record<BodyType, string> = {
  Frail: 'You are thin to the point of malnourishment and severely underweight.',
  Slim: 'You are skinny but not unhealthy.',
  Lithe: 'Your frame is compact but strong.',
  Fit: 'You are durably built for function.',
  Athletic: 'You are built for action and adventure.',
  Soft: 'You are shapely without purposeful muscle.',
  Heavyset: 'You are softly built but robust in stature.',
  Muscular: 'You are built for strength and size.',
  Burly: 'You are large in stature and robust in musculature.',
  Giant: 'You are immense in height and width, packed with muscle.',
}

/**
 * Multiplier applied to the traditional D&D rolled weight after height×weight mods.
 * Fit is the baseline (1.0).
 */
export const BODY_TYPE_WEIGHT_FACTOR: Record<BodyType, number> = {
  Frail: 0.72,
  Slim: 0.85,
  Lithe: 0.92,
  Fit: 1.0,
  Athletic: 1.06,
  Soft: 1.12,
  Heavyset: 1.24,
  Muscular: 1.2,
  Burly: 1.35,
  Giant: 1.55,
}
