import { useMemo, useState } from 'react'
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

export function CharacterCreatorPage() {
  const [character, setCharacter] = useState<EdndCharacter>(() => createEmptyCharacter())
  const [step, setStep] = useState(0)
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const withMergedProficiencies = (c: EdndCharacter): EdndCharacter => ({
    ...c,
    eroticTraits: mergeTableProficiencies(c.species, c.sexualHistory ?? '', c.eroticTraits),
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
    setCharacter((c) => ({
      ...c,
      eroticTraits: { ...c.eroticTraits, ...patch },
    }))
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
            <label htmlFor="char-gender">Gender</label>
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
          </div>
          <div className="creator-field">
            <label htmlFor="char-level">Level</label>
            <input
              id="char-level"
              type="number"
              min={1}
              max={20}
              value={character.level}
              onChange={(e) =>
                setCharacter((c) => ({
                  ...c,
                  level: Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                }))
              }
            />
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
                setCharacter((c) => ({
                  ...c,
                  carnalClass: e.target.value || undefined,
                }))
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
              value={character.eroticTraits.beautyClass}
              onChange={(e) => updateErotic({ beautyClass: e.target.value })}
              placeholder="Tier, score, or notes"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="sex-bonus">Sexuality bonus</label>
            <input
              id="sex-bonus"
              type="number"
              value={character.eroticTraits.sexualityBonus}
              onChange={(e) =>
                updateErotic({ sexualityBonus: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div className="creator-field">
            <label htmlFor="attraction">Attraction</label>
            <textarea
              id="attraction"
              value={character.eroticTraits.attraction}
              onChange={(e) => updateErotic({ attraction: e.target.value })}
              placeholder="Who or what they are drawn to"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="repulsion">Repulsion</label>
            <textarea
              id="repulsion"
              value={character.eroticTraits.repulsion}
              onChange={(e) => updateErotic({ repulsion: e.target.value })}
              placeholder="Turn-offs, boundaries, disinterest"
            />
          </div>
          <div className="creator-field">
            <label htmlFor="morality">Sexual morality</label>
            <textarea
              id="morality"
              value={character.eroticTraits.sexualMorality}
              onChange={(e) => updateErotic({ sexualMorality: e.target.value })}
            />
          </div>
          <div className="creator-field">
            <label htmlFor="orientation">Orientation</label>
            <textarea
              id="orientation"
              value={character.eroticTraits.orientation}
              onChange={(e) => updateErotic({ orientation: e.target.value })}
            />
          </div>
          <div className="creator-field">
            <label htmlFor="tools">
              Erotic tool proficiencies{' '}
              <span className="hint">(one per line)</span>
            </label>
            <textarea
              id="tools"
              value={character.eroticTraits.eroticToolProficiencies.join('\n')}
              onChange={(e) =>
                updateErotic({
                  eroticToolProficiencies: e.target.value
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean),
                })
              }
            />
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
