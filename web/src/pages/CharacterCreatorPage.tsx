import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADVENTURING_CLASSES } from '../data/adventuringClasses'
import { withEndowmentOnCharacter } from '../lib/anatomyGender'
import { GENDERS, PRONOUNS, isPronounOption } from '../data/identityOptions'
import {
  BODY_TYPES,
  BODY_TYPE_DESCRIPTIONS,
  isBodyType,
  type BodyType,
} from '../data/bodyTypes'
import {
  CREATURE_SIZES,
  defaultCreatureSizeForSpecies,
  isCreatureSize,
  speciesAllowsCreatureSizeChoice,
  type CreatureSize,
} from '../data/creatureSize'
import {
  carnalClasses,
  getCarnalClass,
  getSexualHistory,
  getSpecies,
  pickRandom,
  sexualHistories,
} from '../data/registry'
import { CharacterSummary } from '../components/CharacterSummary'
import { FertilityReadout } from '../components/FertilityReadout'
import { RacialSexualProfilePanel } from '../components/RacialSexualProfilePanel'
import { RacialSexualTraitsPanel } from '../components/RacialSexualTraitsPanel'
import { CarnalClassTraitNotes } from '../components/CarnalClassTraitNotes'
import { CarnalTraitPicker } from '../components/CarnalTraitPicker'
import { PaperDollViewer } from '../components/PaperDollViewer'
import { PortraitPicker } from '../components/PortraitPicker'
import { SpeciesFamilyPicker } from '../components/SpeciesFamilyPicker'
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
import {
  abilityRollsToSpectacle,
  rollAllAbilityScoresDetailed,
  rollStat4d6DropLowestDetailed,
} from '../lib/abilityScores'
import {
  DICE_SIDES,
  labelForSides,
  makeSpectacleDie,
  rollDice,
  type DiceSides,
  type SpectacleDie,
} from '../lib/dice'
import {
  describeSpeciesHeightWeightFormula,
  formatHeightInches,
  formatWeightLbs,
  physiqueRollToSpectacle,
  reweightPhysique,
  rollPhysiqueForSpecies,
  rollRandomBodyType,
} from '../lib/physique'
import { DiceRollOverlay } from '../components/DiceRollOverlay'
import {
  ENDOWMENT_SIZES,
  describeBreastsSize,
  describePhallusSize,
  describeVaginaSize,
  isEndowmentSize,
  rollEndowmentSize,
} from '../lib/endowment'
import {
  allowedPhallusSizes,
  clampPhallusSizeForCreature,
  computePhallusLengthInches,
  formatPhallusSizeLabel,
  resolveCharacterCreatureSize,
  rollPhallusLengthDie,
  rollPhallusSize,
} from '../lib/phallusScale'
import { GENITAL_TRAIT_DEFINITIONS } from '../data/genitalTraits'
import {
  applyGenitalTraitSelection,
  defaultGenitalTraitForGender,
  describeEndowmentShape,
  endowmentShapeFromGenitalTrait,
  inferGenitalTraitFromCharacter,
} from '../lib/genitalTrait'
import { generateRandomCharacter } from '../lib/generateRandomCharacter'
import type { GenitalTraitId } from '../types/genitalTrait'
import type { EndowmentSize } from '../types/character'
import { createEmptyCharacter, type EdndCharacter, type SexualHistoryPersonality } from '../types/character'
import {
  breastMorphFromEndowmentSize,
  defaultMorphFromBodyType,
  normalizePhysiqueMorph,
} from '../lib/physiqueMorph'
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
  const [spectacle, setSpectacle] = useState<{
    dice: SpectacleDie[]
    title: string
    subtitle?: string
    apply: () => void
  } | null>(null)
  const [funDieSides, setFunDieSides] = useState<DiceSides>(20)
  const [funDieCount, setFunDieCount] = useState(1)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Drop ?new=1 from the address bar without remounting, so a refresh can restore the draft.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('new') !== '1') return
    if (url.searchParams.get('id')) return
    url.search = ''
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.hash}`)
  }, [])

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

  const creatureSize = useMemo(
    () => resolveCharacterCreatureSize(character),
    [character.species, character.creatureSize],
  )

  const phallusSizeOptions = useMemo(
    () => allowedPhallusSizes(creatureSize),
    [creatureSize],
  )

  const activeGenitalTrait = useMemo(
    () => character.genitalTrait ?? inferGenitalTraitFromCharacter(character),
    [character],
  )

  const endowmentShape = useMemo(
    () => endowmentShapeFromGenitalTrait(activeGenitalTrait),
    [activeGenitalTrait],
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDraft(character)
    }, 500)
    return () => window.clearTimeout(t)
  }, [character])

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return (
          character.name.trim().length > 0 &&
          isCanonicalGender(character.genderIdentity) &&
          isPronounOption(character.pronouns) &&
          character.eroticTraits.orientation.trim().length > 0 &&
          character.species.length > 0
        )
      case 1:
        return (
          character.species.length > 0 &&
          isBodyType(character.bodyType ?? '') &&
          typeof character.heightInches === 'number' &&
          typeof character.weightLbs === 'number' &&
          Boolean(character.genitalTrait || inferGenitalTraitFromCharacter(character))
        )
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

  const applySpeciesChange = (speciesId: string) => {
    setCharacter((c) => {
      const nextSize = speciesAllowsCreatureSizeChoice(speciesId)
        ? isCreatureSize(c.creatureSize ?? '')
          ? c.creatureSize
          : defaultCreatureSizeForSpecies(speciesId)
        : undefined
      return withMergedProficiencies({
        ...c,
        species: speciesId,
        creatureSize: nextSize,
        portraitSrc: undefined,
        heightInches: undefined,
        weightLbs: undefined,
        heightModifierRoll: undefined,
        weightModifierRoll: undefined,
      })
    })
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

  const finishSpectacle = useCallback(() => {
    setSpectacle((current) => {
      if (current) current.apply()
      return null
    })
  }, [])

  const rollOneAbilityWithSpectacle = (key: keyof EdndCharacter['abilityScores'], label: string) => {
    const detail = rollStat4d6DropLowestDetailed()
    setSpectacle({
      dice: abilityRollsToSpectacle({ [key]: detail }, { [key]: label }),
      title: `Roll ${label}`,
      subtitle: '4d6, drop the lowest',
      apply: () => updateAbilityScore(key, detail.total),
    })
  }

  const rollAllAbilitiesWithSpectacle = () => {
    const details = rollAllAbilityScoresDetailed()
    const labels = Object.fromEntries(ABILITY_LABELS) as Record<
      keyof EdndCharacter['abilityScores'],
      string
    >
    setSpectacle({
      dice: abilityRollsToSpectacle(details, labels),
      title: 'Ability scores',
      subtitle: 'Six times 4d6, drop the lowest',
      apply: () =>
        setCharacter((c) =>
          applyDerivedCharacterRules({
            ...c,
            abilityScores: {
              strength: details.strength.total,
              dexterity: details.dexterity.total,
              constitution: details.constitution.total,
              intelligence: details.intelligence.total,
              wisdom: details.wisdom.total,
              charisma: details.charisma.total,
            },
          }),
        ),
    })
  }

  const rollFunDiceWithSpectacle = () => {
    const values = rollDice(funDieCount, funDieSides)
    const dice = values.map((value) => makeSpectacleDie(funDieSides, value))
    const total = values.reduce((a, b) => a + b, 0)
    setSpectacle({
      dice,
      title: `${values.length}${labelForSides(funDieSides)}`,
      subtitle:
        values.length === 1
          ? `A single ${labelForSides(funDieSides)} takes flight`
          : `Total ${total}`,
      apply: () => undefined,
    })
  }

  const applyBodyType = (bodyType: BodyType) => {
    setCharacter((c) => {
      const physiqueMorph = defaultMorphFromBodyType(bodyType)
      if (
        typeof c.heightModifierRoll === 'number' &&
        typeof c.weightModifierRoll === 'number' &&
        c.species
      ) {
        const next = reweightPhysique({
          speciesId: c.species,
          bodyType,
          heightModifier: c.heightModifierRoll,
          weightModifier: c.weightModifierRoll,
          abilityScores: c.abilityScores,
        })
        return { ...c, bodyType, physiqueMorph, ...next }
      }
      return { ...c, bodyType, physiqueMorph }
    })
  }

  const patchPhysiqueMorph = (patch: Partial<NonNullable<EdndCharacter['physiqueMorph']>>) => {
    setCharacter((c) => ({
      ...c,
      physiqueMorph: normalizePhysiqueMorph(
        { ...defaultMorphFromBodyType(isBodyType(c.bodyType ?? '') ? c.bodyType : null), ...c.physiqueMorph, ...patch },
      ),
    }))
  }

  const rollBodyTypeWithSpectacle = () => {
    const { bodyType, d10 } = rollRandomBodyType()
    setSpectacle({
      dice: [makeSpectacleDie(10, d10, { group: 'BODY' })],
      title: 'Body type',
      subtitle: `1d10 → ${bodyType}`,
      apply: () => applyBodyType(bodyType),
    })
  }

  const rollHeightWeightWithSpectacle = () => {
    if (!character.species || !isBodyType(character.bodyType ?? '')) return
    const bodyType = character.bodyType as BodyType
    const result = rollPhysiqueForSpecies(
      character.species,
      bodyType,
      character.abilityScores,
    )
    const dice = physiqueRollToSpectacle(result)
    setSpectacle({
      dice:
        dice.length > 0
          ? dice
          : [makeSpectacleDie(6, result.heightModifier, { group: 'HT' })],
      title: 'Height & weight',
      subtitle: `${formatHeightInches(result.heightInches)} · ${formatWeightLbs(result.weightLbs)} (${bodyType})`,
      apply: () =>
        setCharacter((c) => ({
          ...c,
          bodyType: result.bodyType,
          heightInches: result.heightInches,
          weightLbs: result.weightLbs,
          heightModifierRoll: result.heightModifier,
          weightModifierRoll: result.weightModifier,
        })),
    })
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

  const setEndowmentSize = (
    key: 'breastsSize' | 'phallusSize' | 'vaginaSize',
    size: EndowmentSize | undefined,
  ) => {
    setCharacter((c) => {
      const nextSize =
        key === 'phallusSize' && size
          ? clampPhallusSizeForCreature(size, resolveCharacterCreatureSize(c))
          : size
      const withEndowment = withEndowmentOnCharacter(c, {
        ...c.endowment,
        [key]: nextSize,
        ...(key === 'vaginaSize' && nextSize
          ? { vaginaPresent: true }
          : key === 'vaginaSize' && !nextSize
            ? { vaginaPresent: false }
            : {}),
      })
      if (key === 'breastsSize' && nextSize) {
        return {
          ...withEndowment,
          physiqueMorph: normalizePhysiqueMorph({
            ...defaultMorphFromBodyType(
              isBodyType(c.bodyType ?? '') ? c.bodyType : null,
            ),
            ...c.physiqueMorph,
            breastScale: breastMorphFromEndowmentSize(nextSize),
          }),
        }
      }
      return withEndowment
    })
  }

  const handleGenderChange = (gender: string) => {
    const trait =
      gender === 'Agender' && character.genitalTrait
        ? character.genitalTrait
        : defaultGenitalTraitForGender(gender)
    setCharacter((c) =>
      applyGenitalTraitSelection({ ...c, genderIdentity: gender }, trait),
    )
  }

  const handleGenitalTraitChange = (trait: GenitalTraitId) => {
    setCharacter((c) => applyGenitalTraitSelection(c, trait))
  }

  const handleRandomizeAll = () => {
    if (
      !window.confirm(
        'Replace this sheet with a fully randomized character? Unsaved edits will be lost.',
      )
    ) {
      return
    }
    clearDraft()
    setCharacter(withMergedProficiencies(generateRandomCharacter()))
    setStep(0)
    setCopyHint(null)
    setPersistHint('Randomized a full character.')
    window.setTimeout(() => setPersistHint(null), 2500)
  }

  return (
    <div className="page creator">
      <h1 className="page-title">Create character</h1>

      <div className="creator-persist-toolbar" role="region" aria-label="Save and export">
        <button type="button" className="btn btn-primary" onClick={handleRandomizeAll}>
          Randomize all
        </button>
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
          Opening <strong>Create</strong> starts a new character. Your work autosaves while you
          edit (refresh restores it). Use <strong>Save to this device</strong> to pin a copy in
          the saved list.
        </p>
        {persistHint && <span className="muted">{persistHint}</span>}
      </div>

      <nav className="creator-progress" aria-label="Creation steps">
        {STEP_LABELS.map((label, i) => {
          const complete = isStepComplete(i)
          const current = i === step
          return (
            <button
              key={label}
              type="button"
              className={[
                'creator-progress__step',
                complete ? 'done' : '',
                current ? 'current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={current ? 'step' : undefined}
              onClick={() => setStep(i)}
            >
              <span className="creator-progress__num">{i + 1}</span>
              {label}
            </button>
          )
        })}
      </nav>

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
            <label htmlFor="char-gender">Gender</label>
            <select
              id="char-gender"
              value={isCanonicalGender(character.genderIdentity) ? character.genderIdentity : ''}
              onChange={(e) => handleGenderChange(e.target.value)}
            >
              <option value="" disabled>
                Select gender
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <p className="hint">
              Gender sets a default biological presentation on the Species step (Male → Phallic,
              Female → Vaginal, Intersex → Hermaphrodite). You can override it there.
            </p>
          </div>
          <div className="creator-field">
            <label htmlFor="char-pronouns">Pronouns</label>
            <select
              id="char-pronouns"
              value={isPronounOption(character.pronouns) ? character.pronouns : ''}
              onChange={(e) =>
                setCharacter((c) => ({ ...c, pronouns: e.target.value }))
              }
            >
              <option value="" disabled>
                Select pronouns
              </option>
              {PRONOUNS.map((p) => (
                <option key={p} value={p}>
                  {p}
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
            <label>Species</label>
            <SpeciesFamilyPicker
              speciesId={character.species}
              genderIdentity={character.genderIdentity}
              onSelectSpecies={applySpeciesChange}
              onLineageConfirmed={() => setStep(1)}
            />
            {speciesRow && (
              <p className="hint" style={{ marginTop: '0.65rem' }}>
                Selected: <strong>{speciesRow.name}</strong>. Continues on the Species step for
                carnal lore, physique, and biology.
              </p>
            )}
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
                    onClick={() => rollOneAbilityWithSpectacle(key, label)}
                  >
                    Roll
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={rollAllAbilitiesWithSpectacle}
              >
                Roll all abilities (4d6 drop lowest)
              </button>
            </div>
            <div className="creator-dice-tray" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="fun-die-sides">Dice tray</label>
              <p className="hint" style={{ marginTop: 0 }}>
                Send fantasy polyhedrals tumbling across the screen — d4 through d100.
              </p>
              <div className="creator-inline-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <select
                  id="fun-die-sides"
                  value={funDieSides}
                  onChange={(e) => setFunDieSides(Number(e.target.value) as DiceSides)}
                >
                  {DICE_SIDES.map((sides) => (
                    <option key={sides} value={sides}>
                      {labelForSides(sides)}
                    </option>
                  ))}
                </select>
                <label className="creator-inline-label" htmlFor="fun-die-count">
                  Count
                  <input
                    id="fun-die-count"
                    type="number"
                    min={1}
                    max={20}
                    value={funDieCount}
                    onChange={(e) =>
                      setFunDieCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                    }
                    style={{ width: '4.5rem', marginLeft: '0.35rem' }}
                  />
                </label>
                <button type="button" className="btn" onClick={rollFunDiceWithSpectacle}>
                  Roll across screen
                </button>
              </div>
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
        </section>
      )}

      {step === 1 && (
        <section aria-labelledby="step-species">
          <h2 id="step-species" className="creator-step-title">
            Species
          </h2>
          {!speciesRow ? (
            <div className="creator-field">
              <p className="hint">
                Choose an ancestry and lineage on the Identity step first.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setStep(0)}>
                Back to Identity
              </button>
            </div>
          ) : (
            <>
              <div className="creator-species-layout">
                <SpeciesPortrait
                  src={getCharacterPortraitSrc(character)}
                  speciesId={character.species}
                  genderIdentity={character.genderIdentity}
                  alt={speciesRow.name ? `${speciesRow.name} portrait` : ''}
                  className="creator-species-layout__portrait"
                  imgClassName="creator-species-layout__img"
                />
                <PaperDollViewer
                  character={character}
                  className="creator-species-layout__doll"
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

              <h3 className="creator-subheading">Physique</h3>
              {speciesAllowsCreatureSizeChoice(character.species) && (
                <div className="creator-field">
                  <label htmlFor="char-creature-size">Size</label>
                  <select
                    id="char-creature-size"
                    value={
                      isCreatureSize(character.creatureSize ?? '')
                        ? character.creatureSize
                        : 'Medium'
                    }
                    onChange={(e) => {
                      const size = e.target.value as CreatureSize
                      if (!isCreatureSize(size)) return
                      setCharacter((c) => ({ ...c, creatureSize: size }))
                    }}
                  >
                    {CREATURE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <p className="hint">
                    Humans, elves, and dwarves may be Medium or Small (creature size for play).
                    Height and weight still use your lineage table and body type.
                  </p>
                </div>
              )}
              <div className="creator-field">
                <label htmlFor="char-body-type">Body type</label>
                <div className="creator-inline-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <select
                    id="char-body-type"
                    value={isBodyType(character.bodyType ?? '') ? character.bodyType : ''}
                    onChange={(e) => {
                      if (isBodyType(e.target.value)) applyBodyType(e.target.value)
                    }}
                  >
                    <option value="" disabled>
                      Select body type
                    </option>
                    {BODY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn" onClick={rollBodyTypeWithSpectacle}>
                    Roll body type (1d10)
                  </button>
                </div>
                {isBodyType(character.bodyType ?? '') && (
                  <p className="hint" style={{ marginTop: '0.45rem' }}>
                    <strong>{character.bodyType}.</strong>{' '}
                    {BODY_TYPE_DESCRIPTIONS[character.bodyType as BodyType]}
                  </p>
                )}
              </div>
              <div className="creator-field">
                <label>Figure morph</label>
                <p className="hint" style={{ marginTop: 0 }}>
                  Approximate sliders on painted bases — blends body arts and gently scales bust /
                  hips / legs. Not a true 3D morph.
                </p>
                <div className="physique-sliders">
                  {(
                    [
                      ['muscle', 'Fitness / muscle'],
                      ['fat', 'Softness / fat'],
                      ['hipWidth', 'Hip width'],
                      ['legGirth', 'Leg girth'],
                      ['breastScale', 'Bust size'],
                    ] as const
                  ).map(([key, label]) => {
                    const morph = normalizePhysiqueMorph(
                      character.physiqueMorph,
                      defaultMorphFromBodyType(
                        isBodyType(character.bodyType ?? '') ? character.bodyType : null,
                      ),
                    )
                    const showBust =
                      character.genderIdentity === 'Female' ||
                      character.genitalTrait === 'vaginal' ||
                      character.genitalTrait === 'hermaphrodite' ||
                      character.genitalTrait === 'shemale' ||
                      Boolean(character.endowment.breastsSize)
                    if (key === 'breastScale' && !showBust) return null
                    const value = morph[key]
                    return (
                      <div className="physique-slider" key={key}>
                        <label htmlFor={`morph-${key}`}>{label}</label>
                        <input
                          id={`morph-${key}`}
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(value * 100)}
                          onChange={(e) =>
                            patchPhysiqueMorph({ [key]: Number(e.target.value) / 100 })
                          }
                        />
                        <span className="physique-slider__value muted">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="creator-field">
                <label>Height &amp; weight</label>
                <p className="hint" style={{ marginTop: 0 }}>
                  {describeSpeciesHeightWeightFormula(character.species)} Body type scales the
                  final weight.
                </p>
                <div className="creator-inline-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!isBodyType(character.bodyType ?? '')}
                    onClick={rollHeightWeightWithSpectacle}
                  >
                    Roll height &amp; weight
                  </button>
                  {typeof character.heightInches === 'number' &&
                    typeof character.weightLbs === 'number' && (
                      <span className="creator-derived-value">
                        {formatHeightInches(character.heightInches)} ·{' '}
                        {formatWeightLbs(character.weightLbs)}
                        {character.bodyType ? ` · ${character.bodyType}` : ''}
                      </span>
                    )}
                </div>
              </div>

              <h3 className="creator-subheading">Biology &amp; endowment</h3>
              <div className="creator-field">
                <label htmlFor="char-genital-trait">Biological presentation</label>
                <select
                  id="char-genital-trait"
                  value={activeGenitalTrait}
                  onChange={(e) =>
                    handleGenitalTraitChange(e.target.value as GenitalTraitId)
                  }
                >
                  {GENITAL_TRAIT_DEFINITIONS.map((def) => (
                    <option key={def.id} value={def.id} title={def.tooltip}>
                      {def.label}
                    </option>
                  ))}
                </select>
                <p className="hint">
                  {GENITAL_TRAIT_DEFINITIONS.find((d) => d.id === activeGenitalTrait)?.summary}
                </p>
                <p className="hint">{describeEndowmentShape(activeGenitalTrait)}</p>
                <details className="creator-genital-tooltip">
                  <summary>Rules for this presentation</summary>
                  <p>
                    {GENITAL_TRAIT_DEFINITIONS.find((d) => d.id === activeGenitalTrait)?.tooltip}
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
              {endowmentShape.hasBreasts && (
                <div className="creator-field creator-field--inline-actions">
                  <label htmlFor="endowment-breasts">Breasts size</label>
                  <div className="creator-inline-row">
                    <select
                      id="endowment-breasts"
                      value={character.endowment.breastsSize ?? ''}
                      onChange={(e) =>
                        setEndowmentSize(
                          'breastsSize',
                          isEndowmentSize(e.target.value) ? e.target.value : undefined,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {ENDOWMENT_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setEndowmentSize('breastsSize', rollEndowmentSize())}
                    >
                      Roll (1d6)
                    </button>
                  </div>
                  {character.endowment.breastsSize &&
                    isEndowmentSize(character.endowment.breastsSize) && (
                      <p className="hint" style={{ marginTop: '0.45rem' }}>
                        {describeBreastsSize(character.endowment.breastsSize)}
                      </p>
                    )}
                </div>
              )}
              {endowmentShape.hasPhallus && (
                <div className="creator-field creator-field--inline-actions">
                  <label htmlFor="endowment-phallus">Phallus size</label>
                  <div className="creator-inline-row">
                    <select
                      id="endowment-phallus"
                      value={character.endowment.phallusSize ?? ''}
                      onChange={(e) =>
                        setEndowmentSize(
                          'phallusSize',
                          isEndowmentSize(e.target.value) ? e.target.value : undefined,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {phallusSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {formatPhallusSizeLabel(size, creatureSize)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        setEndowmentSize('phallusSize', rollPhallusSize(creatureSize))
                      }
                    >
                      Roll size (1d6)
                    </button>
                  </div>
                  {character.endowment.phallusSize &&
                    isEndowmentSize(character.endowment.phallusSize) && (
                      <>
                        <p className="hint" style={{ marginTop: '0.45rem' }}>
                          {describePhallusSize(character.endowment.phallusSize, creatureSize)}{' '}
                          Roll 1d20 for an exact length (category base + 0.1″ × the roll; a 20 adds
                          2″).
                        </p>
                        <div className="creator-inline-row" style={{ marginTop: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              const die = rollPhallusLengthDie()
                              const size = character.endowment.phallusSize!
                              const inches = computePhallusLengthInches(
                                size,
                                creatureSize,
                                die,
                              )
                              setSpectacle({
                                dice: [makeSpectacleDie(20, die, { group: 'LEN' })],
                                title: 'Phallus length',
                                subtitle: `${formatPhallusSizeLabel(size, creatureSize)} → ${inches}"`,
                                apply: () =>
                                  setCharacter((c) =>
                                    withEndowmentOnCharacter(c, {
                                      ...c.endowment,
                                      phallusLengthDie: die,
                                    }),
                                  ),
                              })
                            }}
                          >
                            Roll exact length (1d20)
                          </button>
                          {typeof character.endowment.phallusLengthDie === 'number' && (
                            <span className="creator-derived-value">
                              {computePhallusLengthInches(
                                character.endowment.phallusSize,
                                creatureSize,
                                character.endowment.phallusLengthDie,
                              )}
                              &quot; · 1d20→{character.endowment.phallusLengthDie}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                </div>
              )}
              {endowmentShape.hasVagina && (
                <div className="creator-field creator-field--inline-actions">
                  <label htmlFor="endowment-vagina">Vagina size</label>
                  <div className="creator-inline-row">
                    <select
                      id="endowment-vagina"
                      value={character.endowment.vaginaSize ?? ''}
                      onChange={(e) =>
                        setEndowmentSize(
                          'vaginaSize',
                          isEndowmentSize(e.target.value) ? e.target.value : undefined,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {ENDOWMENT_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setEndowmentSize('vaginaSize', rollEndowmentSize())}
                    >
                      Roll (1d6)
                    </button>
                  </div>
                  {character.endowment.vaginaSize &&
                    isEndowmentSize(character.endowment.vaginaSize) && (
                      <p className="hint" style={{ marginTop: '0.45rem' }}>
                        {describeVaginaSize(character.endowment.vaginaSize)}
                      </p>
                    )}
                </div>
              )}
              {(endowmentShape.hasBreasts ||
                endowmentShape.hasPhallus ||
                endowmentShape.hasVagina) && (
                <div className="creator-field">
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      setCharacter((c) => {
                        const shape = endowmentShapeFromGenitalTrait(
                          c.genitalTrait ?? inferGenitalTraitFromCharacter(c),
                        )
                        const size = resolveCharacterCreatureSize(c)
                        return withEndowmentOnCharacter(c, {
                          ...c.endowment,
                          breastsSize: shape.hasBreasts
                            ? rollEndowmentSize()
                            : undefined,
                          phallusSize: shape.hasPhallus
                            ? rollPhallusSize(size)
                            : undefined,
                          vaginaPresent: shape.hasVagina,
                          vaginaSize: shape.hasVagina ? rollEndowmentSize() : undefined,
                        })
                      })
                    }
                  >
                    Roll all present endowments
                  </button>
                </div>
              )}

              <h3 className="creator-subheading">Portrait</h3>
              <PortraitPicker
                character={character}
                onChange={(portraitSrc) => setCharacter((c) => ({ ...c, portraitSrc }))}
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
                lede={`${sexualHistoryTraitSelectionLabel(character.sexualHistory)} Traits are minor features that refine sexuality and description; some are exclusive to species, class, or history.`}
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

      {spectacle && (
        <DiceRollOverlay
          dice={spectacle.dice}
          title={spectacle.title}
          subtitle={spectacle.subtitle}
          onComplete={finishSpectacle}
        />
      )}
    </div>
  )
}
