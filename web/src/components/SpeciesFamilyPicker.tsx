import { useEffect, useMemo, useState } from 'react'
import {
  SPECIES_FAMILIES,
  familyExampleSpeciesId,
  familyForSpeciesId,
  getSpeciesFamily,
  memberLabel,
  type SpeciesFamily,
  type SpeciesFamilyMember,
} from '../data/speciesFamilies'
import { getDefaultSpeciesPortraitSrc } from '../lib/speciesPortrait'
import './SpeciesFamilyPicker.css'

type SpeciesFamilyPickerProps = {
  speciesId: string
  genderIdentity: string
  onSelectSpecies: (speciesId: string) => void
  /** Called after a concrete lineage is chosen (singleton family or subrace). */
  onLineageConfirmed?: (speciesId: string) => void
}

function portraitFor(
  speciesId: string,
  genderIdentity: string,
): string | null {
  return getDefaultSpeciesPortraitSrc(speciesId, genderIdentity)
}

function FamilyCard({
  family,
  selected,
  genderIdentity,
  onSelect,
}: {
  family: SpeciesFamily
  selected: boolean
  genderIdentity: string
  onSelect: () => void
}) {
  const exampleId = familyExampleSpeciesId(family)
  const src = portraitFor(exampleId, genderIdentity)
  const subCount = family.members.length

  return (
    <button
      type="button"
      className={`species-family-picker__card${selected ? ' species-family-picker__card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {src ? (
        <img
          className="species-family-picker__thumb"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="species-family-picker__thumb species-family-picker__thumb--empty">
          No art
        </div>
      )}
      <span className="species-family-picker__name">{family.name}</span>
      <span className="species-family-picker__meta">
        {subCount > 1 ? `${subCount} lineages` : 'Single lineage'}
      </span>
    </button>
  )
}

function SubraceCard({
  member,
  selected,
  genderIdentity,
  onSelect,
}: {
  member: SpeciesFamilyMember
  selected: boolean
  genderIdentity: string
  onSelect: () => void
}) {
  const src = portraitFor(member.speciesId, genderIdentity)
  return (
    <button
      type="button"
      className={`species-family-picker__card${selected ? ' species-family-picker__card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {src ? (
        <img
          className="species-family-picker__thumb"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="species-family-picker__thumb species-family-picker__thumb--empty">
          No art
        </div>
      )}
      <span className="species-family-picker__name">{memberLabel(member)}</span>
      {member.note && <span className="species-family-picker__meta">{member.note}</span>}
    </button>
  )
}

export function SpeciesFamilyPicker({
  speciesId,
  genderIdentity,
  onSelectSpecies,
  onLineageConfirmed,
}: SpeciesFamilyPickerProps) {
  const currentFamily = speciesId ? familyForSpeciesId(speciesId) : undefined
  const [familyId, setFamilyId] = useState(currentFamily?.id ?? '')

  useEffect(() => {
    if (currentFamily) setFamilyId(currentFamily.id)
  }, [currentFamily])

  const selectedFamily = useMemo(
    () => (familyId ? getSpeciesFamily(familyId) : undefined),
    [familyId],
  )

  const pickFamily = (family: SpeciesFamily) => {
    setFamilyId(family.id)
    if (family.members.length === 1) {
      const only = family.members[0]!.speciesId
      onSelectSpecies(only)
      onLineageConfirmed?.(only)
      return
    }
    // Multi-lineage: clear concrete species until a subrace is chosen
    if (!family.members.some((m) => m.speciesId === speciesId)) {
      onSelectSpecies('')
    }
  }

  const pickMember = (member: SpeciesFamilyMember) => {
    onSelectSpecies(member.speciesId)
    onLineageConfirmed?.(member.speciesId)
  }

  return (
    <div className="species-family-picker">
      <p className="species-family-picker__lede hint">
        Choose a parent ancestry first. Where a people has lineages (for example Dwarf includes
        Duergar, Elf includes Drow), pick the subrace next—each card shows example portrait art.
      </p>

      <h3 className="species-family-picker__heading">Ancestry</h3>
      <div className="species-family-picker__grid" role="list">
        {SPECIES_FAMILIES.map((family) => (
          <FamilyCard
            key={family.id}
            family={family}
            selected={familyId === family.id}
            genderIdentity={genderIdentity}
            onSelect={() => pickFamily(family)}
          />
        ))}
      </div>

      {selectedFamily && (
        <div className="species-family-picker__sub">
          <h3 className="species-family-picker__heading">
            {selectedFamily.members.length > 1
              ? `${selectedFamily.name} lineages`
              : selectedFamily.name}
          </h3>
          <p className="hint" style={{ marginTop: 0 }}>
            {selectedFamily.description}
          </p>
          {selectedFamily.members.length > 1 && (
            <div className="species-family-picker__grid" role="list">
              {selectedFamily.members.map((member) => (
                <SubraceCard
                  key={member.speciesId}
                  member={member}
                  selected={speciesId === member.speciesId}
                  genderIdentity={genderIdentity}
                  onSelect={() => pickMember(member)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
