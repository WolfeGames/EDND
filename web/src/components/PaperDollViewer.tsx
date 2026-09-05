import { useMemo, useState, type CSSProperties } from 'react'
import {
  hasDollBaseLayer,
  resolveDollLayers,
  type ResolvedDollLayer,
} from '../lib/dollLayers'
import { buildPaperDollModel, type PaperDollModel } from '../lib/paperDoll'
import type { EdndCharacter } from '../types/character'
import './PaperDollViewer.css'

type PaperDollViewerProps = {
  character: Pick<
    EdndCharacter,
    | 'species'
    | 'creatureSize'
    | 'bodyType'
    | 'genderIdentity'
    | 'genitalTrait'
    | 'endowment'
    | 'physiqueMorph'
  >
  className?: string
}

function DollLayerImage({ layer }: { layer: ResolvedDollLayer }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  const needsScale = layer.scaleX !== 1 || layer.scaleY !== 1
  const style: CSSProperties = {
    zIndex: layer.zIndex,
    opacity: layer.opacity,
    filter: layer.tintFilter ?? undefined,
    transformOrigin: `${layer.originX * 100}% ${layer.originY * 100}%`,
    transform: needsScale ? `scale(${layer.scaleX}, ${layer.scaleY})` : undefined,
  }

  return (
    <img
      className="paper-doll__layer"
      src={layer.src}
      alt=""
      draggable={false}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}

/** One blended base body with approximate hip/leg/bust morphs on painted art. */
function MorphBaseBody({
  layer,
  model,
}: {
  layer: ResolvedDollLayer
  model: PaperDollModel
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  const t = model.transforms
  const lowerScaleX = (t.hipScaleX + t.legScaleX) / 2
  const lowerScaleY = t.legScaleY
  const enlargeLower = lowerScaleX > 1.01 || lowerScaleY > 1.01
  // Mild whole-figure narrowing when hips/legs are below midpoint (approx).
  const figureScaleX = lowerScaleX < 0.99 ? 0.7 + lowerScaleX * 0.3 : 1

  return (
    <div
      className="paper-doll__base-variant"
      style={{
        opacity: layer.opacity,
        transform: figureScaleX !== 1 ? `scaleX(${figureScaleX})` : undefined,
        transformOrigin: '50% 55%',
      }}
    >
      <img
        className="paper-doll__layer paper-doll__layer--base-full"
        src={layer.src}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />

      {enlargeLower && (
        <img
          className="paper-doll__layer paper-doll__layer--base-lower"
          src={layer.src}
          alt=""
          draggable={false}
          style={{
            transform: `scale(${lowerScaleX}, ${lowerScaleY})`,
            transformOrigin: '50% 58%',
          }}
        />
      )}

      {t.upperScale < 0.995 && model.hasBreasts && (
        <img
          className="paper-doll__layer paper-doll__layer--base-upper"
          src={layer.src}
          alt=""
          draggable={false}
          style={{
            transform: `scale(${t.upperScale})`,
            transformOrigin: '50% 30%',
          }}
        />
      )}

      {model.hasBreasts && t.showBustOverlay && (
        <img
          className="paper-doll__layer paper-doll__layer--bust"
          src={layer.src}
          alt=""
          draggable={false}
          style={{
            transform: `scale(${t.bustScale})`,
            transformOrigin: '50% 31%',
          }}
        />
      )}
    </div>
  )
}

function DollStack({
  layers,
  model,
}: {
  layers: ResolvedDollLayer[]
  model: PaperDollModel
}) {
  const bases = layers.filter((l) => l.slot === 'base')
  const rest = layers.filter((l) => l.slot !== 'base')
  const s = model.bodyScale

  return (
    <div
      className="paper-doll__stack"
      style={{ transform: s !== 1 ? `scale(${s})` : undefined }}
    >
      <div className="paper-doll__base-stack">
        {bases.map((layer) => (
          <MorphBaseBody key={layer.id} layer={layer} model={model} />
        ))}
      </div>
      {rest.map((layer) => (
        <DollLayerImage key={layer.id} layer={layer} />
      ))}
    </div>
  )
}

export function PaperDollViewer({ character, className }: PaperDollViewerProps) {
  const model = useMemo(() => buildPaperDollModel(character), [character])
  const layers = useMemo(() => resolveDollLayers(model), [model])
  const ready = Boolean(character.species?.trim()) && hasDollBaseLayer(layers)

  return (
    <div className={['paper-doll', className].filter(Boolean).join(' ')}>
      <div className="paper-doll__frame">
        {ready ? (
          <DollStack layers={layers} model={model} />
        ) : (
          <div className="paper-doll__empty muted">
            {character.species?.trim()
              ? 'Doll art pack missing base body.'
              : 'Choose a species to preview the doll.'}
          </div>
        )}
      </div>
      {ready && (
        <p className="paper-doll__caption muted">
          {model.palette.label}
          {model.bodyType ? ` · ${model.bodyType}` : ''}
          {` · ${model.creatureSize}`}
          {` · muscle ${Math.round(model.morph.muscle * 100)}%`}
          {` · soft ${Math.round(model.morph.fat * 100)}%`}
          {model.hasBreasts ? ` · bust ${Math.round(model.morph.breastScale * 100)}%` : ''}
        </p>
      )}
    </div>
  )
}
