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
  Frail: 'Thin to the point of malnourishment. Base weight 50% of normal.',
  Slim: 'Skinny but not unhealthy. Base weight 70% of normal.',
  Lithe:
    'Compact and agile. Height mod + Dexterity modifier; base weight 70% of normal.',
  Fit: 'Durably built for function. No physique change.',
  Athletic:
    'Built for action. Base weight +10%; height mod + Strength modifier.',
  Soft: 'Shapely without purposeful muscle. Base weight +20%.',
  Heavyset: 'Softly built but robust. Base weight +50%.',
  Muscular: 'Built for strength and size. Base weight +20%.',
  Burly: 'Large stature and robust musculature. Base weight +30%.',
  Giant: 'Immense height and width. Base weight +30%; base height +1 foot.',
}

/**
 * Multiplier applied to the species table base weight (before height×weight mods).
 * Fit is the baseline (1.0).
 */
export const BODY_TYPE_BASE_WEIGHT_FACTOR: Record<BodyType, number> = {
  Frail: 0.5,
  Slim: 0.7,
  Lithe: 0.7,
  Fit: 1.0,
  Athletic: 1.1,
  Soft: 1.2,
  Heavyset: 1.5,
  Muscular: 1.2,
  Burly: 1.3,
  Giant: 1.3,
}

/** Extra inches added to species table base height for this body type. */
export const BODY_TYPE_BASE_HEIGHT_BONUS_INCHES: Record<BodyType, number> = {
  Frail: 0,
  Slim: 0,
  Lithe: 0,
  Fit: 0,
  Athletic: 0,
  Soft: 0,
  Heavyset: 0,
  Muscular: 0,
  Burly: 0,
  Giant: 12,
}

/** Which ability (if any) is added to the rolled height modifier. */
export const BODY_TYPE_HEIGHT_MOD_ABILITY: Partial<
  Record<BodyType, 'strength' | 'dexterity'>
> = {
  Lithe: 'dexterity',
  Athletic: 'strength',
}

/** @deprecated Prefer BODY_TYPE_BASE_WEIGHT_FACTOR — kept for older imports. */
export const BODY_TYPE_WEIGHT_FACTOR = BODY_TYPE_BASE_WEIGHT_FACTOR
