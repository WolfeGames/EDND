import { useEffect, useId, useMemo, useState } from 'react'
import { getSpecies, species as speciesTable } from '../data/registry'
import { portraitMatchesGender, type PortraitGenderToken } from '../lib/portraitFilename'
import {
  getCharacterPortraitSrc,
  getDefaultSpeciesPortraitSrc,
  listPortraitCatalog,
  type PortraitOption,
} from '../lib/speciesPortrait'
import { resolveSpeciesTableId } from '../lib/speciesAliases'
import type { EdndCharacter } from '../types/character'
import './PortraitPicker.css'

type PortraitPickerProps = {
  character: Pick<EdndCharacter, 'species' | 'genderIdentity' | 'portraitSrc' | 'carnalClass'>
  onChange: (portraitSrc: string | undefined) => void
}

type GenderFilter = 'match' | 'f' | 'm' | 'any'

function PortraitChoice({
  option,
  selected,
  onSelect,
}: {
  option: PortraitOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`portrait-picker__choice${selected ? ' portrait-picker__choice--selected' : ''}`}
      onClick={onSelect}
      title={option.label}
      aria-pressed={selected}
    >
      <img className="portrait-picker__thumb" src={option.src} alt="" loading="lazy" decoding="async" />
      <span className="portrait-picker__label">{option.label}</span>
    </button>
  )
}

function speciesDisplayName(speciesId: string): string {
  return getSpecies(speciesId)?.name ?? speciesId
}

function genderTokenFromVariant(variant: PortraitOption['variant']): PortraitGenderToken {
  if (variant === 'female') return 'f'
  if (variant === 'male') return 'm'
  return 'they'
}

function matchesGenderFilter(
  option: PortraitOption,
  filter: GenderFilter,
  genderIdentity: string,
): boolean {
  if (filter === 'any') return true
  const token = genderTokenFromVariant(option.variant)
  if (filter === 'f' || filter === 'm') {
    return token === filter || token === 'they'
  }
  return portraitMatchesGender(token, genderIdentity)
}

export function PortraitPicker({ character, onChange }: PortraitPickerProps) {
  const speciesFilterId = useId()
  const genderFilterId = useId()
  const catalog = useMemo(() => listPortraitCatalog(), [])

  const speciesOptions = useMemo(() => {
    const ids = [...new Set(catalog.map((o) => o.speciesId))]
    const knownOrder = speciesTable.map((s) => s.id)
    ids.sort((a, b) => {
      const ai = knownOrder.indexOf(a)
      const bi = knownOrder.indexOf(b)
      if (ai >= 0 && bi >= 0) return ai - bi
      if (ai >= 0) return -1
      if (bi >= 0) return 1
      return speciesDisplayName(a).localeCompare(speciesDisplayName(b))
    })
    return ids.map((id) => ({ id, name: speciesDisplayName(id) }))
  }, [catalog])

  const characterSpeciesId = character.species
    ? resolveSpeciesTableId(character.species)
    : ''

  const [filterSpecies, setFilterSpecies] = useState(characterSpeciesId)
  const [filterGender, setFilterGender] = useState<GenderFilter>('match')

  useEffect(() => {
    setFilterSpecies(characterSpeciesId)
  }, [characterSpeciesId])

  const filtered = useMemo(() => {
    let pool = catalog
    if (filterSpecies) {
      pool = pool.filter((o) => o.speciesId === filterSpecies)
    }
    pool = pool.filter((o) =>
      matchesGenderFilter(o, filterGender, character.genderIdentity),
    )

    if (character.carnalClass && filterSpecies === characterSpeciesId) {
      const role = character.carnalClass
      const withRole = pool.filter((o) => o.roleId === role)
      const withoutRole = pool.filter((o) => o.roleId !== role)
      if (withRole.length > 0) {
        return [...withRole, ...withoutRole]
      }
    }
    return pool
  }, [
    catalog,
    filterSpecies,
    filterGender,
    character.genderIdentity,
    character.carnalClass,
    characterSpeciesId,
  ])

  const effectiveSrc = getCharacterPortraitSrc(character)
  const defaultSrc = character.species
    ? getDefaultSpeciesPortraitSrc(
        character.species,
        character.genderIdentity,
        character.carnalClass,
      )
    : null
  const usingDefault = !character.portraitSrc?.trim() || character.portraitSrc === defaultSrc

  const filterLabel = filterSpecies
    ? speciesDisplayName(filterSpecies)
    : 'all species'

  return (
    <div className="portrait-picker">
      <div className="portrait-picker__current">
        {effectiveSrc ? (
          <img
            className="portrait-picker__preview"
            src={effectiveSrc}
            alt="Selected character portrait"
          />
        ) : (
          <div className="portrait-picker__preview portrait-picker__preview--empty muted">
            Choose a portrait below
          </div>
        )}
        <div className="portrait-picker__current-meta">
          <p className="portrait-picker__lede">
            Pick a race to browse matching portraits. Gender filter defaults to your character;
            carnal-class variants sort first when available.
          </p>
          {defaultSrc && (
            <button
              type="button"
              className="btn portrait-picker__default-btn"
              disabled={usingDefault}
              onClick={() => onChange(undefined)}
            >
              Use species default
            </button>
          )}
        </div>
      </div>

      <div className="portrait-picker__filters">
        <div className="portrait-picker__filter">
          <label htmlFor={speciesFilterId}>Race</label>
          <select
            id={speciesFilterId}
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
          >
            <option value="">All races</option>
            {speciesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="portrait-picker__filter">
          <label htmlFor={genderFilterId}>Gender</label>
          <select
            id={genderFilterId}
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as GenderFilter)}
          >
            <option value="match">Match character</option>
            <option value="f">Female</option>
            <option value="m">Male</option>
            <option value="any">Any</option>
          </select>
        </div>
      </div>

      <div className="portrait-picker__section">
        <h3 className="portrait-picker__heading">
          {filtered.length} portrait{filtered.length === 1 ? '' : 's'} · {filterLabel}
        </h3>
        {filtered.length > 0 ? (
          <div className="portrait-picker__grid" role="list">
            {filtered.map((option) => (
              <PortraitChoice
                key={option.src}
                option={option}
                selected={effectiveSrc === option.src}
                onSelect={() => onChange(option.src)}
              />
            ))}
          </div>
        ) : (
          <p className="portrait-picker__empty muted">
            No portraits for this race and gender filter. Try another race or set gender to Any.
          </p>
        )}
      </div>
    </div>
  )
}
