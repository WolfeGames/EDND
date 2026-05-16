import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { getCarnalClass, getSexualHistory, getSpecies } from '../data/registry'
import {
  characterHasEndowedTrait,
  getSheetEndowmentProfile,
} from '../lib/endowedTrait'
import {
  ENDOWMENT_SIZE_RULE,
  formatEndowmentLines,
} from '../lib/endowment'
import { formatRuleKey } from '../lib/formatRuleKey'
import { parseFeatureLevelRequirement } from '../lib/parseFeatureLevelRequirement'
import { resolveCarnalTraitLabels } from '../lib/resolveCarnalTraitLabels'
import { splitHistoryFeatureBody } from '../lib/sexualHistoryFeatureDisplay'
import {
  abilityModifier,
  deriveBeautyClass,
  highestAbilityModifier,
} from '../lib/abilityScores'
import { isCanonicalBiologicalSex } from '../lib/biologicalSex'
import { resolveSpeciesTableId } from '../lib/speciesAliases'
import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'
import type { AbilityScores, EdndCharacter } from '../types/character'
import type { CarnalClassRow } from '../types/tables'
import { RacialSexualTraitsPanel } from './RacialSexualTraitsPanel'
import { SpeciesPortrait } from './SpeciesPortrait'
import './CharacterSummary.css'

const ABILITY_WORD_TO_KEY: Record<string, keyof AbilityScores> = {
  strength: 'strength',
  str: 'strength',
  dexterity: 'dexterity',
  dex: 'dexterity',
  constitution: 'constitution',
  con: 'constitution',
  intelligence: 'intelligence',
  int: 'intelligence',
  wisdom: 'wisdom',
  wis: 'wisdom',
  charisma: 'charisma',
  cha: 'charisma',
}

const DUNGEON_TEASERS = [
  'Torchlight trembles across sweat-slick stone; a stranger’s breath ghosts your collar before the first die ever hits the table.',
  'The corridor narrows; velvet echoes replace footsteps, and every shadow seems to lean closer, curious where your pulse races loudest.',
  'A chain rattles somewhere ahead—not threat, invitation—measured like a metronome for what you might surrender willingly.',
  'Cool air lifts the hem of resolve; warmth returns in slow tides, mapping the map you thought you knew onto unfamiliar skin.',
  'The door groans open on incense and iron; consent is whispered twice, then carved into the moment like a pact you already signed with your body.',
  'Dice skitter, laughter follows, and the dungeon exhales a humid sigh that tastes of promise and peril in equal measure.',
  'You catch your reflection in a dark mirror—eyes too bright, lips parted—and the maze answers with a pulse that is not quite your own.',
  'Somewhere deeper, a fountain runs; the sound is obscene in its patience, counting heartbeats until you choose to drink.',
  'Leather, wax, and ozone braid in the air; each step writes a new stanza on your nerves, delicate as lace, stubborn as chain.',
  'The encounter has not begun, yet your skin already keeps score—anticipation pooling where the rules say only steel should touch.',
]

function pickTeaserLines(count: number): string[] {
  const pool = [...DUNGEON_TEASERS]
  const out: string[] = []
  const n = Math.min(count, pool.length)
  for (let i = 0; i < n; i++) {
    const j = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(j, 1)[0])
  }
  return out
}

function parseStartingPleasureMax(
  scores: AbilityScores,
  raw: string,
): number | null {
  const m = raw.match(
    /^(\d+)\s*\+\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+modifier\b/i,
  )
  if (!m) return null
  const base = parseInt(m[1], 10)
  const key = ABILITY_WORD_TO_KEY[m[2].toLowerCase()]
  if (!key) return null
  return Math.max(1, base + abilityModifier(scores[key]))
}

