import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
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
import { computeBeautyClassBreakdown } from '../lib/beautyClassCompute'
import { calculateMaxPleasure, sexDieLabel } from '../mechanics'
import { isCanonicalBiologicalSex } from '../lib/biologicalSex'
import {
  formatRacialTraitBody,
  getRacialSexualTraitSections,
} from '../lib/racialSexualTraits'
import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'
import type { EdndCharacter } from '../types/character'
import type { SexualHistoryRow } from '../types/tables'
import { EncounterCalculator } from './EncounterCalculator'
import { SpeciesPortrait } from './SpeciesPortrait'
import './CharacterSummary.css'

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

function traitHoverTitle(name: string, description: string): string {
  const pulse =
    ' · On the skin of memory, this trait thrums—inviting touch, gaze, and consequence in equal measure.'
  return `${name}\n\n${description}${pulse}`
}

function historySpotlightFeatures(row: SexualHistoryRow) {
  return Object.entries(row.features)
    .map(([key, text]) => {
      const level = parseFeatureLevelRequirement(key)
      const split = splitHistoryFeatureBody(text)
      return {
        key,
        level: level ?? 99,
        title: split?.titleLine ?? formatRuleKey(key),
        body: split?.body ?? text,
      }
    })
    .sort((a, b) => a.level - b.level)
    .slice(0, 3)
}

