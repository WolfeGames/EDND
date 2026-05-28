import { useCallback, useEffect, useMemo, useState } from 'react'
import { bestiary } from '../data/registry'
import {
  defaultStimulationAbilityFor,
  positionById,
  positionNameForEngine,
  SCENE_POSITIONS,
  STIMULATION_TYPES,
} from '../data/sceneBuilderOptions'
import { loadLibrary } from '../lib/characterStorage'
import {
  bestiaryToCombatant,
  createBestiaryPleasureState,
  rollPleasureDice,
} from '../lib/bestiaryCombatant'
import { EQUIPMENT_PLEASURE_BONUSES, EROTICIST_SPELL_EFFECTS } from '../mechanics/classFeatures'
import type { CombatantEncounterState } from '../mechanics/applyClassFeatures'
import {
  calculateMaxPleasureBreakdown,
  createPleasureStateFromCharacter,
  resolveStimulation,
  type OrgasmSaveAbility,
  type StimulationAbility,
  type StimulationResult,
} from '../mechanics/pleasureEngine'
import {
  combinedOverstimulatedLevel,
  isPhallicRefractory,
  type PleasureCombatant,
  type PleasureState,
} from '../mechanics/pleasureTypes'
import './QuickEncounterTester.css'

type CombatantSource = 'party' | 'bestiary'

type CombatantPick = {
  source: CombatantSource
  id: string
}

function defaultEncounterForCharacter(
  carnalClassId: string | undefined,
  speciesId: string | undefined,
): CombatantEncounterState {
  return {
    speciesId,
    xenophilic: carnalClassId === 'lustbound',
    primalVitality: carnalClassId === 'ravager',
    lustActive: false,
    equippedItemIds: [],
    activeSpellIds: [],
  }
}

function statusBadges(state: PleasureState): Array<{ key: string; label: string; tone: string }> {
  const badges: Array<{ key: string; label: string; tone: string }> = []
  if (state.isAroused) badges.push({ key: 'aroused', label: 'Aroused', tone: 'heat' })
  else badges.push({ key: 'calm', label: 'Not aroused', tone: 'cool' })
  if (state.isEdged) badges.push({ key: 'edged', label: 'Edged', tone: 'edge' })
  if (isPhallicRefractory(state)) badges.push({ key: 'refractory', label: 'Refractory', tone: 'cool' })
  const over = combinedOverstimulatedLevel(state)
  if (over > 0) badges.push({ key: 'over', label: `Overstim ${over}`, tone: 'warn' })
  if (state.deniedLevel > 0) badges.push({ key: 'denied', label: `Denied ${state.deniedLevel}`, tone: 'warn' })
  if (state.activeGenitalTrait !== state.genitalTrait) {
    badges.push({ key: 'shift', label: 'Genital shift', tone: 'cool' })
  }
  return badges
}

