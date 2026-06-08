import { useMemo } from 'react'
import {
  getCharacterPortraitSrc,
  getDefaultSpeciesPortraitSrc,
  listPortraitCatalog,
  listPortraitOptionsForSpecies,
  type PortraitOption,
} from '../lib/speciesPortrait'
import type { EdndCharacter } from '../types/character'
import './PortraitPicker.css'

type PortraitPickerProps = {
  character: Pick<EdndCharacter, 'species' | 'genderIdentity' | 'portraitSrc'>
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
  const recommended = useMemo(
    () => (character.species ? listPortraitOptionsForSpecies(character.species) : []),
    [character.species],
  )
  const effectiveSrc = getCharacterPortraitSrc(character)
  const defaultSrc = character.species
    ? getDefaultSpeciesPortraitSrc(character.species, character.genderIdentity)
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
            Pick any stock portrait for your sheet. When unset, the app suggests art for your species
            and gender.
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

      {recommended.length > 0 && (
        <div className="portrait-picker__section">
          <h3 className="portrait-picker__heading">Recommended for your species</h3>
          {renderGrid(recommended)}
        </div>
      )}

      <div className="portrait-picker__section">
        <h3 className="portrait-picker__heading">All portraits</h3>
        {renderGrid(catalog)}
      </div>
    </div>
  )
}