function LushCollapse({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string
  badge?: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="lush-collapse" open={defaultOpen || undefined}>
      <summary className="lush-collapse__summary">
        <span className="lush-collapse__title">{title}</span>
        {badge ? <span className="lush-collapse__badge">{badge}</span> : null}
        <span className="lush-collapse__chev" aria-hidden />
      </summary>
      <div className="lush-collapse__body">{children}</div>
    </details>
  )
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
  const [encounterOpen, setEncounterOpen] = useState(false)
  const [teaserLines, setTeaserLines] = useState<string[]>([])
  const [previewPleasureRemaining, setPreviewPleasureRemaining] = useState<number | null>(
    null,
  )

  const speciesRow = useMemo(
    () => (character.species ? getSpecies(character.species) : undefined),
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

  const beautyBreakdown = useMemo(() => computeBeautyClassBreakdown(character), [character])

  const beautyDisplay = character.beautyClass ?? beautyBreakdown.total

  const beautyTooltip = useMemo(
    () =>
      [
        'Beauty Class — full calculation',
        '',
        `Base: ${beautyBreakdown.base}`,
        `Highest ability modifier: +${beautyBreakdown.abilityMod}`,
        `Other modifiers (equipment, magic, temp): +${beautyBreakdown.manualModifier}`,
        `Racial & sexual history features: +${beautyBreakdown.traitBonus}`,
        '————————————',
        `Total: ${beautyBreakdown.total}`,
        '',
        'Hover anywhere on the crown to recall this breakdown.',
      ].join('\n'),
    [beautyBreakdown],
  )

  const racialSections = useMemo(
    () => getRacialSexualTraitSections(character.race || character.species || ''),
    [character.race, character.species],
  )

  const historyFeatures = useMemo(
    () => (historyRow ? historySpotlightFeatures(historyRow) : []),
    [historyRow],
  )

  const raceDisplayName =
    speciesRow?.name ?? ((character.race || character.species || '—').trim() || '—')

  const pleasureMeta = useMemo(() => {
    const result = calculateMaxPleasure(character)
    return { label: result.formula, max: result.max }
  }, [character])

  const speciesDisplayName = speciesRow?.name ?? (character.species?.trim() || '—')

  const heroPortraitSrc = useMemo(() => {
    if (!character.species?.trim() || !isCanonicalBiologicalSex(character.genderIdentity)) {
      return null
    }
    return getDefaultSpeciesPortraitSrc(character.species, character.genderIdentity)
  }, [character.species, character.genderIdentity])

  const portraitAlt = speciesDisplayName !== '—' ? `${speciesDisplayName} portrait` : ''

  /** PP = max pleasure the character can withstand; starts full and drops when they receive pleasure. */
  const pleasureRemaining = previewPleasureRemaining ?? pleasureMeta.max

  const sexDieDisplay = useMemo(() => sexDieLabel(character), [character])

  const stimulationList = carnalClassRow?.stimulationProficiencies ?? []
  const positionList = character.eroticTraits.positionProficiencies

  const openTeaser = useCallback(() => {
    setTeaserLines(pickTeaserLines(3))
    setTeaserOpen(true)
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

      <section className="beauty-crown lush-panel" aria-label="Beauty class" title={beautyTooltip}>
        <p className="beauty-crown__label">Beauty class</p>
        <p className="beauty-crown__value">{beautyDisplay}</p>
        <p className="beauty-crown__hint muted">Hover for full calculation</p>
        <ul className="beauty-crown__breakdown muted">
          <li>
            {beautyBreakdown.base} base + {beautyBreakdown.abilityMod} ability
            {beautyBreakdown.manualModifier !== 0
              ? ` + ${beautyBreakdown.manualModifier} other`
              : ''}
            {beautyBreakdown.traitBonus > 0
              ? ` + ${beautyBreakdown.traitBonus} traits`
              : ''}
          </li>
        </ul>
      </section>

      <header
        className={
          heroPortraitSrc
            ? 'immersive-hero immersive-hero--with-portrait'
            : 'immersive-hero'
        }
      >
        {heroPortraitSrc ? (
          <SpeciesPortrait
            speciesId={character.species}
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

        <div className="immersive-hero__cta immersive-hero__cta--row">
          <button
            type="button"
            className="btn-encounter"
            onClick={() => {
              setPreviewPleasureRemaining(null)
              setEncounterOpen(true)
            }}
          >
            Test encounter
          </button>
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

      <section className="immersive-meters" aria-label="Pleasure points capacity">
        <div className="immersive-meters__head">
          <span className="immersive-meters__title">Pleasure points</span>
          <span className="immersive-meters__meta">
            {pleasureRemaining} / {pleasureMeta.max} remaining
          </span>
        </div>
        <p className="immersive-meters__capacity muted">
          Maximum pleasure you can withstand before climax checks apply.
        </p>
        <p className="immersive-meters__rule muted">{pleasureMeta.label}</p>
        <p className="immersive-meters__whisper muted">
          Receiving pleasure reduces remaining PP. Use Test encounter to simulate stimulation.
        </p>
      </section>

      <div className="immersive-spotlight">
        {historyRow ? (
          <article className="lush-card lush-card--history lush-panel">
            <header className="lush-card__head">
              <span className="lush-card__eyebrow">Sexual history</span>
              <h3 className="lush-card__title">{historyRow.name}</h3>
              {historyRow.traitPoints != null ? (
                <span className="lush-card__meta">{historyRow.traitPoints} trait points</span>
              ) : null}
            </header>
            <p className="lush-card__theme">{historyRow.description}</p>
            <ol className="lush-card__features">
              {historyFeatures.map((f) => (
                <li key={f.key} className="lush-feature">
                  <span className="lush-feature__level">Lv {f.level === 99 ? '?' : f.level}</span>
                  <strong className="lush-feature__name">{f.title}</strong>
                  <p className="lush-feature__body feature-body">{f.body}</p>
                </li>
              ))}
            </ol>
          </article>
        ) : (
          <article className="lush-card lush-card--empty lush-panel">
            <p className="muted">No sexual history selected.</p>
          </article>
        )}

        {racialSections.length > 0 ? (
          <article className="lush-card lush-card--race lush-panel">
            <header className="lush-card__head">
              <span className="lush-card__eyebrow">Race</span>
              <h3 className="lush-card__title">{raceDisplayName}</h3>
            </header>
            {racialSections.map((sec) => (
              <div key={sec.groupId} className="lush-race-group">
                <h4 className="lush-race-group__title">{sec.name}</h4>
                <p className="lush-race-group__theme muted">{sec.theme}</p>
                <ul className="lush-race-group__traits">
                  {sec.traits.map((t) => (
                    <li key={t.name} className="lush-race-trait immersive-trait">
                      <strong>{t.name}</strong>
                      <p className="feature-body">{formatRacialTraitBody(t)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </article>
        ) : (
          <article className="lush-card lush-card--empty lush-panel">
            <p className="muted">No race selected.</p>
          </article>
        )}
      </div>

      <LushCollapse
        title="Carnal traits"
        badge={
          resolvedCarnalTraits.length
            ? String(resolvedCarnalTraits.length)
            : unresolvedCarnalLabels.length
              ? `${unresolvedCarnalLabels.length}?`
              : undefined
        }
      >
        {resolvedCarnalTraits.length === 0 && unresolvedCarnalLabels.length === 0 ? (
          <p className="muted">No traits from history.</p>
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
            Not in table:{' '}
            {unresolvedCarnalLabels.map((u) => (
              <span key={u} className="unresolved-pill">
                {u}
              </span>
            ))}
          </p>
        )}
      </LushCollapse>

      <LushCollapse
        title="Stimulation & position proficiencies"
        badge={String(stimulationList.length + positionList.length)}
        defaultOpen
      >
        <div className="lush-prof-grid">
          <div>
            <h4 className="immersive-subheading">Stimulation</h4>
            <p>{stimulationList.length ? stimulationList.join(' · ') : '—'}</p>
          </div>
          <div>
            <h4 className="immersive-subheading">Positions</h4>
            <p>{positionList.length ? positionList.join(' · ') : '—'}</p>
          </div>
          <div>
            <h4 className="immersive-subheading">Sex die</h4>
            <p className="lush-sex-die">{sexDieDisplay}</p>
          </div>
        </div>
      </LushCollapse>

      <LushCollapse title="Identity & endowment">
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
                  <strong>Endowed</strong> sizes display one tier larger on the sheet than in
                  export JSON.
                </span>
              )}
            </p>
          </li>
        </ul>
      </LushCollapse>

      <LushCollapse title="Species mechanics" badge={speciesRow ? '1' : undefined}>
        {speciesRow ? (
          <>
            <ul className="review-list">
              <li>
                Size {speciesRow.size}, speed {speciesRow.speed} ft.
              </li>
              {speciesRow.eroticGrants.length > 0 && (
                <li>Erotic grants: {speciesRow.eroticGrants.join(', ')}</li>
              )}
              <li>{speciesRow.description}</li>
            </ul>
            <div className="trait-card trait-card--species immersive-trait">
              <strong>{speciesRow.carnalTrait}</strong>
              <p className="feature-body">{speciesRow.carnalTraitDescription}</p>
            </div>
          </>
        ) : (
          <p className="muted">No species.</p>
        )}
      </LushCollapse>

      <LushCollapse title="Erotic arts & tools">
        <ul className="review-list">
          <li>
            Arts:{' '}
            {character.eroticTraits.carnalSkillProficiencies.length
              ? character.eroticTraits.carnalSkillProficiencies.join(', ')
              : '—'}
          </li>
          {character.eroticTraits.eroticToolProficiencies.length > 0 && (
            <li>Tools: {character.eroticTraits.eroticToolProficiencies.join(', ')}</li>
          )}
          <li>Sexuality bonus: +{character.eroticTraits.sexualityBonus}</li>
        </ul>
        {(character.eroticTraits.attraction ||
          character.eroticTraits.repulsion ||
          character.eroticTraits.sexualMorality ||
          character.eroticTraits.orientation) && (
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
        )}
      </LushCollapse>

      {historyRow && (
        <LushCollapse title="History details & personality">
          <h4 className="immersive-subheading">All history features</h4>
          <div className="feature-list">
            {Object.entries(historyRow.features).map(([k, v]) => {
              const split = splitHistoryFeatureBody(v)
              return (
                <FeatureRuleBlock
                  key={k}
                  ruleKey={k}
                  text={split ? split.body : v}
                  heading={split ? `${formatRuleKey(k)} — ${split.titleLine}` : undefined}
                  characterLevel={character.level}
                />
              )
            })}
          </div>
          <h4 className="immersive-subheading">Equipment</h4>
          <ul className="review-list">
            {historyRow.equipment.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {character.sexualHistoryPersonality && (
            <>
              <h4 className="immersive-subheading">Personality</h4>
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
        </LushCollapse>
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

      <EncounterCalculator
        open={encounterOpen}
        onClose={() => setEncounterOpen(false)}
        character={character}
        pleasureMax={pleasureMeta.max}
        pleasureRemaining={pleasureRemaining}
        onApplyPreview={setPreviewPleasureRemaining}
      />

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
