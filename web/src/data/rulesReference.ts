/**
 * In-app rules copy distilled from project core mechanics docs.
 * Adjust here when markdown sources change.
 */

export interface OrgasmTableRow {
  rangeLabel: string
  intensity: string
  effect: string
}

export const ORGASM_TABLE_ROLL =
  'Roll d100 + your Sexuality bonus + your Wisdom modifier after a climax (when rules call for the Orgasm Table).'

export const ORGASM_TABLE: OrgasmTableRow[] = [
  {
    rangeLabel: '1–30',
    intensity: 'Mild',
    effect:
      'Afterglow — you have advantage on the next ability check you make within 1 minute.',
  },
  {
    rangeLabel: '31–70',
    intensity: 'Ecstatic',
    effect:
      'Gain temporary hit points equal to your character level + your Sexuality bonus; you are inspired for 1 hour (as the inspiration mechanic your table uses).',
  },
  {
    rangeLabel: '71–99',
    intensity: 'Transcendent',
    effect:
      'Cast one Eromancy spell you know of a level no greater than half your Sexuality bonus (rounded down) without expending a spell slot.',
  },
  {
    rangeLabel: '100+',
    intensity: 'Divine Rapture',
    effect:
      'Regain all Pleasure Points and gain one use of Legendary Resistance, which lasts until you finish a long rest.',
  },
]

export const PLEASURE_POINTS_RULES: string[] = [
  'Maximum Pleasure Points = maximum of your Sex Die + Constitution modifier + Sexuality bonus + character level.',
  'You begin each long rest at full PP.',
  'On a short rest, you recover PP equal to one roll of your Sex Die + your Constitution modifier (once per short rest, unless a feature says otherwise).',
  'Losing PP represents mounting arousal and overstimulation leading toward the brink.',
]

export const AROUSED_RULES: string[] = [
  'The Aroused condition is required before penetrative sex (Coital, Anal, and similar).',
  'While Aroused: advantage on Charisma checks against the source of your arousal; disadvantage on concentration checks.',
  'Creatures that are not Aroused have resistance to pleasure damage (half PP loss from those sources).',
]

export const ORGASM_SAVE_RULES: {
  title: string
  bullets: string[]
  outcomes: string[]
  natural20: string
} = {
  title: 'Orgasm saving throws (“le petit mort”)',
  bullets: [
    'When you are on the brink—usually at 50% of your maximum PP or fewer, or when an effect says so—you enter forced orgasm saves.',
    'DC = 10 + the attacker’s Sexuality bonus + the relevant ability modifier (as specified by the attack or scene).',
    'Roll d20 + your Constitution modifier + your Sexuality bonus.',
    'Track successes and failures separately, similar to death saving throws.',
  ],
  outcomes: [
    'Three successes — Edge: you retain 1 PP and may continue. Choose either to recover PP equal to one Sex Die roll + Constitution modifier, or reset your failure count to 0.',
    'Three failures — Climax: roll on the Orgasm Table and gain Refractory unless a feature ends it early.',
  ],
  natural20:
    'On a natural 20, you rally immediately: recover PP equal to one Sex Die roll + Constitution modifier and may continue without climaxing.',
}

export const REFRACTORY_RULES: string[] = [
  'After a climax (unless a natural 20 or feature says otherwise), you gain Refractory.',
  'While refractory: immune to pleasure damage; you cannot become Aroused; you cannot climax again.',
  'Once per encounter you may attempt a Sexuality check (DC 20). On a success, Refractory ends and you regain 1 PP.',
  'Otherwise Refractory ends when you finish a short or long rest.',
]

export const ORGASM_SPECIAL_RULES: string[] = [
  'Shared Pleasure: some features link PP pools during group scenes—follow the feature text.',
  'Edged: at half maximum PP or below, further pleasure forces orgasm saving throws.',
  'Voluntary edge: high Endurance checks may let a character hold back a climax intentionally, if your table uses that optional rule.',
]

