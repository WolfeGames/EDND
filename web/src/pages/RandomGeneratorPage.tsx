import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADVENTURING_CLASSES } from '../data/adventuringClasses'
import { GENDERS, isGenderOption, type GenderOption } from '../data/identityOptions'
import { isCanonicalBiologicalSex } from '../lib/biologicalSex'
import { CharacterSummary } from '../components/CharacterSummary'
import {
  generateRandomCharacter,
  type RandomCharacterFilters,
} from '../lib/generateRandomCharacter'
import { carnalClasses, getSpecies, playableSpecies, sexualHistories } from '../data/registry'
import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'
import { downloadCharacterJson, stashCharacterForSheet, upsertLibrary } from '../lib/characterStorage'
import type { EdndCharacter } from '../types/character'
import './RandomGeneratorPage.css'

const SPECIES_SORTED = [...playableSpecies]

const GENERIC_BACKGROUNDS = [
  'Acolyte',
  'Charlatan',
  'Criminal',
  'Entertainer',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
  'Urchin',
] as const

function buildFiltersFromForm(f: RandomCharacterFilters): RandomCharacterFilters {
  const out: RandomCharacterFilters = {}
  if (f.species?.trim()) out.species = f.species.trim()
  if (f.sexualHistory?.trim()) out.sexualHistory = f.sexualHistory.trim()
  if (f.adventuringClass?.trim()) out.adventuringClass = f.adventuringClass.trim()
  if (f.background?.trim()) out.background = f.background.trim()
  if (f.carnalClass !== undefined && f.carnalClass !== '') {
    out.carnalClass = f.carnalClass
  }
  const g = f.genderIdentity?.trim()
  if (g && isGenderOption(g)) out.genderIdentity = g
  if (f.pronouns?.trim()) out.pronouns = f.pronouns.trim()
  if (f.levelMin !== undefined) out.levelMin = f.levelMin
  if (f.levelMax !== undefined) out.levelMax = f.levelMax
  return out
}

