import { useLayoutEffect, useMemo, useState } from 'react'
import { ADVENTURING_CLASSES } from '../data/adventuringClasses'
import { GENDERS } from '../data/identityOptions'
import {
  carnalClasses,
  getCarnalClass,
  getSexualHistory,
  getSpecies,
  pickRandom,
  species,
  sexualHistories,
} from '../data/registry'
import { CharacterSummary } from '../components/CharacterSummary'
import { mergeTableProficiencies } from '../lib/mergeEroticProficiencies'
import {
  emptySexualHistoryPersonality,
  rollSexualHistoryPersonality,
} from '../lib/rollSexualHistoryPersonality'
import {
  deriveBeautyClass,
  rollAllAbilityScores,
  rollStat4d6DropLowest,
} from '../lib/abilityScores'
import {
  coerceEndowmentForBiologicalSex,
  ENDOWMENT_SIZE_RULE,
  formatEndowmentLines,
  getAllowedAnatomiesForBiologicalSex,
  rollEndowmentSize,
} from '../lib/endowment'
import { createEmptyCharacter, type EdndCharacter, type SexualHistoryPersonality } from '../types/character'
import './CharacterCreatorPage.css'

const STEP_LABELS = [
  'Identity',
  'Species',
  'Sexual history',
  'Carnal class',
  'Erotic profile',
  'Review',
] as const

const ATTRACTION_OPTIONS = [
  'Male',
  'Female',
  'Brawny',
  'Lithe',
  'Thick',
  'Voluptuous',
  'Homospecies',
  'Heterospecies',
  'Xenospecies',
  'Lawful',
  'Neutral',
  'Chaotic',
  'Good',
  'Evil',
] as const

const SEXUAL_MORALITY_OPTIONS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const

const ORIENTATION_OPTIONS = [
  'Homosexual',
  'Heterosexual',
  'Bisexual',
  'Pansexual',
  'Omnisexual',
  'Sapiosexual',
  'Asexual',
  'Demisexual',
] as const

const ABILITY_LABELS: Array<[keyof EdndCharacter['abilityScores'], string]> = [
  ['strength', 'Strength'],
  ['dexterity', 'Dexterity'],
  ['constitution', 'Constitution'],
  ['intelligence', 'Intelligence'],
  ['wisdom', 'Wisdom'],
  ['charisma', 'Charisma'],
]

const ENDOWMENT_ANATOMY_OPTIONS: Array<{
  value: EdndCharacter['endowment']['anatomy']
  label: string
}> = [
  { value: 'neither', label: 'Neither' },
  { value: 'breasts', label: 'Breasts' },
  { value: 'phallus', label: 'Phallus' },
  { value: 'both', label: 'Both' },
]

function sexualityBonusForLevel(level: number): number {
  if (level < 5) return 2
  if (level < 10) return 3
  if (level < 14) return 4
  if (level < 18) return 5
  return 6
}

