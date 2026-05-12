import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCarnalClass, getSexualHistory, getSpecies } from '../data/registry'
import { abilityModifier } from '../lib/abilityScores'
import { characterHasEndowedTrait, getSheetEndowmentProfile } from '../lib/endowedTrait'
import { ENDOWMENT_SIZE_RULE, formatEndowmentLines } from '../lib/endowment'
import { getFromLibrary, peekCharacterFromSheetStash } from '../lib/characterStorage'
import { parseFeatureLevelRequirement } from '../lib/parseFeatureLevelRequirement'
import type { EdndCharacter } from '../types/character'
import './CharacterSheetPage.css'

const ABILITIES: Array<{ key: keyof EdndCharacter['abilityScores']; label: string }> = [
  ['strength', 'STR'],
  ['dexterity', 'DEX'],
  ['constitution', 'CON'],
  ['intelligence', 'INT'],
  ['wisdom', 'WIS'],
  ['charisma', 'CHA'],
].map(([key, label]) => ({ key: key as keyof EdndCharacter['abilityScores'], label }))

export function CharacterSheetPage() {
  const [searchParams] = useSearchParams()
  const [character, setCharacter] = useState<EdndCharacter | null>(null)
  const [loadMessage, setLoadMessage] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const c = getFromLibrary(id)
      if (c) {
        setCharacter(c)
        setLoadMessage(null)
        return
      }
      setCharacter(null)
      setLoadMessage('No saved character matches that link. Use Saved or Printable sheet from Create.')
      return
    }
    const stashed = peekCharacterFromSheetStash()
    if (stashed) {
      setCharacter(stashed)
      setLoadMessage(null)
      return
    }
    setCharacter(null)
    setLoadMessage(null)
  }, [searchParams])

  useEffect(() => {
    document.title = character?.name?.trim()
      ? `${character.name.trim()} · ED&D character sheet`
      : 'ED&D character sheet'
  }, [character?.name])

  const speciesRow = useMemo(
    () => (character?.species ? getSpecies(character.species) : undefined),
    [character?.species],
  )
  const historyRow = useMemo(
    () =>
      character?.sexualHistory ? getSexualHistory(character.sexualHistory) : undefined,
    [character?.sexualHistory],
  )
  const carnalClassRow = useMemo(
    () => (character?.carnalClass ? getCarnalClass(character.carnalClass) : undefined),
    [character?.carnalClass],
  )

  const endowmentLines = useMemo(
    () => (character ? formatEndowmentLines(getSheetEndowmentProfile(character)) : []),
    [character],
  )
  const endowedNote = useMemo(
    () => (character ? characterHasEndowedTrait(character) : false),
    [character],
  )

  if (!character && !loadMessage) {
    return (
      <div className="sheet-page">
        <div className="sheet-missing sheet-no-print">
          <h1>Character sheet</h1>
          <p>
            Open a sheet from <Link to="/create">Create</Link> (Printable sheet), from{' '}
            <Link to="/characters">Saved</Link>, or use a saved link with <code>?id=…</code> in the
            URL.
          </p>
          <p>
            <Link to="/">Home</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!character && loadMessage) {
    return (
      <div className="sheet-page">
        <div className="sheet-missing sheet-no-print">
          <h1>Character sheet</h1>
          <p>{loadMessage}</p>
          <p>
            <Link to="/characters">Saved characters</Link> · <Link to="/">Home</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!character) return null

  const c = character

  return (
    <div className="sheet-page">
      <header className="sheet-toolbar sheet-no-print">
        <Link to="/">Home</Link>
        <Link to={`/create?id=${encodeURIComponent(c.id)}`}>Edit in creator</Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </header>

      <article className="sheet sheet-print-root">
        <header className="sheet-header">
          <div className="sheet-name-block">
            <h1 className="sheet-char-name">{c.name.trim() || 'Unnamed character'}</h1>
            <div className="sheet-sub">
              {speciesRow?.name ?? '—'} · {c.adventuringClass || '—'} · Level {c.level}
            </div>
          </div>
          <div className="sheet-meta-grid">
            <div className="sheet-meta-cell">
              <span className="sheet-meta-label">Background</span>
              <span className="sheet-meta-value">{c.background || '—'}</span>
            </div>
            <div className="sheet-meta-cell">
              <span className="sheet-meta-label">Player</span>
              <span className="sheet-meta-value"> </span>
            </div>
            <div className="sheet-meta-cell">
              <span className="sheet-meta-label">Pronouns</span>
              <span className="sheet-meta-value">{c.pronouns || '—'}</span>
            </div>
            <div className="sheet-meta-cell">
              <span className="sheet-meta-label">Biological sex</span>
              <span className="sheet-meta-value">{c.genderIdentity || '—'}</span>
            </div>
          </div>
        </header>

        <section className="sheet-section" aria-labelledby="abilities-heading">
          <h2 id="abilities-heading" className="sheet-section-title">
            Ability scores
          </h2>
          <div className="sheet-abilities">
            {ABILITIES.map(({ key, label }) => {
              const score = c.abilityScores[key]
              const mod = abilityModifier(score)
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`
              return (
                <div key={key} className="sheet-ability-box">
                  <div className="sheet-ability-label">{label}</div>
                  <div className="sheet-ability-score">{score}</div>
                  <div className="sheet-ability-mod">{modStr}</div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="sheet-columns">
          <section className="sheet-section" aria-labelledby="prof-heading">
            <h2 id="prof-heading" className="sheet-section-title">
              Proficiencies &amp; training
            </h2>
            <div className="sheet-block">
              <h3 className="sheet-block-title">Carnal / erotic arts</h3>
              <p className="sheet-block-body">
                {c.eroticTraits.carnalSkillProficiencies.length
                  ? c.eroticTraits.carnalSkillProficiencies.join(', ')
                  : '—'}
              </p>
            </div>
            <div className="sheet-block">
              <h3 className="sheet-block-title">Positions</h3>
              <p className="sheet-block-body">
                {c.eroticTraits.positionProficiencies.length
                  ? c.eroticTraits.positionProficiencies.join(', ')
                  : '—'}
              </p>
            </div>
            <div className="sheet-block">
              <h3 className="sheet-block-title">Erotic tools</h3>
              <p className="sheet-block-body">
                {c.eroticTraits.eroticToolProficiencies.length
                  ? c.eroticTraits.eroticToolProficiencies.join(', ')
                  : '—'}
              </p>
            </div>
          </section>

          <section className="sheet-section" aria-labelledby="erotic-heading">
            <h2 id="erotic-heading" className="sheet-section-title">
              Erotic profile
            </h2>
            <div className="sheet-block">
              <h3 className="sheet-block-title">Beauty &amp; drive</h3>
              <p className="sheet-block-body">
                Beauty class <strong>{c.eroticTraits.beautyClass}</strong> (modifier{' '}
                {c.eroticTraits.beautyModifier >= 0 ? '+' : ''}
                {c.eroticTraits.beautyModifier}). Sexuality bonus{' '}
                <strong>+{c.eroticTraits.sexualityBonus}</strong>.
              </p>
            </div>
            <div className="sheet-block">
              <h3 className="sheet-block-title">Endowment (sheet display)</h3>
              <ul className="sheet-list">
                {endowmentLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="sheet-fine-print">{ENDOWMENT_SIZE_RULE}</p>
              {endowedNote && (
                <p className="sheet-fine-print">
                  <strong>Endowed</strong> (from sexual history): bust and/or phallus sizes above are
                  one tier larger than stored values, capped at Gargantuan.
                </p>
              )}
            </div>
            <div className="sheet-block">
              <h3 className="sheet-block-title">Attraction &amp; boundaries</h3>
              <p className="sheet-block-body">
                <strong>Attraction:</strong> {c.eroticTraits.attraction || '—'}
                <br />
                <strong>Repulsion:</strong> {c.eroticTraits.repulsion || '—'}
                <br />
                <strong>Morality:</strong> {c.eroticTraits.sexualMorality || '—'}
                <br />
                <strong>Orientation:</strong> {c.eroticTraits.orientation || '—'}
              </p>
            </div>
          </section>
        </div>

        {speciesRow && (
          <section className="sheet-section">
            <h2 className="sheet-section-title">Species — {speciesRow.name}</h2>
            <p className="sheet-prose">{speciesRow.description}</p>
            <div className="sheet-trait-callout">
              <strong>{speciesRow.carnalTrait}</strong> — {speciesRow.carnalTraitDescription}
            </div>
          </section>
        )}

        {historyRow && (
          <section className="sheet-section">
            <h2 className="sheet-section-title">Sexual history — {historyRow.name}</h2>
            <p className="sheet-prose">{historyRow.description}</p>
            {c.sexualHistoryPersonality && (
              <ul className="sheet-list sheet-personality">
                <li>
                  <strong>Trait:</strong> {c.sexualHistoryPersonality.trait || '—'}
                </li>
                <li>
                  <strong>Ideal:</strong> {c.sexualHistoryPersonality.ideal || '—'}
                </li>
                <li>
                  <strong>Bond:</strong> {c.sexualHistoryPersonality.bond || '—'}
                </li>
                <li>
                  <strong>Flaw:</strong> {c.sexualHistoryPersonality.flaw || '—'}
                </li>
              </ul>
            )}
            <h3 className="sheet-block-title">History features</h3>
            <ul className="sheet-list">
              {Object.entries(historyRow.features).map(([k, v]) => {
                const req = parseFeatureLevelRequirement(k)
                const unlocked = req === null || c.level >= req
                return (
                  <li key={k} className={unlocked ? '' : 'sheet-list-locked'}>
                    <strong>{k}</strong>
                    {req !== null && ` (level ${req}+)`}: {v}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {carnalClassRow && (
          <section className="sheet-section">
            <h2 className="sheet-section-title">Carnal class — {carnalClassRow.name}</h2>
            <p className="sheet-prose">{carnalClassRow.description}</p>
            <ul className="sheet-list">
              {Object.entries(carnalClassRow.features).map(([k, v]) => {
                const req = parseFeatureLevelRequirement(k)
                const unlocked = req === null || c.level >= req
                const text = typeof v === 'string' ? v : `${v.name}: ${v.description}`
                return (
                  <li key={k} className={unlocked ? '' : 'sheet-list-locked'}>
                    <strong>{k}</strong>
                    {req !== null && ` (level ${req}+)`}: {text}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="sheet-section sheet-notes">
          <h2 className="sheet-section-title">Notes &amp; equipment</h2>
          <div className="sheet-notes-lines" aria-label="Blank notes space" />
          {historyRow && historyRow.equipment.length > 0 && (
            <>
              <h3 className="sheet-block-title">History equipment</h3>
              <ul className="sheet-list">
                {historyRow.equipment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </article>
    </div>
  )
}
