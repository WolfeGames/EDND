import { useMemo } from 'react'
import { pickRandom, playableSpecies, sexualHistories } from '../data/registry'
import { computeBeautyClassBreakdown } from '../lib/beautyClassCompute'
import { splitHistoryFeatureBody } from '../lib/sexualHistoryFeatureDisplay'
import type { EdndCharacter, SexualHistoryPersonality } from '../types/character'
import type { SexualHistoryRow } from '../types/tables'
import { RacialSexualTraitsPanel } from './RacialSexualTraitsPanel'
import './CreatorSexualBackgroundStep.css'

type Props = {
  character: EdndCharacter
  historyRow: SexualHistoryRow | undefined
  onSelectHistory: (id: string) => void
  onSelectRace: (id: string) => void
  onPatchPersonality: (patch: Partial<SexualHistoryPersonality>) => void
  onRollAllPersonality: () => void
}

function historyFeaturePreview(
  row: SexualHistoryRow,
  max = 3,
): Array<{ key: string; title: string; mechanical: string }> {
  const entries = Object.entries(row.features).slice(0, max)
  return entries.map(([key, text]) => {
    const split = splitHistoryFeatureBody(text)
    if (split) {
      const mech =
        split.body.match(/Mechanical:\s*([\s\S]*?)(?:\n\nFlavor:|$)/)?.[1]?.trim() ?? ''
      return { key, title: split.titleLine, mechanical: mech }
    }
    return { key, title: key, mechanical: text.slice(0, 120) }
  })
}

export function CreatorSexualBackgroundStep({
  character,
  historyRow,
  onSelectHistory,
  onSelectRace,
  onPatchPersonality,
  onRollAllPersonality,
}: Props) {
  const beauty = useMemo(() => computeBeautyClassBreakdown(character), [character])
  const selectedRace = (character.race || character.species || '').trim()
  const selectedHistory = (character.sexualHistory ?? '').trim()

  return (
    <div className="sexual-background">
      <div className="sexual-background__beauty" aria-live="polite">
        <p className="sexual-background__beauty-label">Beauty class</p>
        <p className="sexual-background__beauty-value">{beauty.total}</p>
        <p className="sexual-background__beauty-formula muted">
          {beauty.base} + {beauty.abilityMod} ability
          {beauty.manualModifier !== 0 ? ` + ${beauty.manualModifier} other` : ''}
          {beauty.traitBonus > 0 ? ` + ${beauty.traitBonus} history & race` : ''}
        </p>
      </div>

      <section className="sexual-background__section" aria-labelledby="sb-history-heading">
        <h3 id="sb-history-heading" className="creator-subheading">
          Sexual history
        </h3>
        <p className="muted sexual-background__lede">
          Choose the path that shaped your appetites. Theme and features preview below; beauty class
          updates as you select.
        </p>
        <ul className="sexual-background__card-grid" role="list">
          {sexualHistories.map((h) => {
            const selected = selectedHistory === h.id
            const previews = historyFeaturePreview(h)
            return (
              <li key={h.id}>
                <button
                  type="button"
                  className={[
                    'sexual-background__card',
                    'sexual-background__card--history',
                    selected ? 'sexual-background__card--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected}
                  onClick={() => onSelectHistory(h.id)}
                >
                  <span className="sexual-background__card-eyebrow">Sexual history</span>
                  <span className="sexual-background__card-title">{h.name}</span>
                  {h.traitPoints !== undefined && (
                    <span className="sexual-background__card-meta">
                      {h.traitPoints} carnal trait points
                    </span>
                  )}
                  <p className="sexual-background__card-theme">{h.description}</p>
                  {previews.length > 0 && (
                    <ul className="sexual-background__feature-preview">
                      {previews.map((f) => (
                        <li key={f.key}>
                          <strong>{f.title}</strong>
                          <span>{f.mechanical}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="sexual-background__section" aria-labelledby="sb-race-heading">
        <h3 id="sb-race-heading" className="creator-subheading">
          Race
        </h3>
        <p className="muted sexual-background__lede">
          Ancestry from the racial sexual traits tables — shared and subrace features apply on your
          sheet.
        </p>
        <ul
          className="sexual-background__card-grid sexual-background__card-grid--race"
          role="list"
        >
          {playableSpecies.map((s) => {
            const selected = selectedRace === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={[
                    'sexual-background__card',
                    'sexual-background__card--race',
                    selected ? 'sexual-background__card--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected}
                  onClick={() => onSelectRace(s.id)}
                >
                  <span className="sexual-background__card-eyebrow">Race</span>
                  <span className="sexual-background__card-title">{s.name}</span>
                  <p className="sexual-background__card-theme">{s.description}</p>
                </button>
              </li>
            )
          })}
        </ul>
        {selectedRace ? (
          <RacialSexualTraitsPanel
            speciesId={selectedRace}
            headingClassName="creator-subheading"
            className="sexual-background__racial-traits"
            groupClassName="sexual-background__trait-group"
          />
        ) : null}
      </section>

      {(character.appliedTraits?.length ?? 0) > 0 && (
        <section className="sexual-background__applied" aria-label="Applied traits">
          <h3 className="creator-subheading">Applied traits</h3>
          <ul className="sexual-background__applied-list">
            {(character.appliedTraits ?? []).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {historyRow?.personality && (
        <section className="sexual-background__personality" aria-labelledby="sb-personality-heading">
          <h3 id="sb-personality-heading" className="creator-subheading">
            Personality (from history)
          </h3>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Choose one from each list or roll — all four are required to continue.
          </p>
          <div className="creator-personality">
            <div className="creator-field creator-field--inline-actions">
              <label htmlFor="shp-trait">Personality trait</label>
              <div className="creator-inline-row">
                <select
                  id="shp-trait"
                  value={character.sexualHistoryPersonality?.trait ?? ''}
                  onChange={(e) => onPatchPersonality({ trait: e.target.value })}
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
                    onPatchPersonality({
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
                  onChange={(e) => onPatchPersonality({ ideal: e.target.value })}
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
                    onPatchPersonality({
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
                  onChange={(e) => onPatchPersonality({ bond: e.target.value })}
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
                    onPatchPersonality({
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
                  onChange={(e) => onPatchPersonality({ flaw: e.target.value })}
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
                    onPatchPersonality({
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
                onClick={onRollAllPersonality}
              >
                Roll all personality
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