function ResultsPanel({
  result,
  target,
  targetState,
  maxBreakdown,
}: {
  result: StimulationResult | null
  target: PleasureCombatant | null
  targetState: PleasureState | null
  maxBreakdown: ReturnType<typeof calculateMaxPleasureBreakdown> | null
}) {
  if (!target || !targetState) {
    return (
      <div className="scene-builder__results scene-builder__results--empty">
        <p>Choose a target to see live pleasure state and roll outcomes.</p>
      </div>
    )
  }

  const badges = statusBadges(targetState)
  const climax = result?.climax ?? (result?.orgasmSave?.climaxed ? result.orgasmSave : undefined)

  return (
    <div className="scene-builder__results">
      <header className="scene-builder__results-head">
        <h2>Live results</h2>
        <div className="scene-builder__pp-meter" aria-label="Pleasure points">
          <div
            className="scene-builder__pp-fill"
            style={{
              width: `${(targetState.currentPleasurePoints / Math.max(1, targetState.maxPleasurePoints)) * 100}%`,
            }}
          />
          <span className="scene-builder__pp-label">
            {targetState.currentPleasurePoints} / {targetState.maxPleasurePoints} PP
          </span>
        </div>
      </header>

      <div className="scene-builder__badges">
        {badges.map((b) => (
          <span key={b.key} className={`scene-builder__badge scene-builder__badge--${b.tone}`}>
            {b.label}
          </span>
        ))}
        {climax && (
          <span className="scene-builder__badge scene-builder__badge--climax">Climax</span>
        )}
      </div>

      {maxBreakdown && (
        <p className="scene-builder__meta">
          Max PP: {maxBreakdown.classBase} + {maxBreakdown.modifier} ({maxBreakdown.modifierLabel})
          {maxBreakdown.traitBonus ? ` + ${maxBreakdown.traitBonus}` : ''}
          {maxBreakdown.overstimulatedPenalty
            ? ` − ${maxBreakdown.overstimulatedPenalty}`
            : ''}{' '}
          = {maxBreakdown.total}
        </p>
      )}

      {!result ? (
        <p className="scene-builder__hint">Roll pleasure to resolve stimulation.</p>
      ) : (
        <div className="scene-builder__result-sections">
          <section className="scene-builder__result-block">
            <h3>Pleasure dealt</h3>
            <p className="scene-builder__big-num">{result.pleasureDealt}</p>
            <ul className="scene-builder__breakdown">
              <li>Base roll: {result.basePleasureRoll ?? '—'}</li>
              <li>After modifiers &amp; class features (pre-resistance total)</li>
              <li>
                <strong>Received by target:</strong> {result.pleasureAfterResistance}
                {result.pleasureAfterResistance !== result.pleasureDealt && (
                  <span className="scene-builder__dim"> (resistance / Lust)</span>
                )}
              </li>
            </ul>
            {result.classFeatureEffects && result.classFeatureEffects.length > 0 && (
              <ul className="scene-builder__feature-chips">
                {result.classFeatureEffects.map((f) => (
                  <li key={f.id} title={f.description}>
                    {f.name}
                    {f.amount !== 0 && (
                      <em>
                        {f.amount > 0 ? '+' : ''}
                        {f.amount}
                      </em>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {result.arousalCheck && (
            <section className="scene-builder__result-block">
              <h3>Arousal check</h3>
              <p>
                d20 ({result.arousalCheck.roll}) + {result.arousalCheck.modifier} ={' '}
                <strong>{result.arousalCheck.total}</strong> vs DC {result.arousalCheck.dc}
              </p>
              <p
                className={
                  result.arousalCheck.becameAroused
                    ? 'scene-builder__outcome scene-builder__outcome--fail'
                    : 'scene-builder__outcome scene-builder__outcome--ok'
                }
              >
                {result.arousalCheck.becameAroused
                  ? 'Failed — target becomes Aroused'
                  : 'Success — remains not Aroused (still takes pleasure)'}
              </p>
            </section>
          )}

          {result.orgasmSave && (
            <section className="scene-builder__result-block">
              <h3>Orgasm saving throw</h3>
              <p>
                d20 ({result.orgasmSave.roll}) + {result.orgasmSave.modifier} ={' '}
                <strong>{result.orgasmSave.total}</strong> vs DC {result.orgasmSave.dc}
              </p>
              <p
                className={
                  result.orgasmSave.climaxed
                    ? 'scene-builder__outcome scene-builder__outcome--fail'
                    : 'scene-builder__outcome scene-builder__outcome--ok'
                }
              >
                {result.orgasmSave.climaxed
                  ? 'Failed — Climax!'
                  : 'Success — half PP and Edged'}
              </p>
            </section>
          )}

          {(result.climax?.boon || result.orgasmSave?.boon) && (
            <section className="scene-builder__result-block scene-builder__result-block--boon">
              <h3>Orgasmic boon</h3>
              <p className="scene-builder__boon-name">
                {(result.climax?.boon ?? result.orgasmSave?.boon)!.name}
              </p>
              <p className="scene-builder__boon-desc">
                {(result.climax?.boon ?? result.orgasmSave?.boon)!.description}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export function QuickEncounterTester() {
  const library = useMemo(() => loadLibrary(), [])
  const bestiarySorted = useMemo(
    () => [...bestiary].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )

  const [attackerPick, setAttackerPick] = useState<CombatantPick | null>(null)
  const [targetPick, setTargetPick] = useState<CombatantPick | null>(null)
  const [positionId, setPositionId] = useState('missionary')
  const [stimulationTypeId, setStimulationTypeId] = useState('manual')
  const [stimulationAbility, setStimulationAbility] = useState<StimulationAbility>('charisma')
  const [abilityTouched, setAbilityTouched] = useState(false)
  const [orgasmAbility, setOrgasmAbility] = useState<OrgasmSaveAbility>('constitution')
  const [denyClimax, setDenyClimax] = useState(false)
  const [wisdomProficient, setWisdomProficient] = useState(false)
  const [audiencePresent, setAudiencePresent] = useState(false)
  const [attackerEncounter, setAttackerEncounter] = useState<CombatantEncounterState>({})
  const [targetEncounter, setTargetEncounter] = useState<CombatantEncounterState>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastDiceLabel, setLastDiceLabel] = useState('')

  const [attacker, setAttacker] = useState<PleasureCombatant | null>(null)
  const [target, setTarget] = useState<PleasureCombatant | null>(null)
  const [targetState, setTargetState] = useState<PleasureState | null>(null)
  const [lastResult, setLastResult] = useState<StimulationResult | null>(null)

  const stimulationMeta = STIMULATION_TYPES.find((t) => t.id === stimulationTypeId)
  const positionMeta = positionById(positionId)

  const equipmentOptions = useMemo(
    () => Object.entries(EQUIPMENT_PLEASURE_BONUSES).filter(([, v]) => v.count > 0),
    [],
  )
  const spellOptions = useMemo(() => Object.entries(EROTICIST_SPELL_EFFECTS), [])

  const resolvePick = useCallback(
    (
      pick: CombatantPick,
      role: 'attacker' | 'target',
      encounter: CombatantEncounterState,
    ): { combatant: PleasureCombatant; state?: PleasureState } | null => {
      if (pick.source === 'party') {
        const entry = library.find((e) => e.character.id === pick.id)
        if (!entry) return null
        const c = entry.character
        const enc = { ...defaultEncounterForCharacter(c.carnalClass, c.species), ...encounter }
        const { combatant, state } = createPleasureStateFromCharacter(c, {
          wisdomSaveProficient: role === 'target' ? wisdomProficient : false,
          encounter: enc,
        })
        return { combatant, state }
      }
      const entry = bestiary.find((b) => b.id === pick.id)
      if (!entry) return null
      const combatant = bestiaryToCombatant(entry, { encounter })
      const state = createBestiaryPleasureState(entry, combatant)
      return { combatant, state }
    },
    [library, wisdomProficient],
  )

  const loadAttacker = useCallback(
    (pick: CombatantPick | null) => {
      if (!pick) {
        setAttacker(null)
        return
      }
      const resolved = resolvePick(pick, 'attacker', attackerEncounter)
      if (resolved) setAttacker(resolved.combatant)
    },
    [attackerEncounter, resolvePick],
  )

  const loadTarget = useCallback(
    (pick: CombatantPick | null) => {
      if (!pick) {
        setTarget(null)
        setTargetState(null)
        setLastResult(null)
        return
      }
      const resolved = resolvePick(pick, 'target', targetEncounter)
      if (resolved?.state) {
        setTarget(resolved.combatant)
        setTargetState(resolved.state)
        setLastResult(null)
      }
    },
    [resolvePick, targetEncounter],
  )

  useEffect(() => {
    if (!abilityTouched && attacker) {
      setStimulationAbility(defaultStimulationAbilityFor(stimulationTypeId, attacker))
    }
  }, [attacker, stimulationTypeId, abilityTouched])

  useEffect(() => {
    if (stimulationMeta?.isPerformance) setAudiencePresent(true)
  }, [stimulationTypeId, stimulationMeta?.isPerformance])

  const patchAttackerEncounter = useCallback((patch: Partial<CombatantEncounterState>) => {
    setAttackerEncounter((prev) => {
      const next = { ...prev, ...patch }
      setAttacker((a) => (a ? { ...a, encounter: { ...a.encounter, ...next } } : a))
      return next
    })
  }, [])

  const patchTargetEncounter = useCallback((patch: Partial<CombatantEncounterState>) => {
    setTargetEncounter((prev) => {
      const next = { ...prev, ...patch }
      setTarget((t) => (t ? { ...t, encounter: { ...t.encounter, ...next } } : t))
      return next
    })
  }, [])

  const rollPleasure = useCallback(() => {
    if (!attacker || !target || !targetState) return

    const { total, notation } = rollPleasureDice(attacker)
    setLastDiceLabel(notation)

    const isPerformance =
      stimulationMeta?.isPerformance ?? stimulationTypeId === 'performance'

    const result = resolveStimulation(attacker, target, targetState, {
      pleasureRoll: total,
      position: positionNameForEngine(positionId),
      stimulationType: stimulationMeta?.label ?? stimulationTypeId,
      orgasmSaveAbility: orgasmAbility,
      denyClimax,
      stimulationAbility,
      audiencePresent,
      isPerformance,
    })
    setTargetState(result.state)
    setLastResult(result)
  }, [
    attacker,
    audiencePresent,
    denyClimax,
    orgasmAbility,
    positionId,
    stimulationMeta,
    stimulationTypeId,
    stimulationAbility,
    target,
    targetState,
  ])

  const maxBreakdown = target
    ? calculateMaxPleasureBreakdown(target, targetState ?? undefined)
    : null

  const showRavager =
    attacker?.carnalClassId === 'ravager' || target?.carnalClassId === 'ravager'
  const showSiren = attacker?.carnalClassId === 'siren'
  const showLustbound = attacker?.carnalClassId === 'lustbound'

  const canRoll = Boolean(attacker && target && targetState)

  return (
    <div className="page scene-builder">
      <header className="scene-builder__hero">
        <h1 className="scene-builder__title">Scene builder</h1>
        <p className="scene-builder__lede">
          Pair party members or bestiary creatures, set the scene, and roll pleasure through the
          live engine.
        </p>
      </header>

      <div className="scene-builder__layout">
        <div className="scene-builder__controls">
          <section className="scene-builder__panel">
            <h2>Combatants</h2>
            <div className="scene-builder__grid">
              <label className="scene-builder__field">
                <span>Attacker</span>
                <select
                  value={
                    attackerPick ? `${attackerPick.source}:${attackerPick.id}` : ''
                  }
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) {
                      setAttackerPick(null)
                      loadAttacker(null)
                      return
                    }
                    const [source, id] = v.split(':') as [CombatantSource, string]
                    const pick = { source, id }
                    setAttackerPick(pick)
                    if (source === 'party') {
                      const c = library.find((x) => x.character.id === id)?.character
                      if (c) setAttackerEncounter(defaultEncounterForCharacter(c.carnalClass, c.species))
                    } else setAttackerEncounter({})
                    loadAttacker(pick)
                    setAbilityTouched(false)
                  }}
                >
                  <option value="">Choose attacker…</option>
                  {library.length > 0 && (
                    <optgroup label="Party (saved characters)">
                      {library.map((e) => (
                        <option key={e.character.id} value={`party:${e.character.id}`}>
                          {e.character.name || 'Unnamed'}
                          {e.character.carnalClass ? ` · ${e.character.carnalClass}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Bestiary">
                    {bestiarySorted.map((b) => (
                      <option key={b.id} value={`bestiary:${b.id}`}>
                        {b.name} (SR {b.sr})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>

              <label className="scene-builder__field">
                <span>Target</span>
                <select
                  value={targetPick ? `${targetPick.source}:${targetPick.id}` : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) {
                      setTargetPick(null)
                      loadTarget(null)
                      return
                    }
                    const [source, id] = v.split(':') as [CombatantSource, string]
                    const pick = { source, id }
                    setTargetPick(pick)
                    if (source === 'party') {
                      const c = library.find((x) => x.character.id === id)?.character
                      if (c) setTargetEncounter(defaultEncounterForCharacter(c.carnalClass, c.species))
                    } else setTargetEncounter({})
                    loadTarget(pick)
                  }}
                >
                  <option value="">Choose target…</option>
                  {library.length > 0 && (
                    <optgroup label="Party (saved characters)">
                      {library.map((e) => (
                        <option key={e.character.id} value={`party:${e.character.id}`}>
                          {e.character.name || 'Unnamed'}
                          {e.character.carnalClass ? ` · ${e.character.carnalClass}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Bestiary">
                    {bestiarySorted.map((b) => (
                      <option key={b.id} value={`bestiary:${b.id}`}>
                        {b.name} (SR {b.sr})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
            </div>

            <label className="scene-builder__check">
              <input
                type="checkbox"
                checked={wisdomProficient}
                onChange={(e) => {
                  setWisdomProficient(e.target.checked)
                  if (targetPick) loadTarget(targetPick)
                }}
              />
              Target proficient in Wisdom saves (+ Sexuality on arousal)
            </label>
          </section>

          <section className="scene-builder__panel">
            <h2>Scene</h2>
            <div className="scene-builder__grid">
              <label className="scene-builder__field" title={positionMeta?.flavor}>
                <span>
                  Position
                  {positionMeta && (
                    <span className="scene-builder__tier">{positionMeta.tier}</span>
                  )}
                </span>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                >
                  {(['Basic', 'Advanced', 'Exotic'] as const).map((tier) => (
                    <optgroup key={tier} label={tier}>
                      {SCENE_POSITIONS.filter((p) => p.tier === tier).map((p) => (
                        <option key={p.id} value={p.id} title={p.flavor}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {positionMeta && (
                  <p className="scene-builder__flavor">{positionMeta.flavor}</p>
                )}
              </label>

              <label className="scene-builder__field" title={stimulationMeta?.flavor}>
                <span>Stimulation type</span>
                <select
                  value={stimulationTypeId}
                  onChange={(e) => {
                    setStimulationTypeId(e.target.value)
                    setAbilityTouched(false)
                  }}
                >
                  {STIMULATION_TYPES.map((t) => (
                    <option key={t.id} value={t.id} title={t.flavor}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {stimulationMeta && (
                  <p className="scene-builder__flavor">{stimulationMeta.flavor}</p>
                )}
              </label>

              <label className="scene-builder__field">
                <span>Stimulation ability</span>
                <select
                  value={stimulationAbility}
                  onChange={(e) => {
                    setAbilityTouched(true)
                    setStimulationAbility(e.target.value as StimulationAbility)
                  }}
                >
                  <option value="strength">Strength</option>
                  <option value="dexterity">Dexterity</option>
                  <option value="constitution">Constitution</option>
                  <option value="charisma">Charisma</option>
                  <option value="intelligence">Intelligence</option>
                  <option value="wisdom">Wisdom</option>
                </select>
                {!abilityTouched && attacker && (
                  <p className="scene-builder__flavor scene-builder__flavor--auto">
                    Auto: {stimulationAbility} for this type
                    {attacker.carnalClassId ? ` (${attacker.carnalClassId})` : ''}
                  </p>
                )}
              </label>
            </div>

            <button
              type="button"
              className="scene-builder__roll-btn"
              disabled={!canRoll}
              onClick={rollPleasure}
            >
              Roll pleasure
              {lastDiceLabel ? ` (${lastDiceLabel})` : ''}
            </button>
            {!canRoll && (
              <p className="scene-builder__hint">Select attacker and target to enable rolling.</p>
            )}
          </section>

          <section className="scene-builder__panel scene-builder__panel--compact">
            <button
              type="button"
              className="scene-builder__advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced &amp; class options
            </button>
            {showAdvanced && (
              <div className="scene-builder__advanced">
                <label className="scene-builder__field">
                  <span>Orgasm save (when triggered)</span>
                  <select
                    value={orgasmAbility}
                    onChange={(e) => setOrgasmAbility(e.target.value as OrgasmSaveAbility)}
                  >
                    <option value="constitution">Constitution</option>
                    <option value="sexuality">Sexuality</option>
                  </select>
                </label>
                <label className="scene-builder__check">
                  <input
                    type="checkbox"
                    checked={denyClimax}
                    onChange={(e) => setDenyClimax(e.target.checked)}
                  />
                  Deny climax at 0 PP
                </label>
                {showSiren && (
                  <>
                    <label className="scene-builder__check">
                      <input
                        type="checkbox"
                        checked={audiencePresent}
                        onChange={(e) => setAudiencePresent(e.target.checked)}
                      />
                      Audience present
                    </label>
                  </>
                )}
                {showRavager && (
                  <div className="scene-builder__check-row">
                    <label className="scene-builder__check">
                      <input
                        type="checkbox"
                        checked={attackerEncounter.lustActive ?? false}
                        onChange={(e) => patchAttackerEncounter({ lustActive: e.target.checked })}
                      />
                      Attacker Lust
                    </label>
                    <label className="scene-builder__check">
                      <input
                        type="checkbox"
                        checked={targetEncounter.lustActive ?? false}
                        onChange={(e) => patchTargetEncounter({ lustActive: e.target.checked })}
                      />
                      Target Lust
                    </label>
                    <label className="scene-builder__check">
                      <input
                        type="checkbox"
                        checked={attackerEncounter.primalVitality ?? false}
                        onChange={(e) =>
                          patchAttackerEncounter({ primalVitality: e.target.checked })
                        }
                      />
                      Primal Vitality
                    </label>
                  </div>
                )}
                {showLustbound && (
                  <label className="scene-builder__field">
                    <span>Pact</span>
                    <select
                      value={attackerEncounter.lustboundPactId ?? ''}
                      onChange={(e) =>
                        patchAttackerEncounter({
                          lustboundPactId: e.target
                            .value as CombatantEncounterState['lustboundPactId'],
                        })
                      }
                    >
                      <option value="">—</option>
                      <option value="nymph">Nymph</option>
                      <option value="succubus">Succubus</option>
                      <option value="velvetShade">Velvet Shade</option>
                      <option value="alienOrgan">Alien Organ</option>
                    </select>
                  </label>
                )}
                <fieldset className="scene-builder__fieldset">
                  <legend>Attacker gear &amp; spells</legend>
                  <div className="scene-builder__chips">
                    {equipmentOptions.map(([id, row]) => (
                      <label key={id} className="scene-builder__chip">
                        <input
                          type="checkbox"
                          checked={attackerEncounter.equippedItemIds?.includes(id) ?? false}
                          onChange={(e) => {
                            const set = new Set(attackerEncounter.equippedItemIds ?? [])
                            if (e.target.checked) set.add(id)
                            else set.delete(id)
                            patchAttackerEncounter({ equippedItemIds: [...set] })
                          }}
                        />
                        {row.name}
                      </label>
                    ))}
                  </div>
                  <div className="scene-builder__chips">
                    {spellOptions.map(([id, row]) => (
                      <label key={id} className="scene-builder__chip">
                        <input
                          type="checkbox"
                          checked={attackerEncounter.activeSpellIds?.includes(id) ?? false}
                          onChange={(e) => {
                            const set = new Set(attackerEncounter.activeSpellIds ?? [])
                            if (e.target.checked) set.add(id)
                            else set.delete(id)
                            patchAttackerEncounter({ activeSpellIds: [...set] })
                          }}
                        />
                        {row.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {targetPick && (
                  <button
                    type="button"
                    className="scene-builder__secondary-btn"
                    onClick={() => loadTarget(targetPick)}
                  >
                    Reset target PP
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="scene-builder__aside">
          <ResultsPanel
            result={lastResult}
            target={target}
            targetState={targetState}
            maxBreakdown={maxBreakdown}
          />
        </aside>
      </div>
    </div>
  )
}
