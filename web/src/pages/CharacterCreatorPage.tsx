import { useEffect, useMemo, useRef, useState, type ChangeEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADVENTURING_CLASSES } from '../data/adventuringClasses'
import { deriveGenderFromEndowment, withEndowmentOnCharacter } from '../lib/anatomyGender'
import {
  carnalClasses,
  getCarnalClass,
  getSexualHistory,
  getSpecies,
  pickRandom,
  playableSpecies,
  sexualHistories,
} from '../data/registry'
import { CharacterSummary } from '../components/CharacterSummary'
import { FertilityReadout } from '../components/FertilityReadout'
import { RacialSexualProfilePanel } from '../components/RacialSexualProfilePanel'
import { RacialSexualTraitsPanel } from '../components/RacialSexualTraitsPanel'
import { CarnalClassTraitNotes } from '../components/CarnalClassTraitNotes'
import { CarnalTraitPicker } from '../components/CarnalTraitPicker'
import { PortraitPicker } from '../components/PortraitPicker'
import { SpeciesPortrait } from '../components/SpeciesPortrait'
import {
  carnalClassTraitSelectionLabel,
  getCarnalClassTraitSlotCount,
  getSexualHistoryTraitSlotCount,
  sexualHistoryTraitSelectionLabel,
  syncCharacterCarnalTraitSelections,
} from '../lib/carnalTraitSelection'
import { getCharacterPortraitSrc } from '../lib/speciesPortrait'
import { isCanonicalGender, normalizeCharacterBiology } from '../lib/biologicalSex'
import { mergeTableProficiencies } from '../lib/mergeEroticProficiencies'
import {
  emptySexualHistoryPersonality,
  rollSexualHistoryPersonality,
} from '../lib/rollSexualHistoryPersonality'
import { applyDerivedCharacterRules } from '../lib/applyCharacterRules'
import { hydrateCharacterFromBrowserLocation } from '../lib/characterBootstrap'
import { parseCharacterJson } from '../lib/characterImport'
import {
  clearDraft,
  downloadCharacterJson,
  saveDraft,
  stashCharacterForSheet,
  upsertLibrary,
} from '../lib/characterStorage'
import { rollAllAbilityScores, rollStat4d6DropLowest } from '../lib/abilityScores'
import {
  ENDOWMENT_ANATOMY_OPTIONS,
  ENDOWMENT_SIZE_RULE,
  formatEndowmentLines,
  rollEndowmentSize,
} from '../lib/endowment'
import { getSheetEndowmentProfile } from '../lib/endowedTrait'
import { GENITAL_TRAIT_DEFINITIONS } from '../data/genitalTraits'
import { inferGenitalTraitFromCharacter } from '../lib/genitalTrait'
import type { GenitalTraitId } from '../types/genitalTrait'
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
  const navigate = useNavigate()
  const [character, setCharacter] = useState<EdndCharacter>(() =>
    hydrateCharacterFromBrowserLocation(),
  )
  const [step, setStep] = useState(0)
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [persistHint, setPersistHint] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const withMergedProficiencies = (c: EdndCharacter): EdndCharacter => {
    const c0 = normalizeCharacterBiology(c)
    return applyDerivedCharacterRules({
      ...c0,
      eroticTraits: mergeTableProficiencies(
        c0.species,
        c0.sexualHistory ?? '',
        c0.carnalClass,
        c0.eroticTraits,
      ),
    })
  }

  const speciesRow = useMemo(
    () => (character.species ? getSpecies(character.species) : undefined),
    [character.species],
  )
  const speciesSelectOptions = useMemo(() => {
    const base = [...playableSpecies]
    if (
      character.species &&
      !playableSpecies.some((s) => s.id === character.species) &&
      speciesRow
    ) {
      return [speciesRow, ...base]
    }
    return base
  }, [character.species, speciesRow])
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

  const derivedGender = useMemo(
    () => deriveGenderFromEndowment(character.endowment),
    [character.endowment],
  )

  const endowmentReadout = useMemo(
    () => formatEndowmentLines(getSheetEndowmentProfile(character)),
    [character],
  )

  const vaginaChecked = character.endowment.vaginaPresent === true

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDraft(character)
    }, 500)
    return () => window.clearTimeout(t)
  }, [character])

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return (
          character.name.trim().length > 0 &&
          character.adventuringClass.trim().length > 0 &&
          isCanonicalGender(character.genderIdentity)
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
    if (
      !window.confirm(
        'Discard this sheet (including the autosaved draft on this device) and start fresh?',
      )
    ) {
      return
    }
    clearDraft()
    setCharacter(withMergedProficiencies(createEmptyCharacter()))
    setStep(0)
    setCopyHint(null)
    setPersistHint(null)
  }

  const handleSaveToLibrary = () => {
    upsertLibrary(character)
    setPersistHint('Saved to this device.')
    window.setTimeout(() => setPersistHint(null), 2500)
  }

  const handleImportJsonFile: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const next = parseCharacterJson(parsed)
      setCharacter(withMergedProficiencies(next))
      setStep(0)
      setPersistHint('Imported character JSON.')
      window.setTimeout(() => setPersistHint(null), 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid file'
      setPersistHint(`Import failed: ${msg}`)
      window.setTimeout(() => setPersistHint(null), 4000)
    }
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
      applyDerivedCharacterRules({
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
      applyDerivedCharacterRules({
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
      const e = c.endowment
      if (anatomy === 'neither') {
        return withEndowmentOnCharacter(c, {
          ...e,
          anatomy: 'neither',
          breastsSize: undefined,
          phallusSize: undefined,
        })
      }
      if (anatomy === 'breasts') {
        return withEndowmentOnCharacter(c, {
          ...e,
          anatomy: 'breasts',
          phallusSize: undefined,
        })
      }
      if (anatomy === 'phallus') {
        return withEndowmentOnCharacter(c, {
          ...e,
          anatomy: 'phallus',
          breastsSize: undefined,
        })
      }
      return withEndowmentOnCharacter(c, {
        ...e,
        anatomy,
        breastsSize: e.breastsSize,
        phallusSize: e.phallusSize,
      })
    })
  }

  return (
    <div className="page creator">
      <h1 className="page-title">Create character</h1>

      <div className="creator-persist-toolbar" role="region" aria-label="Save and export">
        <button type="button" className="btn" onClick={handleSaveToLibrary}>
          Save to this device
        </button>
        <button type="button" className="btn" onClick={() => downloadCharacterJson(character)}>
          Download JSON file
        </button>
        <button type="button" className="btn" onClick={() => importInputRef.current?.click()}>
          Import JSON file
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            stashCharacterForSheet(character)
            navigate('/sheet')
          }}
        >
          Printable sheet
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="creator-file-input-hidden"
          aria-hidden
          onChange={handleImportJsonFile}
        />
        <p className="hint" style={{ margin: 0, flex: '1 1 12rem' }}>
          Your work autosaves as a draft on this browser. Use <strong>Save to this device</strong>{' '}
          to pin a copy in the saved list.
        </p>
        {persistHint && <span className="muted">{persistHint}</span>}
      </div>

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
            <output id="char-gender" className="creator-derived-value">
              {derivedGender || 'Configure endowment below'}
            </output>
            <p className="hint">
              Derived from endowment: phallus only = Male; phallus + vagina = Hermaphrodite; vagina
              only = Cuntboy; vagina + breasts = Female; phallus + breasts = Shemale. Set pronouns
              freely above.
            </p>
          </div>
          <div className="creator-field">
            <label htmlFor="char-genital-trait">Genital trait</label>
            <select
              id="char-genital-trait"
              value={character.genitalTrait ?? inferGenitalTraitFromCharacter(character)}
              onChange={(e) =>
                setCharacter((c) => ({
                  ...c,
                  genitalTrait: e.target.value as GenitalTraitId,
                }))
              }
            >
              {GENITAL_TRAIT_DEFINITIONS.map((def) => (
                <option key={def.id} value={def.id} title={def.tooltip}>
                  {def.label}
                </option>
              ))}
            </select>
            <p className="hint">
              {
                GENITAL_TRAIT_DEFINITIONS.find(
                  (d) =>
                    d.id ===
                    (character.genitalTrait ?? inferGenitalTraitFromCharacter(character)),
                )?.summary
              }
            </p>
            <details className="creator-genital-tooltip">
              <summary>Rules for this genital trait</summary>
              <p>
                {
                  GENITAL_TRAIT_DEFINITIONS.find(
                    (d) =>
                      d.id ===
                      (character.genitalTrait ?? inferGenitalTraitFromCharacter(character)),
                  )?.tooltip
                }
              </p>
            </details>
            <label className="creator-checkbox" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={character.hasGenitalShift ?? false}
                onChange={(e) =>
                  setCharacter((c) => ({ ...c, hasGenitalShift: e.target.checked }))
                }
              />
              Genital Shift (shapeshifter, plasmoid, polymorph, etc.)
            </label>
            <p className="hint">
              Shapeshifters can change configuration in play: new form clears Refractory and
              Overstim for that configuration; reverting restores the previous state.
            </p>
            <FertilityReadout character={character} />
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
                setCharacter((c) => applyDerivedCharacterRules({ ...c, level: nextLevel }))
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
                    applyDerivedCharacterRules({
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
              {ENDOWMENT_ANATOMY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="hint">
              {ENDOWMENT_SIZE_RULE} Toggle vagina below when it applies—gender updates automatically.
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
          <div className="creator-field">
            <label className="creator-checkbox-label">
              <input
                type="checkbox"
                checked={vaginaChecked}
                onChange={(e) =>
                  setCharacter((c) =>
                    withEndowmentOnCharacter(c, {
                      ...c.endowment,
                      vaginaPresent: e.target.checked,
                      vaginaSize: e.target.checked ? c.endowment.vaginaSize : undefined,
                    }),
                  )
                }
              />
              Has vagina (same 1d6 size categories)
            </label>
            <p className="hint" style={{ marginTop: '0.35rem' }}>
              Vagina with phallus makes Hermaphrodite; vagina with breasts makes Female; vagina
              alone makes Cuntboy. Roll size when you are ready.
            </p>
              {vaginaChecked && (
                <div
                  className="creator-field creator-field--inline-actions"
                  style={{ marginTop: '0.5rem' }}
                >
                  <label>Vagina endowment (1d6)</label>
                  <div className="creator-inline-row">
                    <input
                      type="text"
                      readOnly
                      value={character.endowment.vaginaSize ?? 'Not rolled'}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        setCharacter((c) => ({
                          ...c,
                          endowment: {
                            ...c.endowment,
                            vaginaPresent: true,
                            vaginaSize: rollEndowmentSize(),
                          },
                        }))
                      }
                    >
                      Roll vagina
                    </button>
                  </div>
                </div>
              )}
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
                  withMergedProficiencies({
                    ...c,
                    species: e.target.value,
                    portraitSrc: undefined,
                  }),
                )
              }
            >
              <option value="">Choose…</option>
              {speciesSelectOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {speciesRow && (
            <>
              <PortraitPicker
                character={character}
                onChange={(portraitSrc) => setCharacter((c) => ({ ...c, portraitSrc }))}
              />
              <div className="creator-species-layout">
                <SpeciesPortrait
                  src={getCharacterPortraitSrc(character)}
                  speciesId={character.species}
                  genderIdentity={character.genderIdentity}
                  alt={speciesRow.name ? `${speciesRow.name} portrait` : ''}
                  className="creator-species-layout__portrait"
                  imgClassName="creator-species-layout__img"
                />
                <div className="character-summary character-summary--embed">
                  <p className="muted" style={{ margin: '0 0 0.5rem', lineHeight: 1.55 }}>
                    <strong>{speciesRow.name}.</strong> {speciesRow.description}
                  </p>
                  <div className="trait-card trait-card--species">
                    <strong>Species carnal trait — {speciesRow.carnalTrait}</strong>
                    <p className="feature-body">{speciesRow.carnalTraitDescription}</p>
                  </div>
                </div>
              </div>
              <RacialSexualTraitsPanel
                speciesId={character.species}
                headingClassName="creator-subheading"
              />
              <RacialSexualProfilePanel
                speciesId={character.species}
                showGlossaryIntro
                headingClassName="creator-subheading"
              />
            </>
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
                  syncCharacterCarnalTraitSelections(
                    withMergedProficiencies({
                      ...c,
                      sexualHistory: e.target.value || undefined,
                      sexualHistoryPersonality: undefined,
                      sexualHistoryTraitIds: [],
                    }),
                  ),
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
            <>
              <p className="muted" style={{ lineHeight: 1.5 }}>
                {historyRow.description}
              </p>
              <CarnalTraitPicker
                context="history"
                speciesId={character.species}
                carnalClassId={character.carnalClass ?? ''}
                sexualHistoryId={character.sexualHistory ?? ''}
                selectedIds={character.sexualHistoryTraitIds ?? []}
                maxSlots={getSexualHistoryTraitSlotCount(character.sexualHistory)}
                lede={`${sexualHistoryTraitSelectionLabel(character.sexualHistory)} Traits are small features that refine sexuality and description; some are exclusive to species, class, or history.`}
                onChange={(sexualHistoryTraitIds) =>
                  setCharacter((c) =>
                    syncCharacterCarnalTraitSelections({ ...c, sexualHistoryTraitIds }),
                  )
                }
              />
            </>
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
                  syncCharacterCarnalTraitSelections(
                    withMergedProficiencies({
                      ...c,
                      carnalClass: e.target.value || undefined,
                      carnalClassTraitIds: [],
                    }),
                  ),
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
            <>
              <p className="muted" style={{ lineHeight: 1.5 }}>
                {carnalClassRow.description}
              </p>
              <CarnalClassTraitNotes row={carnalClassRow} />
              <CarnalTraitPicker
                context="class"
                speciesId={character.species}
                carnalClassId={character.carnalClass ?? ''}
                sexualHistoryId={character.sexualHistory ?? ''}
                selectedIds={character.carnalClassTraitIds ?? []}
                maxSlots={getCarnalClassTraitSlotCount(character.carnalClass)}
                lede={`${carnalClassTraitSelectionLabel(character.carnalClass)} Courtesan grants 4 traits; all other carnal classes grant 3.`}
                onChange={(carnalClassTraitIds) =>
                  setCharacter((c) => syncCharacterCarnalTraitSelections({ ...c, carnalClassTraitIds }))
                }
              />
            </>
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