function splitCsvTags(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinCsvTags(items: string[]): string {
  return items.join(', ')
}

export function CharacterCreatorPage() {
  const [character, setCharacter] = useState<EdndCharacter>(() => createEmptyCharacter())
  const [step, setStep] = useState(0)
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const applyRules = (c: EdndCharacter): EdndCharacter => {
    const sexualityBonus = sexualityBonusForLevel(c.level)
    const beautyClass = deriveBeautyClass(c.abilityScores, c.eroticTraits.beautyModifier)
    return {
      ...c,
      eroticTraits: {
        ...c.eroticTraits,
        sexualityBonus,
        beautyClass,
      },
    }
  }

  const withMergedProficiencies = (c: EdndCharacter): EdndCharacter =>
    applyRules({
      ...c,
      eroticTraits: mergeTableProficiencies(
        c.species,
        c.sexualHistory ?? '',
        c.carnalClass,
        c.eroticTraits,
      ),
    })

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
  const selectedAttractions = useMemo(
    () => new Set(splitCsvTags(character.eroticTraits.attraction)),
    [character.eroticTraits.attraction],
  )
  const selectedRepulsions = useMemo(
    () => new Set(splitCsvTags(character.eroticTraits.repulsion)),
    [character.eroticTraits.repulsion],
  )

  const allowedEndowmentAnatomies = useMemo(
    () => getAllowedAnatomiesForBiologicalSex(character.genderIdentity),
    [character.genderIdentity],
  )

  const endowmentReadout = useMemo(
    () =>
      formatEndowmentLines(
        coerceEndowmentForBiologicalSex(character.genderIdentity, character.endowment),
      ),
    [character.genderIdentity, character.endowment],
  )

  useLayoutEffect(() => {
    setCharacter((c) => {
      const next = coerceEndowmentForBiologicalSex(c.genderIdentity, c.endowment)
      if (
        next.anatomy === c.endowment.anatomy &&
        next.breastsSize === c.endowment.breastsSize &&
        next.phallusSize === c.endowment.phallusSize
      ) {
        return c
      }
      return { ...c, endowment: next }
    })
  }, [character.genderIdentity])

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return (
          character.name.trim().length > 0 && character.adventuringClass.trim().length > 0
        )
      case 1:
        return character.species.length > 0
      case 2: {
        if (!(character.sexualHistory ?? '').trim()) return false
        const row = getSexualHistory(character.sexualHistory!)
        if (!row?.personality) return true
        const shp = character.sexualHistoryPersonality
        if (!shp) return false
        return [shp.trait, shp.ideal, shp.bond, shp.flaw].every((s) => s.trim().length > 0)
      }
      default:
        return true
    }
  }

  const handleStartOver = () => {
    setCharacter(createEmptyCharacter())
    setStep(0)
    setCopyHint(null)
  }

  const handleCopyJson = async () => {
    const text = JSON.stringify(character, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      setCopyHint('Copied to clipboard.')
      window.setTimeout(() => setCopyHint(null), 2500)
    } catch {
      setCopyHint('Could not copy — select and copy manually from the console or export later.')
    }
  }

  const updateErotic = (patch: Partial<EdndCharacter['eroticTraits']>) => {
    setCharacter((c) =>
      applyRules({
        ...c,
        eroticTraits: { ...c.eroticTraits, ...patch },
      }),
    )
  }

  const toggleCsvTag = (field: 'attraction' | 'repulsion', tag: string) => {
    const current = new Set(splitCsvTags(character.eroticTraits[field]))
    if (current.has(tag)) current.delete(tag)
    else current.add(tag)
    updateErotic({ [field]: joinCsvTags([...current]) })
  }

  const updateAbilityScore = (
    key: keyof EdndCharacter['abilityScores'],
    next: number,
  ) => {
    setCharacter((c) =>
      applyRules({
        ...c,
        abilityScores: {
          ...c.abilityScores,
          [key]: Math.max(1, Math.min(30, next || 1)),
        },
      }),
    )
  }

  const patchSexualHistoryPersonality = (patch: Partial<SexualHistoryPersonality>) => {
    setCharacter((c) => ({
      ...c,
      sexualHistoryPersonality: {
        ...emptySexualHistoryPersonality(),
        ...c.sexualHistoryPersonality,
        ...patch,
      },
    }))
  }

  const setEndowmentAnatomy = (anatomy: EdndCharacter['endowment']['anatomy']) => {
    setCharacter((c) => {
      if (anatomy === 'neither') return { ...c, endowment: { anatomy } }
      if (anatomy === 'breasts')
        return {
          ...c,
          endowment: { anatomy, breastsSize: c.endowment.breastsSize },
        }
      if (anatomy === 'phallus')
        return {
          ...c,
          endowment: { anatomy, phallusSize: c.endowment.phallusSize },
        }
      return {
        ...c,
        endowment: {
          anatomy,
          breastsSize: c.endowment.breastsSize,
          phallusSize: c.endowment.phallusSize,
        },
      }
    })
  }

  return (
    <div className="page creator">
      <h1 className="page-title">Create character</h1>

      <ol className="creator-progress" aria-label="Creation steps">
        {STEP_LABELS.map((label, i) => (
          <li
            key={label}
            className={[i < step ? 'done' : '', i === step ? 'current' : '']
              .filter(Boolean)
              .join(' ')}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section aria-labelledby="step-identity">
          <h2 id="step-identity" className="creator-step-title">
            Identity
          </h2>
          <div className="creator-field">
            <label htmlFor="char-name">Character name</label>
            <input
              id="char-name"
              type="text"
              autoComplete="off"
              value={character.name}
              onChange={(e) => setCharacter((c) => ({ ...c, name: e.target.value }))}
              placeholder="Name"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="char-pronouns">Pronouns</label>
            <input
              id="char-pronouns"
              type="text"
              autoComplete="off"
              value={character.pronouns}
              onChange={(e) =>
                setCharacter((c) => ({ ...c, pronouns: e.target.value }))
              }
              placeholder="e.g. she/her, they/them"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="char-gender">Biological sex</label>
            <select
              id="char-gender"
              value={character.genderIdentity}
              onChange={(e) =>
                setCharacter((c) => ({ ...c, genderIdentity: e.target.value }))
              }
            >
              <option value="">(Not set)</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <p className="hint">
              Which primary sex traits can appear on the body for rules purposes (e.g. a phallus
              is only an option for Male or Transgender). Identity and pronouns are separate—set
              pronouns above.
            </p>
          </div>
          <div className="creator-field">
            <label htmlFor="char-level">Level</label>
            <input
              id="char-level"
              type="number"
              min={1}
              max={20}
              value={character.level}
              onChange={(e) => {
                const nextLevel = Math.min(20, Math.max(1, Number(e.target.value) || 1))
                setCharacter((c) => applyRules({ ...c, level: nextLevel }))
              }}
            />
          </div>
          <div className="creator-field">
            <label>Ability scores</label>
            <div className="creator-ability-grid">
              {ABILITY_LABELS.map(([key, label]) => (
                <div key={key} className="creator-ability-row">
                  <span className="creator-ability-label">{label}</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={character.abilityScores[key]}
                    onChange={(e) => updateAbilityScore(key, Number(e.target.value) || 1)}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => updateAbilityScore(key, rollStat4d6DropLowest())}
                  >
                    Roll
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setCharacter((c) =>
                    applyRules({
                      ...c,
                      abilityScores: rollAllAbilityScores(),
                    }),
                  )
                }
              >
                Roll all abilities (4d6 drop lowest)
              </button>
            </div>
          </div>
          <div className="creator-field">
            <label htmlFor="char-class">
              Adventuring class <span className="hint">(5e)</span>
            </label>
            <input
              id="char-class"
              type="text"
              list="adventuring-class-list"
              value={character.adventuringClass}
              onChange={(e) =>
                setCharacter((c) => ({ ...c, adventuringClass: e.target.value }))
              }
              placeholder="e.g. Bard"
            />
            <datalist id="adventuring-class-list">
              {ADVENTURING_CLASSES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="creator-field">
            <label htmlFor="char-bg">
              Background <span className="hint">(optional text until a table exists)</span>
            </label>
            <input
              id="char-bg"
              type="text"
              value={character.background}
              onChange={(e) =>
                setCharacter((c) => ({ ...c, background: e.target.value }))
              }
              placeholder="Sage, Soldier, homebrew…"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="endowment-anatomy">Breasts &amp; phallus</label>
            <select
              id="endowment-anatomy"
              value={character.endowment.anatomy}
              onChange={(e) =>
                setEndowmentAnatomy(
                  e.target.value as EdndCharacter['endowment']['anatomy'],
                )
              }
            >
              {ENDOWMENT_ANATOMY_OPTIONS.filter((opt) =>
                allowedEndowmentAnatomies.includes(opt.value),
              ).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="hint">
              Vagina traits come later. {ENDOWMENT_SIZE_RULE} Female and Nonbinary characters
              cannot have a phallus (only breasts and/or neither).
            </p>
            <div className="hint" style={{ marginTop: '0.35rem' }}>
              <strong>Sheet readout:</strong>
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.25rem' }}>
                {endowmentReadout.map((line, i) => (
                  <li key={`${i}-${line}`}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
          {(character.endowment.anatomy === 'breasts' ||
            character.endowment.anatomy === 'both') && (
            <div className="creator-field creator-field--inline-actions">
              <label>Breasts endowment (1d6)</label>
              <div className="creator-inline-row">
                <input
                  type="text"
                  readOnly
                  value={character.endowment.breastsSize ?? 'Not rolled'}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setCharacter((c) => ({
                      ...c,
                      endowment: {
                        ...c.endowment,
                        breastsSize: rollEndowmentSize(),
                      },
                    }))
                  }
                >
                  Roll breasts
                </button>
              </div>
            </div>
          )}
          {(character.endowment.anatomy === 'phallus' ||
            character.endowment.anatomy === 'both') && (
            <div className="creator-field creator-field--inline-actions">
              <label>Phallus endowment (1d6)</label>
              <div className="creator-inline-row">
                <input
                  type="text"
                  readOnly
                  value={character.endowment.phallusSize ?? 'Not rolled'}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setCharacter((c) => ({
                      ...c,
                      endowment: {
                        ...c.endowment,
                        phallusSize: rollEndowmentSize(),
                      },
                    }))
                  }
                >
                  Roll phallus
                </button>
              </div>
            </div>
          )}
          {character.endowment.anatomy === 'both' && (
            <div className="creator-field">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setCharacter((c) => ({
                    ...c,
                    endowment: {
                      ...c.endowment,
                      breastsSize: rollEndowmentSize(),
                      phallusSize: rollEndowmentSize(),
                    },
                  }))
                }
              >
                Roll both endowments
              </button>
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section aria-labelledby="step-species">
          <h2 id="step-species" className="creator-step-title">
            Species
          </h2>
          <div className="creator-field">
            <label htmlFor="char-species">Species</label>
            <select
              id="char-species"
              value={character.species}
              onChange={(e) =>
                setCharacter((c) =>
                  withMergedProficiencies({ ...c, species: e.target.value }),
                )
              }
            >
              <option value="">Choose…</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {speciesRow && (
            <div className="character-summary character-summary--embed">
              <p className="muted" style={{ margin: '0 0 0.5rem', lineHeight: 1.55 }}>
                <strong>{speciesRow.name}.</strong> {speciesRow.description}
              </p>
              <div className="trait-card trait-card--species">
                <strong>Species carnal trait — {speciesRow.carnalTrait}</strong>
                <p className="feature-body">{speciesRow.carnalTraitDescription}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="step-history">
          <h2 id="step-history" className="creator-step-title">
            Sexual history
          </h2>
          <div className="creator-field">
            <label htmlFor="char-history">Sexual history</label>
            <select
              id="char-history"
              value={character.sexualHistory ?? ''}
              onChange={(e) =>
                setCharacter((c) =>
                  withMergedProficiencies({
                    ...c,
                    sexualHistory: e.target.value || undefined,
                    sexualHistoryPersonality: undefined,
                  }),
                )
              }
            >
              <option value="">Choose…</option>
              {sexualHistories.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          {historyRow && (
            <p className="muted" style={{ lineHeight: 1.5 }}>
              {historyRow.description}
            </p>
          )}
          {historyRow?.personality && (
            <div className="creator-personality" style={{ marginTop: '1.25rem' }}>
              <h3 className="creator-subheading">Personality (from history)</h3>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Choose one from each list or roll — all four are required to continue.
              </p>
              <div className="creator-field creator-field--inline-actions">
                <label htmlFor="shp-trait">Personality trait</label>
                <div className="creator-inline-row">
                  <select
                    id="shp-trait"
                    value={character.sexualHistoryPersonality?.trait ?? ''}
                    onChange={(e) =>
                      patchSexualHistoryPersonality({ trait: e.target.value })
                    }
                  >
                    <option value="">Choose…</option>
                    {historyRow.personality.traits.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      patchSexualHistoryPersonality({
                        trait: pickRandom(historyRow.personality.traits) ?? '',
                      })
                    }
                  >
                    Roll
                  </button>
                </div>
              </div>
              <div className="creator-field creator-field--inline-actions">
                <label htmlFor="shp-ideal">Ideal</label>
                <div className="creator-inline-row">
                  <select
                    id="shp-ideal"
                    value={character.sexualHistoryPersonality?.ideal ?? ''}
                    onChange={(e) =>
                      patchSexualHistoryPersonality({ ideal: e.target.value })
                    }
                  >
                    <option value="">Choose…</option>
                    {historyRow.personality.ideals.map((row) => {
                      const v = `${row.text} (${row.alignment})`
                      return (
                        <option key={v} value={v}>
                          {row.text} ({row.alignment})
                        </option>
                      )
                    })}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const row = pickRandom(historyRow.personality.ideals)
                      patchSexualHistoryPersonality({
                        ideal: row ? `${row.text} (${row.alignment})` : '',
                      })
                    }}
                  >
                    Roll
                  </button>
                </div>
              </div>
              <div className="creator-field creator-field--inline-actions">
                <label htmlFor="shp-bond">Bond</label>
                <div className="creator-inline-row">
                  <select
                    id="shp-bond"
                    value={character.sexualHistoryPersonality?.bond ?? ''}
                    onChange={(e) =>
                      patchSexualHistoryPersonality({ bond: e.target.value })
                    }
                  >
                    <option value="">Choose…</option>
                    {historyRow.personality.bonds.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      patchSexualHistoryPersonality({
                        bond: pickRandom(historyRow.personality.bonds) ?? '',
                      })
                    }
                  >
                    Roll
                  </button>
                </div>
              </div>
              <div className="creator-field creator-field--inline-actions">
                <label htmlFor="shp-flaw">Flaw</label>
                <div className="creator-inline-row">
                  <select
                    id="shp-flaw"
                    value={character.sexualHistoryPersonality?.flaw ?? ''}
                    onChange={(e) =>
                      patchSexualHistoryPersonality({ flaw: e.target.value })
                    }
                  >
                    <option value="">Choose…</option>
                    {historyRow.personality.flaws.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      patchSexualHistoryPersonality({
                        flaw: pickRandom(historyRow.personality.flaws) ?? '',
                      })
                    }
                  >
                    Roll
                  </button>
                </div>
              </div>
              <div className="creator-field">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!character.sexualHistory}
                  onClick={() => {
                    if (!character.sexualHistory) return
                    setCharacter((c) => ({
                      ...c,
                      sexualHistoryPersonality: rollSexualHistoryPersonality(
                        character.sexualHistory!,
                      ),
                    }))
                  }}
                >
                  Roll all personality
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="step-carnal">
          <h2 id="step-carnal" className="creator-step-title">
            Carnal class
          </h2>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Optional parallel track to your adventuring class.
          </p>
          <div className="creator-field">
            <label htmlFor="char-carnal-class">Carnal class</label>
            <select
              id="char-carnal-class"
              value={character.carnalClass ?? ''}
              onChange={(e) =>
                setCharacter((c) =>
                  withMergedProficiencies({
                    ...c,
                    carnalClass: e.target.value || undefined,
                  }),
                )
              }
            >
              <option value="">None</option>
              {carnalClasses.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>
          {carnalClassRow && (
            <p className="muted" style={{ lineHeight: 1.5 }}>
              {carnalClassRow.description}
            </p>
          )}
        </section>
      )}

      {step === 4 && (
        <section aria-labelledby="step-erotic">
          <h2 id="step-erotic" className="creator-step-title">
            Erotic profile
          </h2>
          <div className="creator-field">
            <label htmlFor="beauty">Beauty class</label>
            <input
              id="beauty"
              type="text"
              value={String(character.eroticTraits.beautyClass)}
              readOnly
              placeholder="10"
            />
            <p className="hint">
              Computed as 10 + highest ability modifier + other modifiers.
            </p>
          </div>
          <div className="creator-field">
            <label htmlFor="beauty-mod">Other beauty modifiers</label>
            <input
              id="beauty-mod"
              type="number"
              value={character.eroticTraits.beautyModifier}
              onChange={(e) =>
                updateErotic({ beautyModifier: Number(e.target.value) || 0 })
              }
            />
            <p className="hint">
              Species/history/class traits, carnal traits, equipment, magic, and temporary
              effects.
            </p>
          </div>
          <div className="creator-field">
            <label htmlFor="sex-bonus">Sexuality bonus</label>
            <input
              id="sex-bonus"
              type="number"
              value={character.eroticTraits.sexualityBonus}
              readOnly
            />
            <p className="hint">
              Auto by level: +2 (1-4), +3 (5-9), +4 (10-13), +5 (14-17), +6 (18-20).
            </p>
          </div>
          <div className="creator-field">
            <label htmlFor="attraction">Attraction</label>
            <div className="creator-tags">
              {ATTRACTION_OPTIONS.map((opt) => (
                <label key={`att-${opt}`} className="creator-tag-pill">
                  <input
                    type="checkbox"
                    checked={selectedAttractions.has(opt)}
                    onChange={() => toggleCsvTag('attraction', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <input
              id="attraction"
              type="text"
              value={character.eroticTraits.attraction}
              onChange={(e) => updateErotic({ attraction: e.target.value })}
              placeholder="Add/remove custom tags, comma-separated"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="repulsion">Repulsion</label>
            <div className="creator-tags">
              {ATTRACTION_OPTIONS.map((opt) => (
                <label key={`rep-${opt}`} className="creator-tag-pill">
                  <input
                    type="checkbox"
                    checked={selectedRepulsions.has(opt)}
                    onChange={() => toggleCsvTag('repulsion', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <input
              id="repulsion"
              type="text"
              value={character.eroticTraits.repulsion}
              onChange={(e) => updateErotic({ repulsion: e.target.value })}
              placeholder="Add/remove custom tags, comma-separated"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="morality">Sexual morality</label>
            <select
              id="morality"
              value={character.eroticTraits.sexualMorality}
              onChange={(e) => updateErotic({ sexualMorality: e.target.value })}
            >
              <option value="">Choose…</option>
              {SEXUAL_MORALITY_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="creator-field">
            <label htmlFor="orientation">Orientation</label>
            <select
              id="orientation"
              value={character.eroticTraits.orientation}
              onChange={(e) => updateErotic({ orientation: e.target.value })}
            >
              <option value="">Choose…</option>
              {ORIENTATION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="creator-field">
            <label>Erotic tool proficiencies</label>
            {character.eroticTraits.eroticToolProficiencies.length > 0 ? (
              <ul className="review-list">
                {character.eroticTraits.eroticToolProficiencies.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                None auto-filled yet. These are derived from selected class/history when
                available in table data.
              </p>
            )}
          </div>
        </section>
      )}

      {step === 5 && (
        <section aria-labelledby="step-review">
          <h2 id="step-review" className="creator-step-title">
            Review
          </h2>
          <CharacterSummary character={character} />
          <div className="summary-actions">
            <button type="button" className="btn btn-primary" onClick={handleCopyJson}>
              Copy character JSON
            </button>
            {copyHint && <span className="muted">{copyHint}</span>}
          </div>
        </section>
      )}

      <div className="creator-actions">
        <button
          type="button"
          className="btn"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </button>
        <span className="spacer" />
        {step < STEP_LABELS.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={handleStartOver}>
            Start over
          </button>
        )}
      </div>
    </div>
  )
}
