import { useEffect, useId, useMemo, useState } from 'react'
import type { EdndCharacter } from '../types/character'
import {
  createPleasureState,
  formatModifierLedger,
  resolveQuickEncounter,
  sexDieLabel,
  type PleasureState,
} from '../mechanics'
import './EncounterCalculator.css'

const STIMULATION_TYPES = [
  'Oral',
  'Manual',
  'Coital',
  'Anal',
  'Psychic / Eromancy',
] as const

const POSITIONS = [
  '',
  'Missionary',
  'Cowgirl',
  'Mating Press',
  'Hound',
  'Tower',
  'Mount',
] as const

type Props = {
  open: boolean
  onClose: () => void
  character: EdndCharacter
  pleasureMax: number
  pleasureRemaining: number
  onApplyPreview?: (remaining: number) => void
}

export function EncounterCalculator({
  open,
  onClose,
  character,
  pleasureMax,
  pleasureRemaining,
  onApplyPreview,
}: Props) {
  const titleId = useId()
  const [state, setState] = useState<PleasureState>(() =>
    createPleasureState(character, pleasureRemaining),
  )
  const [dieResult, setDieResult] = useState(4)
  const [sourceCount, setSourceCount] = useState(1)
  const [stimulationType, setStimulationType] = useState<string>(STIMULATION_TYPES[0])
  const [positionId, setPositionId] = useState('')
  const [recipientAroused, setRecipientAroused] = useState(false)
  const [extraBonus, setExtraBonus] = useState(0)

  useEffect(() => {
    if (open) {
      setState(createPleasureState(character, pleasureRemaining))
    }
  }, [open, pleasureRemaining, character])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const preview = useMemo(() => {
    return resolveQuickEncounter({
      actor: character,
      recipient: character,
      state,
      dieResult: dieResult + extraBonus,
      sourceCount,
      stimulationType,
      positionId: positionId || undefined,
      recipientIsAroused: recipientAroused,
    })
  }, [
    character,
    state,
    dieResult,
    extraBonus,
    sourceCount,
    stimulationType,
    positionId,
    recipientAroused,
  ])

  if (!open) return null

  const sexualityBonus = character.eroticTraits.sexualityBonus
  const after = preview.recipientState.current
  const ledgerText = formatModifierLedger(preview.ledger)

  return (
    <div className="encounter-overlay" role="presentation" onClick={onClose}>
      <div
        className="encounter-dialog lush-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="encounter-dialog__title">
          Quick encounter tester
        </h3>
        <p className="encounter-dialog__lede muted">
          Simulate stimulation against yourself — pleasure reduces remaining capacity. (
          {sexDieLabel(character)} · sexuality +{sexualityBonus})
        </p>

        <div className="encounter-dialog__readout">
          <span className="encounter-dialog__readout-label">Remaining capacity</span>
          <strong className="encounter-dialog__readout-value">
            {after} / {pleasureMax}
          </strong>
        </div>

        <div className="encounter-dialog__grid">
          <label className="encounter-field">
            <span>Die result</span>
            <input
              type="number"
              min={0}
              max={99}
              value={dieResult}
              onChange={(e) => setDieResult(Number(e.target.value) || 0)}
            />
          </label>
          <label className="encounter-field">
            <span>Sources of pleasure</span>
            <input
              type="number"
              min={0}
              max={99}
              value={sourceCount}
              onChange={(e) => setSourceCount(Number(e.target.value) || 0)}
            />
          </label>
          <label className="encounter-field">
            <span>Extra bonus</span>
            <input
              type="number"
              min={0}
              max={99}
              value={extraBonus}
              onChange={(e) => setExtraBonus(Number(e.target.value) || 0)}
            />
          </label>
          <label className="encounter-field">
            <span>Stimulation type</span>
            <select
              value={stimulationType}
              onChange={(e) => setStimulationType(e.target.value)}
            >
              {STIMULATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="encounter-field">
            <span>Position</span>
            <select value={positionId} onChange={(e) => setPositionId(e.target.value)}>
              {POSITIONS.map((p) => (
                <option key={p || 'none'} value={p}>
                  {p || '— none —'}
                </option>
              ))}
            </select>
          </label>
          <label className="encounter-field encounter-field--check">
            <span>Recipient Aroused</span>
            <input
              type="checkbox"
              checked={recipientAroused}
              onChange={(e) => setRecipientAroused(e.target.checked)}
            />
          </label>
        </div>

        {ledgerText ? (
          <p className="encounter-dialog__modifiers muted">{ledgerText}</p>
        ) : null}

        {preview.notes.length > 0 ? (
          <ul className="encounter-dialog__notes muted">
            {preview.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}

        <p className="encounter-dialog__result">
          This stimulation deals{' '}
          <strong className="encounter-dialog__taken">{preview.pleasureTaken}</strong> pleasure
          {preview.pleasureBeforeResistance !== preview.pleasureTaken ? (
            <span> (before resistance: {preview.pleasureBeforeResistance})</span>
          ) : null}
          .
          {after === 0 ? (
            <span className="encounter-dialog__climax"> No capacity left.</span>
          ) : (
            <span> {after} PP remaining.</span>
          )}
        </p>

        <div className="encounter-dialog__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setState(preview.recipientState)
              onApplyPreview?.(after)
            }}
          >
            Apply to sheet ({after} PP left)
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setState(createPleasureState(character, pleasureMax))}
          >
            Reset to full
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