function resolvePleasureMeta(
  character: EdndCharacter,
  cls: CarnalClassRow | undefined,
): { label: string; max: number } {
  if (cls?.startingPleasurePoints) {
    const parsed = parseStartingPleasureMax(
      character.abilityScores,
      cls.startingPleasurePoints,
    )
    if (parsed !== null) {
      return { label: cls.startingPleasurePoints, max: parsed }
    }
  }
  const primary = cls?.primarySexualAbility?.trim()
  let mod = highestAbilityModifier(character.abilityScores)
  if (primary) {
    const key = ABILITY_WORD_TO_KEY[primary.toLowerCase()]
    if (key) mod = abilityModifier(character.abilityScores[key])
  }
  const max = Math.max(
    6,
    8 + character.level + Math.max(0, mod) + character.eroticTraits.sexualityBonus,
  )
  return {
    label: cls
      ? 'Estimated maximum (no explicit pleasure formula on this class).'
      : 'Estimated maximum (choose a carnal class for precise pleasure scaling).',
    max,
  }
}

function stablePleasureCurrent(characterId: string, max: number): number {
  if (max <= 1) return 0
  let h = 0
  for (let i = 0; i < characterId.length; i++) h = (h * 31 + characterId.charCodeAt(i)) >>> 0
  const frac = 0.52 + ((h % 41) / 100) * 0.38
  return Math.max(1, Math.min(max - 1, Math.round(max * frac)))
}

function traitHoverTitle(name: string, description: string): string {
  const pulse =
    ' · On the skin of memory, this trait thrums—inviting touch, gaze, and consequence in equal measure.'
  return `${name}\n\n${description}${pulse}`
}

function FeatureRuleBlock({
  ruleKey,
  text,
  characterLevel,
  heading,
}: {
  ruleKey: string
  text: string
  characterLevel: number
  heading?: string
}) {
  const req = parseFeatureLevelRequirement(ruleKey)
  const unlocked = req === null || characterLevel >= req
  return (
    <div
      className={`feature-block ${unlocked ? 'feature-block--unlocked' : 'feature-block--locked'}`}
    >
      <div className="feature-heading">
        <span className="feature-heading-title">{heading ?? formatRuleKey(ruleKey)}</span>
        {req !== null && (
          <span className="feature-level-pill" title={`Requires character level ${req}`}>
            Lv {req}+
          </span>
        )}
        {unlocked && req !== null && (
          <span className="feature-unlocked-tag">At your level</span>
        )}
      </div>
      {!unlocked && req !== null && (
        <p className="feature-status">
          Locked — character is level {characterLevel}; unlocks at level {req}.
        </p>
      )}
      <p className="feature-body">{text}</p>
    </div>
  )
}