export const SEXUALITY_BONUS_BY_LEVEL: { levelRange: string; bonus: string }[] = [
  { levelRange: 'Levels 1–4', bonus: '+2' },
  { levelRange: 'Levels 5–8', bonus: '+3' },
  { levelRange: 'Levels 9–12', bonus: '+4' },
  { levelRange: 'Levels 13–16', bonus: '+5' },
  { levelRange: 'Levels 17–20', bonus: '+6' },
]

export const SEXUALITY_BONUS_USES: string[] = [
  'Erotic Art checks',
  'Orgasm saving throws',
  'Fertility rolls',
  'Pleasure damage',
  'Carnal spell save DCs (where a rule references Sexuality)',
]

export const ABILITY_CARNAL_INTERPRETATION: { ability: string; text: string }[] = [
  { ability: 'Strength', text: 'Raw physical power, dominance, lifting or pinning, deep thrusting.' },
  { ability: 'Dexterity', text: 'Flexibility, grace, precision of touch, rhythmic motion.' },
  { ability: 'Constitution', text: 'Stamina, endurance, fertility, resistance to overstimulation.' },
  { ability: 'Intelligence', text: 'Erotic creativity, anatomical knowledge, tantric theory, improvisation.' },
  { ability: 'Wisdom', text: "Reading a partner's desires, sensing erogenous zones, pacing pleasure." },
  { ability: 'Charisma', text: 'Seduction, presence, commanding group dynamics.' },
]

export const KEY_CONDITIONS: { name: string; text: string }[] = [
  {
    name: 'Aroused',
    text: 'Required for penetrative sex. Advantage on Charisma checks toward the source; disadvantage on concentration.',
  },
  {
    name: 'Edged',
    text: 'At half maximum PP or fewer—orgasm saving throws begin on further pleasure.',
  },
  {
    name: 'Refractory',
    text: 'After climax unless recovered. Immune to pleasure, cannot become Aroused. Often ends on a DC 20 Sexuality check, short rest, or long rest.',
  },
]

export const FERTILITY_SUMMARY: string[] = [
  'Each character has a fertility bonus (default: Constitution modifier + Sexuality bonus; override on the sheet if your table applies racial or feature modifiers).',
  'Mothering types (Female, vagina-bearing, and other configurations that set impregnation DC): their fertility bonus is subtracted from 20 to set the DC impregnators must beat.',
  'Impregnators roll d20 + their fertility bonus. If the total meets or exceeds the mothering partner’s DC, conception succeeds.',
  'Example: mother with +5 fertility → DC 15; impregnator with +6 fertility rolls 10 on the d20 → total 16 → success.',
]

export const TABLE_SAFETY_GUIDELINES: { heading: string; bullets: string[] }[] = [
  {
    heading: 'Consent at the table',
    bullets: [
      'Fiction is not consent. Every player should know that stopping the game for any reason is welcome and respected.',
      'Establish how your group handles romantic or sexual content before scenes become detailed—session zero topics, lines and veils, and optional safety tools (X-card, script change, etc.).',
      'Prefer explicit enthusiastic agreement between players before introducing graphic material, and default to fading to black whenever anyone is uncertain.',
    ],
  },
  {
    heading: 'Separating mechanics from narration',
    bullets: [
      'Pleasure Points, orgasm saves, and ecstasy tables are dice mechanics. Describe outcomes in terms players are comfortable with.',
      'The app summarizes rules for reference; your table can rewrite intensity, tone, or prerequisites to match your social contract.',
    ],
  },
  {
    heading: 'When to skip mechanics',
    bullets: [
      'If the story does not need a full encounter, summarize with a single check or handwave recovery—save detailed resolution for moments the table wants spotlighted.',
    ],
  },
]

export const SPELLS_SECTION_INTRO =
  'Full spell descriptions (casting time, range, components, and detailed effects) will appear here as Eromancy content is finished. For now, the names below are pulled from homebrew carnal class data in this project so players can see what exists at a glance.'
