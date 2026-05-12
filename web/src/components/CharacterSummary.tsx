import { useMemo } from 'react'
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
import { highestAbilityModifier } from '../lib/abilityScores'
import type { EdndCharacter } from '../types/character'
import './CharacterSummary.css'

function FeatureRuleBlock({
  ruleKey,
  text,
  characterLevel,
}: {
  ruleKey: string
  text: string
  characterLevel: number
}) {
  const req = parseFeatureLevelRequirement(ruleKey)
  const unlocked = req === null || characterLevel >= req
  return (
    <div
      className={`feature-block ${unlocked ? 'feature-block--unlocked' : 'feature-block--locked'}`}
    >
      <div className="feature-heading">
        <span className="feature-heading-title">{formatRuleKey(ruleKey)}</span>
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

  return (
    <div className="character-summary">
      <div className="review-section">
        <h3>Identity</h3>
        <ul className="review-list">
          <li>
            <strong>{character.name || '—'}</strong>, level {character.level}{' '}
            {character.adventuringClass || '—'}
          </li>
          <li>
            <strong>Pronouns:</strong> {character.pronouns || '—'}
          </li>
          <li>
            <strong>Biological sex:</strong> {character.genderIdentity || '—'}
          </li>
          <li>
            <strong>Endowment</strong>
            <div style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>
              {endowmentReadout.map((line, i) => (
                <div key={`endo-${i}`}>{line}</div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '0.35rem 0 0' }}>
              {ENDOWMENT_SIZE_RULE}
              {endowedActive && (
                <span>
                  {' '}
                  <strong>Endowed</strong> is applied here: bust and/or phallus sizes are shown one
                  tier larger (max Gargantuan) than stored on the JSON export.
                </span>
              )}
            </p>
          </li>
          {character.background && <li>Background: {character.background}</li>}
          <li>
            <strong>Ability scores:</strong> STR {character.abilityScores.strength}, DEX{' '}
            {character.abilityScores.dexterity}, CON {character.abilityScores.constitution},
            INT {character.abilityScores.intelligence}, WIS {character.abilityScores.wisdom},
            CHA {character.abilityScores.charisma}
          </li>
        </ul>
      </div>

      {speciesRow && (
        <div className="review-section">
          <h3>Species — {speciesRow.name}</h3>
          <ul className="review-list">
            <li>
              Size {speciesRow.size}, speed {speciesRow.speed} ft.
            </li>
            {speciesRow.eroticGrants.length > 0 && (
              <li>Erotic art grants: {speciesRow.eroticGrants.join(', ')}</li>
            )}
            <li>{speciesRow.description}</li>
          </ul>
          <div className="trait-card trait-card--species">
            <strong>Species carnal trait — {speciesRow.carnalTrait}</strong>
            <p className="feature-body">
              {speciesRow.carnalTraitDescription}
            </p>
          </div>
        </div>
      )}

      {historyRow && (
        <div className="review-section">
          <h3>Sexual history — {historyRow.name}</h3>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            {historyRow.description}
          </p>
          <h3 style={{ fontSize: '0.95rem', margin: '0.75rem 0 0.35rem' }}>
            Features
          </h3>
          <div className="feature-list">
            {Object.entries(historyRow.features).map(([k, v]) => (
              <FeatureRuleBlock
                key={k}
                ruleKey={k}
                text={v}
                characterLevel={character.level}
              />
            ))}
          </div>
          <h3 style={{ fontSize: '0.95rem', margin: '0.75rem 0 0.35rem' }}>
            Equipment (from history)
          </h3>
          <ul className="review-list">
            {historyRow.equipment.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {character.sexualHistoryPersonality && (
            <>
              <h3 style={{ fontSize: '0.95rem', margin: '0.75rem 0 0.35rem' }}>
                Personality (chosen)
              </h3>
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
        </div>
      )}

      <div className="review-section">
        <h3>Carnal traits (from history)</h3>
        {resolvedCarnalTraits.length === 0 && unresolvedCarnalLabels.length === 0 ? (
          <p className="muted">—</p>
        ) : (
          <>
            {resolvedCarnalTraits.map((t) => (
              <div key={t.id} className="trait-card">
                <strong>{t.name}</strong>
                <p className="feature-body">{t.description}</p>
              </div>
            ))}
            {unresolvedCarnalLabels.length > 0 && (
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                Not in table yet:{' '}
                {unresolvedCarnalLabels.map((u) => (
                  <span key={u} className="unresolved-pill">
                    {u}
                  </span>
                ))}
              </p>
            )}
          </>
        )}
      </div>

      <div className="review-section">
        <h3>Derived proficiencies</h3>
        <ul className="review-list">
          <li>
            Carnal skills / erotic arts:{' '}
            {character.eroticTraits.carnalSkillProficiencies.length
              ? character.eroticTraits.carnalSkillProficiencies.join(', ')
              : '—'}
          </li>
          <li>
            Positions:{' '}
            {character.eroticTraits.positionProficiencies.length
              ? character.eroticTraits.positionProficiencies.join(', ')
              : '—'}
          </li>
        </ul>
      </div>

      {carnalClassRow && (
        <div className="review-section">
          <h3>Carnal class — {carnalClassRow.name}</h3>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            {carnalClassRow.description}
          </p>
          <ul className="review-list">
            <li>Hit die: d{carnalClassRow.hitDie}</li>
          </ul>
          <div className="feature-list">
            {Object.entries(carnalClassRow.features).map(([k, v]) => (
              <FeatureRuleBlock
                key={k}
                ruleKey={k}
                text={typeof v === 'string' ? v : `${v.name}: ${v.description}`}
                characterLevel={character.level}
              />
            ))}
          </div>
          <ul className="review-list">
            {carnalClassRow.subclasses.length > 0 && (
              <li>
                Subclasses:{' '}
                {carnalClassRow.subclasses
                  .map((s) => (typeof s === 'string' ? s : s.name))
                  .join(', ')}
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="review-section">
        <h3>Erotic profile</h3>
        <ul className="review-list">
          <li>
            Beauty class: {character.eroticTraits.beautyClass} (10 + highest mod{' '}
            {highestAbilityModifier(character.abilityScores)} + other{' '}
            {character.eroticTraits.beautyModifier})
          </li>
          <li>Sexuality bonus: {character.eroticTraits.sexualityBonus}</li>
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
          {character.eroticTraits.eroticToolProficiencies.length > 0 && (
            <li>Tools: {character.eroticTraits.eroticToolProficiencies.join(', ')}</li>
          )}
        </ul>
      </div>
    </div>
  )
}