export function CharacterSummary({ character }: { character: EdndCharacter }) {
  const teaserTitleId = useId()
  const [teaserOpen, setTeaserOpen] = useState(false)
  const [teaserLines, setTeaserLines] = useState<string[]>([])
  const [ppWave, setPpWave] = useState(0)

  const speciesRow = useMemo(
    () => (character.species ? getSpecies(character.species) : undefined),
    [character.species],
  )
  const resolvedSpeciesId = useMemo(
    () => (character.species ? resolveSpeciesTableId(character.species) : ''),
    [character.species],
  )
  const historyRow = useMemo(
    () =>
      character.sexualHistory ? getSexualHistory(character.sexualHistory) : undefined,
    [character.sexualHistory],
  )
  const carnalClassRow = useMemo(
    () => (character.carnalClass ? getCarnalClass(character.carnalClass) : undefined),
    [character.carnalClass],
  )
  const { resolved: resolvedCarnalTraits, unresolved: unresolvedCarnalLabels } = useMemo(
    () => resolveCarnalTraitLabels(historyRow?.carnalTraits ?? []),
    [historyRow],
  )
  const endowmentReadout = useMemo(() => {
    const e = getSheetEndowmentProfile(character)
    return formatEndowmentLines(e)
  }, [character])

  const endowedActive = useMemo(() => characterHasEndowedTrait(character), [character])

  const highestMod = useMemo(
    () => highestAbilityModifier(character.abilityScores),
    [character.abilityScores],
  )

  const beautyFormulaValue = useMemo(
    () => deriveBeautyClass(character.abilityScores, character.eroticTraits.beautyModifier),
    [character.abilityScores, character.eroticTraits.beautyModifier],
  )

  const beautyTooltip = useMemo(() => {
    const bc = character.eroticTraits.beautyClass
    const bm = character.eroticTraits.beautyModifier
    return [
      'Beauty class sums your presence, allure, and how the world reads your desirability.',
      '',
      `Formula: 10 + highest ability modifier (${highestMod}) + beauty modifier from tables and features (${bm}).`,
      `Recomputed baseline: ${beautyFormulaValue}.`,
      bc === beautyFormulaValue
        ? 'Stored value matches the formula.'
        : `Note: sheet shows ${bc}; if this differs from ${beautyFormulaValue}, re-apply rules or refresh the character.`,
    ].join('\n')
  }, [
    beautyFormulaValue,
    character.eroticTraits.beautyClass,
    character.eroticTraits.beautyModifier,
    highestMod,
  ])

  const pleasureMeta = useMemo(
    () => resolvePleasureMeta(character, carnalClassRow),
    [character, carnalClassRow],
  )

  const speciesDisplayName = speciesRow?.name ?? (character.species?.trim() || '—')

  const heroPortraitSrc = useMemo(() => {
    if (!resolvedSpeciesId || !isCanonicalBiologicalSex(character.genderIdentity)) {
      return null
    }
    return getDefaultSpeciesPortraitSrc(resolvedSpeciesId, character.genderIdentity)
  }, [resolvedSpeciesId, character.genderIdentity])

  const portraitAlt = speciesDisplayName !== '—' ? `${speciesDisplayName} portrait` : ''

  const pleasureCurrent = useMemo(
    () => stablePleasureCurrent(character.id, pleasureMeta.max),
    [character.id, pleasureMeta.max],
  )

  const pleasurePct = useMemo(() => {
    if (pleasureMeta.max <= 0) return 0
    return Math.min(100, Math.round((pleasureCurrent / pleasureMeta.max) * 1000) / 10)
  }, [pleasureCurrent, pleasureMeta.max])

  const sexDieLabel = useMemo(() => {
    if (!carnalClassRow) return '—'
    return carnalClassRow.sexDie ?? `d${carnalClassRow.hitDie}`
  }, [carnalClassRow])

  const stimulationList = carnalClassRow?.stimulationProficiencies ?? []
  const positionList = character.eroticTraits.positionProficiencies

  const openTeaser = useCallback(() => {
    setTeaserLines(pickTeaserLines(3))
    setTeaserOpen(true)
    setPpWave((w) => w + 1)
  }, [])

  const closeTeaser = useCallback(() => setTeaserOpen(false), [])

  useEffect(() => {
    if (!teaserOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTeaser()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeTeaser, teaserOpen])

  return (
    <div className="character-summary immersive-sheet">
      <div className="immersive-sheet__ambient" aria-hidden />
      <div className="immersive-sheet__particles" aria-hidden />

      <header
        className={
          heroPortraitSrc
            ? 'immersive-hero immersive-hero--with-portrait'
            : 'immersive-hero'
        }
      >
        {heroPortraitSrc && resolvedSpeciesId ? (
          <SpeciesPortrait
            speciesId={resolvedSpeciesId}
            genderIdentity={character.genderIdentity}
            alt={portraitAlt}
            className="immersive-hero__portrait"
            imgClassName="immersive-hero__portrait-img"
          />
        ) : null}
        <div className="immersive-hero__identity">
          <p className="immersive-hero__eyebrow">Character veil</p>
          <h2 className="immersive-hero__title">
            {character.name || 'Unnamed desire'}
            <span className="immersive-hero__sub">
              {speciesDisplayName}
              {' · '}
              Level {character.level}
              {' · '}
              {character.adventuringClass || '—'}
              {carnalClassRow ? ` · ${carnalClassRow.name}` : ''}
            </span>
          </h2>
          <p className="immersive-hero__species" aria-label="Species">
            <span className="immersive-hero__species-label">Species</span>{' '}
            <span className="immersive-hero__species-value">{speciesDisplayName}</span>
          </p>
          <div className="immersive-hero__chips">
            {character.pronouns && (
              <span className="immersive-chip">{character.pronouns}</span>
            )}
            {character.genderIdentity && (
              <span className="immersive-chip">{character.genderIdentity}</span>
            )}
          </div>
        </div>

        <div className="immersive-hero__beauty" title={beautyTooltip}>
          <span className="immersive-hero__beauty-label">Beauty class</span>
          <span className="immersive-hero__beauty-value">
            {character.eroticTraits.beautyClass}
          </span>
          <span className="immersive-hero__beauty-hint">Hover for the math</span>
        </div>

        <div className="immersive-hero__cta">
          <button
            type="button"
            className="btn-dungeon"
            onClick={openTeaser}
            aria-expanded={teaserOpen}
            aria-controls={teaserTitleId}
          >
            Enter the Dungeon
          </button>
        </div>
      </header>

      <section className="immersive-meters" aria-label="Pleasure reserve">
        <div className="immersive-meters__head">
          <span className="immersive-meters__title">Pleasure points</span>
          <span className="immersive-meters__meta">
            {pleasureCurrent} / {pleasureMeta.max}
          </span>
        </div>
        <p className="immersive-meters__rule muted">{pleasureMeta.label}</p>
        <div className="ecstasy-meter" key={ppWave}>
          <div className="ecstasy-meter__glow" aria-hidden />
          <div
            className="ecstasy-meter__fill"
            style={{ width: `${pleasurePct}%` }}
            role="progressbar"
            aria-valuenow={pleasureCurrent}
            aria-valuemin={0}
            aria-valuemax={pleasureMeta.max}
            aria-label="Pleasure reserve fill"
          />
          <div className="ecstasy-meter__sheen" aria-hidden />
        </div>
        <p className="immersive-meters__whisper muted">
          Illustrative reserve for the sheet—track current PP in play as your table prefers.
        </p>
      </section>

      <section className="immersive-key-stats" aria-label="Key carnal stats">
        <div className="immersive-stat-card immersive-stat-card--die">
          <span className="immersive-stat-card__label">Sex die</span>
          <span className="immersive-stat-card__value">{sexDieLabel}</span>
          <span className="immersive-stat-card__note muted">
            {carnalClassRow ? 'From carnal class' : 'Select a carnal class'}
          </span>
        </div>
        <div className="immersive-stat-card">
          <span className="immersive-stat-card__label">Stimulation proficiencies</span>
          <span className="immersive-stat-card__value immersive-stat-card__value--list">
            {stimulationList.length ? stimulationList.join(' · ') : '—'}
          </span>
          <span className="immersive-stat-card__note muted">Class training</span>
        </div>
        <div className="immersive-stat-card">
          <span className="immersive-stat-card__label">Position proficiencies</span>
          <span className="immersive-stat-card__value immersive-stat-card__value--list">
            {positionList.length ? positionList.join(' · ') : '—'}
          </span>
          <span className="immersive-stat-card__note muted">Merged from history &amp; class</span>
        </div>
      </section>

      <div className="review-section immersive-identity immersive-panel">
        <h3>Identity</h3>
        <ul className="review-list">
          <li>
            <strong>{character.name || '—'}</strong>, level {character.level}{' '}
            {character.adventuringClass || '—'}
          </li>
          {character.background && <li>Background: {character.background}</li>}
          {character.pronouns && <li>Pronouns: {character.pronouns}</li>}
          {character.genderIdentity && <li>Biological sex: {character.genderIdentity}</li>}
          <li>
            <strong>Ability scores:</strong> STR {character.abilityScores.strength}, DEX{' '}
            {character.abilityScores.dexterity}, CON {character.abilityScores.constitution}, INT{' '}
            {character.abilityScores.intelligence}, WIS {character.abilityScores.wisdom}, CHA{' '}
            {character.abilityScores.charisma}
          </li>
          <li>
            <strong>Endowment</strong>
            <div className="immersive-endo-block">
              {endowmentReadout.map((line, i) => (
                <div key={`endo-${i}`}>{line}</div>
              ))}
            </div>
            <p className="muted immersive-endo-note">
              {ENDOWMENT_SIZE_RULE}
              {endowedActive && (
                <span>
                  {' '}
                  <strong>Endowed</strong> is applied here: bust and/or phallus sizes are shown one
                  tier larger (max Gargantuan) than stored on the JSON export.
                </span>
              )}
            </p>
          </li>
        </ul>
      </div>

      <div className="review-section immersive-species-erotic immersive-panel">
        <h3>Species &amp; erotic profile</h3>
        {speciesRow ? (
          <>
            <h4 className="immersive-subheading">Species — {speciesRow.name}</h4>
            <ul className="review-list">
              <li>
                Size {speciesRow.size}, speed {speciesRow.speed} ft.
              </li>
              {speciesRow.eroticGrants.length > 0 && (
                <li>Erotic art grants: {speciesRow.eroticGrants.join(', ')}</li>
              )}
              <li>{speciesRow.description}</li>
            </ul>
            <div className="trait-card trait-card--species immersive-trait">
              <strong>Species carnal trait — {speciesRow.carnalTrait}</strong>
              <p className="feature-body">{speciesRow.carnalTraitDescription}</p>
            </div>
            <RacialSexualTraitsPanel speciesId={character.species} />
          </>
        ) : (
          <p className="muted">No species selected.</p>
        )}
        <h4 className="immersive-subheading">Beauty &amp; drive</h4>
        <ul className="review-list">
          <li>
            Beauty class <strong>{character.eroticTraits.beautyClass}</strong>
          </li>
          <li>Sexuality bonus: +{character.eroticTraits.sexualityBonus}</li>
        </ul>
        <h4 className="immersive-subheading">Proficiencies</h4>
        <ul className="review-list">
          <li>
            Carnal skills / erotic arts:{' '}
            {character.eroticTraits.carnalSkillProficiencies.length
              ? character.eroticTraits.carnalSkillProficiencies.join(', ')
              : '—'}
          </li>
          <li>
            Positions:{' '}
            {character.eroticTraits.positionProficiencies.length
              ? character.eroticTraits.positionProficiencies.join(', ')
              : '—'}
          </li>
          {character.eroticTraits.eroticToolProficiencies.length > 0 && (
            <li>Tools: {character.eroticTraits.eroticToolProficiencies.join(', ')}</li>
          )}
        </ul>
        {(character.eroticTraits.attraction ||
          character.eroticTraits.repulsion ||
          character.eroticTraits.sexualMorality ||
          character.eroticTraits.orientation) && (
          <>
            <h4 className="immersive-subheading">Attraction &amp; boundaries</h4>
            <ul className="review-list">
              {character.eroticTraits.attraction && (
                <li>Attraction: {character.eroticTraits.attraction}</li>
              )}
              {character.eroticTraits.repulsion && (
                <li>Repulsion: {character.eroticTraits.repulsion}</li>
              )}
              {character.eroticTraits.sexualMorality && (
                <li>Morality: {character.eroticTraits.sexualMorality}</li>
              )}
              {character.eroticTraits.orientation && (
                <li>Orientation: {character.eroticTraits.orientation}</li>
              )}
            </ul>
          </>
        )}
      </div>

      {historyRow && (
        <section className="immersive-history immersive-panel">
          <div className="immersive-history__head">
            <h3 className="immersive-history__title">Sexual history</h3>
            <span className="immersive-history__name">{historyRow.name}</span>
            {historyRow.traitPoints != null ? (
              <span className="immersive-history__trait-points">
                {historyRow.traitPoints} trait points
              </span>
            ) : null}
          </div>
          <p className="immersive-history__desc">{historyRow.description}</p>

          <h4 className="immersive-subheading">Equipped carnal traits</h4>
          {resolvedCarnalTraits.length === 0 && unresolvedCarnalLabels.length === 0 ? (
            <p className="muted">No traits resolved from this history.</p>
          ) : (
            <div className="immersive-trait-grid">
              {resolvedCarnalTraits.map((t) => (
                <div
                  key={t.id}
                  className="trait-card immersive-trait"
                  title={traitHoverTitle(t.name, t.description)}
                >
                  <strong>{t.name}</strong>
                  <p className="feature-body">{t.description}</p>
                </div>
              ))}
            </div>
          )}
          {unresolvedCarnalLabels.length > 0 && (
            <p className="muted immersive-trait-unresolved">
              Not in table yet:{' '}
              {unresolvedCarnalLabels.map((u) => (
                <span key={u} className="unresolved-pill">
                  {u}
                </span>
              ))}
            </p>
          )}

          <h4 className="immersive-subheading">History features</h4>
          <div className="feature-list">
            {Object.entries(historyRow.features).map(([k, v]) => {
              const split = splitHistoryFeatureBody(v)
              return (
                <FeatureRuleBlock
                  key={k}
                  ruleKey={k}
                  text={split ? split.body : v}
                  heading={
                    split ? `${formatRuleKey(k)} — ${split.titleLine}` : undefined
                  }
                  characterLevel={character.level}
                />
              )
            })}
          </div>

          <h4 className="immersive-subheading">Equipment from history</h4>
          <ul className="review-list">
            {historyRow.equipment.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {character.sexualHistoryPersonality && (
            <>
              <h4 className="immersive-subheading">Personality (chosen)</h4>
              <ul className="review-list">
                <li>
                  <strong>Trait:</strong> {character.sexualHistoryPersonality.trait || '—'}
                </li>
                <li>
                  <strong>Ideal:</strong> {character.sexualHistoryPersonality.ideal || '—'}
                </li>
                <li>
                  <strong>Bond:</strong> {character.sexualHistoryPersonality.bond || '—'}
                </li>
                <li>
                  <strong>Flaw:</strong> {character.sexualHistoryPersonality.flaw || '—'}
                </li>
              </ul>
            </>
          )}
        </section>
      )}

      {carnalClassRow && (
        <section className="immersive-carnal immersive-panel">
          <div className="immersive-carnal__banner">
            <div>
              <p className="immersive-carnal__eyebrow">Carnal class</p>
              <h3 className="immersive-carnal__name">{carnalClassRow.name}</h3>
              <p className="immersive-carnal__tagline muted">{carnalClassRow.description}</p>
            </div>
            <ul className="immersive-carnal__quick muted">
              <li>Hit die d{carnalClassRow.hitDie}</li>
              {carnalClassRow.primarySexualAbility && (
                <li>Primary {carnalClassRow.primarySexualAbility}</li>
              )}
              {carnalClassRow.eroticAptitude && (
                <li>Aptitude {carnalClassRow.eroticAptitude}</li>
              )}
            </ul>
          </div>

          <details className="immersive-carnal__features">
            <summary className="immersive-carnal__summary">
              Level features
              <span className="immersive-carnal__chev" aria-hidden />
            </summary>
            <div className="feature-list immersive-carnal__feature-list">
              {Object.entries(carnalClassRow.features).map(([k, v]) => (
                <FeatureRuleBlock
                  key={k}
                  ruleKey={k}
                  text={typeof v === 'string' ? v : `${v.name}: ${v.description}`}
                  characterLevel={character.level}
                />
              ))}
            </div>
          </details>
          {carnalClassRow.subclasses.length > 0 && (
            <p className="muted">
              Subclasses:{' '}
              {carnalClassRow.subclasses
                .map((s) => (typeof s === 'string' ? s : s.name))
                .join(', ')}
            </p>
          )}
        </section>
      )}

      {teaserOpen && (
        <div
          className="sheet-teaser-overlay"
          role="presentation"
          onClick={closeTeaser}
        >
          <div
            className="sheet-teaser-dialog immersive-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={teaserTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={teaserTitleId} className="sheet-teaser-dialog__title">
              Encounter teaser
            </h3>
            <p className="sheet-teaser-dialog__lede muted">
              A consent-forward glimpse—fiction for the table, not a command.
            </p>
            <div className="sheet-teaser-dialog__body">
              {teaserLines.map((line, i) => (
                <p key={i} className="sheet-teaser-dialog__stanza">
                  {line}
                </p>
              ))}
            </div>
            <button type="button" className="btn btn-primary sheet-teaser-dialog__close" onClick={closeTeaser}>
              Draw breath
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
