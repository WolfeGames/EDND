import { Link, Navigate, useParams } from 'react-router-dom'
import { getBestiaryEntry } from '../../data/registry'
import { abilityModifier } from '../../lib/abilityScores'
import { getBestiaryTier } from '../../lib/bestiaryTier'
import type { BestiaryAbilityScores, BestiaryEntry } from '../../types/tables'
import './BestiaryPages.css'

const ABILITY_ORDER: Array<{ key: keyof BestiaryAbilityScores; label: string }> = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
]

function formatMod(score: number): string {
  const mod = abilityModifier(score)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function AbilityGrid({ scores }: { scores: BestiaryAbilityScores }) {
  return (
    <div className="bestiary-abilities" role="table" aria-label="Ability scores">
      {ABILITY_ORDER.map(({ key, label }) => (
        <div key={key} className="bestiary-abilities__cell" role="row">
          <span className="bestiary-abilities__label">{label}</span>
          <span className="bestiary-abilities__score">{scores[key]}</span>
          <span className="bestiary-abilities__mod">({formatMod(scores[key])})</span>
        </div>
      ))}
    </div>
  )
}

function BestiaryEntryView({ entry }: { entry: BestiaryEntry }) {
  const tier = getBestiaryTier(entry.sr)

  return (
    <div className="page bestiary-entry">
      <Link to="/bestiary" className="bestiary-entry__back">
        ← Back to bestiary
      </Link>

      <header className="bestiary-entry__header">
        <div className="bestiary-entry__title-row">
          <h1 className="bestiary-entry__title">{entry.name}</h1>
          <div className="bestiary-entry__rating-tags">
            <span className="bestiary-entry__sr-tag">SR {entry.sr}</span>
            <span className="bestiary-entry__sr-tag">{tier.label}</span>
          </div>
        </div>
        <p className="bestiary-entry__subtitle">
          {entry.size} {entry.creatureType.toLowerCase()} ({entry.carnalType})
          {entry.alignment ? ` · ${entry.alignment}` : ''}
        </p>
        <p className="bestiary-entry__tier-note">
          {tier.srRangeLabel}: {tier.description}
        </p>
        {entry.tags && entry.tags.length > 0 && (
          <div className="bestiary-entry__tags" aria-label="Tags">
            {entry.tags.map((t) => (
              <span key={t} className="bestiary-entry__tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <article className="bestiary-entry__block">
        <h2>Description</h2>
        <p className="bestiary-entry__prose">{entry.description}</p>
      </article>

      <article className="bestiary-entry__block">
        <h2>Ability scores</h2>
        <AbilityGrid scores={entry.abilityScores} />
      </article>

      <article className="bestiary-entry__block">
        <h2>Sexual traits</h2>
        {entry.sexualTraits.length === 0 ? (
          <p className="bestiary-entry__prose muted">No sexual traits recorded.</p>
        ) : (
          <div className="bestiary-traits">
            {entry.sexualTraits.map((trait) => (
              <div key={trait.name} className="bestiary-trait">
                <strong className="bestiary-trait__name">{trait.name}</strong>
                <p className="bestiary-trait__mechanical">{trait.mechanical}</p>
                {trait.flavor && (
                  <p className="bestiary-trait__flavor">{trait.flavor}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="bestiary-entry__block">
        <h2>Sexual norms</h2>
        <p className="bestiary-entry__prose">{entry.sexualNorms}</p>
      </article>

      <article className="bestiary-entry__block">
        <h2>Recreational practices</h2>
        <p className="bestiary-entry__prose">{entry.recreationalPractices}</p>
      </article>

      <article className="bestiary-entry__block">
        <h2>Breeding practices</h2>
        <p className="bestiary-entry__prose">{entry.breedingPractices}</p>
      </article>

      <article className="bestiary-entry__block">
        <h2>Encounter hooks</h2>
        <p className="bestiary-entry__prose">{entry.encounterHooks}</p>
      </article>
    </div>
  )
}

export function BestiaryEntryPage() {
  const { id } = useParams<{ id: string }>()
  const entry = id ? getBestiaryEntry(id) : undefined
  if (!entry) return <Navigate to="/bestiary" replace />
  return <BestiaryEntryView entry={entry} />
}
