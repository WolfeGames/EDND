import { useMemo } from 'react'
import {
  getCharacterPortraitSrc,
  getDefaultSpeciesPortraitSrc,
  listPortraitCatalog,
  listPortraitOptionsForCharacter,
  type PortraitOption,
} from '../lib/speciesPortrait'
import type { EdndCharacter } from '../types/character'
import './PortraitPicker.css'

type PortraitPickerProps = {
  character: Pick<EdndCharacter, 'species' | 'genderIdentity' | 'portraitSrc' | 'carnalClass'>
  onChange: (portraitSrc: string | undefined) => void
}

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

export function PortraitPicker({ character, onChange }: PortraitPickerProps) {
  const catalog = useMemo(() => listPortraitCatalog(), [])
  const forCharacter = useMemo(
    () =>
      character.species
        ? listPortraitOptionsForCharacter(
            character.species,
            character.genderIdentity,
            character.carnalClass,
          )
        : [],
    [character.species, character.genderIdentity, character.carnalClass],
  )
  const roleMatches = useMemo(
    () =>
      character.carnalClass
        ? forCharacter.filter((o) => o.roleId === character.carnalClass)
        : [],
    [forCharacter, character.carnalClass],
  )
  const effectiveSrc = getCharacterPortraitSrc(character)
  const defaultSrc = character.species
    ? getDefaultSpeciesPortraitSrc(
        character.species,
        character.genderIdentity,
        character.carnalClass,
      )
    : null
  const usingDefault = !character.portraitSrc?.trim() || character.portraitSrc === defaultSrc

  const renderGrid = (options: PortraitOption[]) => (
    <div className="portrait-picker__grid" role="list">
      {options.map((option) => (
        <PortraitChoice
          key={option.src}
          option={option}
          selected={effectiveSrc === option.src}
          onSelect={() => onChange(option.src)}
        />
      ))}
    </div>
  )

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
            Portraits are filtered by species and gender. Variants tagged with your carnal class
            appear first when available.
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

      {forCharacter.length > 0 && (
        <div className="portrait-picker__section">
          <h3 className="portrait-picker__heading">
            {character.carnalClass && roleMatches.length > 0
              ? 'Matching species, gender & carnal class'
              : 'Matching species & gender'}
          </h3>
          {renderGrid(roleMatches.length > 0 ? roleMatches : forCharacter)}
        </div>
      )}

      {forCharacter.length > 0 && forCharacter.length < catalog.length && (
        <div className="portrait-picker__section">
          <h3 className="portrait-picker__heading">All portraits</h3>
          {renderGrid(catalog)}
        </div>
      )}

      {forCharacter.length === 0 && (
        <div className="portrait-picker__section">
          <h3 className="portrait-picker__heading">All portraits</h3>
          {renderGrid(catalog)}
        </div>
      )}
    </div>
  )
}