export function RandomGeneratorPage() {
  const navigate = useNavigate()
  const [character, setCharacter] = useState<EdndCharacter | null>(null)
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [saveHint, setSaveHint] = useState<string | null>(null)
  const [filterForm, setFilterForm] = useState<RandomCharacterFilters>({})

  const filterPortraitSrc = useMemo(() => {
    const sid = filterForm.species?.trim()
    const sex = filterForm.genderIdentity ?? ''
    if (!sid || !getSpecies(sid) || !isCanonicalBiologicalSex(sex)) return null
    return getDefaultSpeciesPortraitSrc(sid, sex)
  }, [filterForm.species, filterForm.genderIdentity])

  const roll = () => {
    const filters = buildFiltersFromForm(filterForm)
    setCharacter(
      generateRandomCharacter({
        filters: Object.keys(filters).length ? filters : undefined,
      }),
    )
    setCopyHint(null)
    setSaveHint(null)
  }

  const handleCopyJson = async () => {
    if (!character) return
    const text = JSON.stringify(character, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      setCopyHint('Copied to clipboard.')
      window.setTimeout(() => setCopyHint(null), 2500)
    } catch {
      setCopyHint('Could not copy — try again or copy from devtools.')
    }
  }

  const setFilter = <K extends keyof RandomCharacterFilters>(
    key: K,
    value: RandomCharacterFilters[K],
  ) => {
    setFilterForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="page random-generator">
      <h1 className="page-title">Random character</h1>
      <p className="lede">
        Constrain the roll with the filters below (all optional). Biological sex is rolled or fixed
        to Male or Female. Pronouns are never auto-filled: type them in the filter if you want them
        on the sheet. Sexual history and carnal class features highlight when your rolled level meets
        the printed level gate.
      </p>

      <details className="roll-filters">
        <summary>Roll filters (optional)</summary>
        <div className="filter-grid">
          <label className="filter-field">
            <span>Species</span>
            <select
              value={filterForm.species ?? ''}
              onChange={(e) =>
                setFilter('species', e.target.value || undefined)
              }
            >
              <option value="">Any species</option>
              {SPECIES_SORTED.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Sexual history</span>
            <select
              value={filterForm.sexualHistory ?? ''}
              onChange={(e) =>
                setFilter('sexualHistory', e.target.value || undefined)
              }
            >
              <option value="">Any history</option>
              {sexualHistories.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Adventuring class</span>
            <select
              value={filterForm.adventuringClass ?? ''}
              onChange={(e) =>
                setFilter('adventuringClass', e.target.value || undefined)
              }
            >
              <option value="">Any class</option>
              {ADVENTURING_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Background</span>
            <select
              value={filterForm.background ?? ''}
              onChange={(e) =>
                setFilter('background', e.target.value || undefined)
              }
            >
              <option value="">Any background</option>
              {GENERIC_BACKGROUNDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Carnal class</span>
            <select
              value={
                filterForm.carnalClass === undefined ? '' : filterForm.carnalClass
              }
              onChange={(e) => {
                const v = e.target.value
                if (v === '') setFilter('carnalClass', undefined)
                else if (v === 'none') setFilter('carnalClass', 'none')
                else setFilter('carnalClass', v)
              }}
            >
              <option value="">Random (may assign)</option>
              <option value="none">None</option>
              {carnalClasses.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Biological sex</span>
            <select
              value={filterForm.genderIdentity ?? ''}
              onChange={(e) =>
                setFilter('genderIdentity', e.target.value || undefined)
              }
            >
              <option value="">Any</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Pronouns</span>
            <input
              type="text"
              autoComplete="off"
              value={filterForm.pronouns ?? ''}
              onChange={(e) =>
                setFilter('pronouns', e.target.value || undefined)
              }
              placeholder="Type before rolling (optional)"
            />
          </label>
          <label className="filter-field">
            <span>Level min</span>
            <input
              type="number"
              min={1}
              max={20}
              value={filterForm.levelMin ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                const n = Number(raw)
                setFilter(
                  'levelMin',
                  raw === '' || !Number.isFinite(n)
                    ? undefined
                    : Math.max(1, Math.min(20, n)),
                )
              }}
              placeholder="1"
            />
          </label>
          <label className="filter-field">
            <span>Level max</span>
            <input
              type="number"
              min={1}
              max={20}
              value={filterForm.levelMax ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                const n = Number(raw)
                setFilter(
                  'levelMax',
                  raw === '' || !Number.isFinite(n)
                    ? undefined
                    : Math.max(1, Math.min(20, n)),
                )
              }}
              placeholder="20"
            />
          </label>
        </div>
      </details>

      <div className="summary-actions">
        <button type="button" className="btn btn-primary" onClick={roll}>
          Roll character
        </button>
        {character && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                upsertLibrary(character)
                setSaveHint('Saved to this device (see Saved in the header).')
                window.setTimeout(() => setSaveHint(null), 2500)
              }}
            >
              Save to this device
            </button>
            <button type="button" className="btn" onClick={() => downloadCharacterJson(character)}>
              Download JSON
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
            <button type="button" className="btn" onClick={handleCopyJson}>
              Copy JSON
            </button>
          </>
        )}
      </div>
      {copyHint && (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          {copyHint}
        </p>
      )}
      {saveHint && (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          {saveHint}
        </p>
      )}

      {character ? (
        <>
          <p className="random-species-callout" role="status">
            <span className="random-species-callout__label">Species</span>{' '}
            <span className="random-species-callout__value">
              {character.species?.trim()
                ? getSpecies(character.species)?.name ?? character.species
                : '—'}
            </span>
          </p>
          <CharacterSummary character={character} />
        </>
      ) : (
        <div className="random-empty-preview">
          {filterPortraitSrc ? (
            <img
              className="random-empty-preview__img"
              src={filterPortraitSrc}
              alt=""
              loading="lazy"
            />
          ) : null}
          <p className="muted random-empty-preview__text">
            Set filters if you want, then press <strong>Roll character</strong>.
            {filterPortraitSrc
              ? ' Preview uses species and biological sex from the filters when both are set (Male or Female).'
              : ''}
          </p>
        </div>
      )}
    </div>
  )
}
