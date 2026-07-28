import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react'
import type { DiceSides, SpectacleDie } from '../lib/dice'
import { labelForSides } from '../lib/dice'
import './DiceRollOverlay.css'

export type DiceRollOverlayProps = {
  dice: SpectacleDie[]
  title?: string
  subtitle?: string
  /** Total open time before auto-dismiss (includes tumble + settle hold). */
  durationMs?: number
  onComplete: () => void
}

function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function diePath(sides: DiceSides): string {
  switch (sides) {
    case 4:
      return 'M50 6 L94 88 L6 88 Z'
    case 6:
      return 'M14 14 H86 V86 H14 Z'
    case 8:
      return 'M50 4 L96 50 L50 96 L4 50 Z'
    case 10:
      return 'M50 4 L92 38 L72 96 L28 96 L8 38 Z'
    case 12:
      return 'M50 4 L88 22 L96 58 L72 94 L28 94 L4 58 L12 22 Z'
    case 20:
      return 'M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z'
    case 100:
      return 'M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z'
  }
}

/** Pack settled dice into a centered grid that stays readable. */
function settlePosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.min(8, Math.max(1, Math.ceil(Math.sqrt(total * 1.4))))
  const rows = Math.max(1, Math.ceil(total / cols))
  const col = index % cols
  const row = Math.floor(index / cols)
  const cellW = Math.min(11, 72 / cols)
  const cellH = Math.min(14, 48 / rows)
  const gridW = (cols - 1) * cellW
  const gridH = (rows - 1) * cellH
  return {
    x: 50 - gridW / 2 + col * cellW,
    y: 28 - gridH / 2 + row * cellH,
  }
}

function DieFace({
  die,
  index,
  total,
}: {
  die: SpectacleDie
  index: number
  total: number
}) {
  const seed = hashSeed(die.id)
  const fromLeft = seed % 2 === 0
  const startY = 6 + (seed % 70)
  const midY = 10 + ((seed >> 3) % 55)
  const land = settlePosition(index, total)
  const jitterX = ((seed >> 5) % 7) - 3
  const jitterY = ((seed >> 8) % 7) - 3
  const spin = 720 + (seed % 540)
  const delay = (index % 12) * 0.12 + ((seed >> 2) % 5) * 0.05
  const duration = 3.4 + ((seed >> 4) % 8) * 0.12
  const scale = die.sides === 6 ? 1 : die.sides >= 20 ? 1.08 : 0.95

  const style = {
    '--die-from-x': fromLeft ? '-22vw' : '122vw',
    '--die-mid-x': fromLeft ? '38vw' : '62vw',
    '--die-land-x': `${land.x + jitterX * 0.15}vw`,
    '--die-y0': `${startY}vh`,
    '--die-y1': `${midY}vh`,
    '--die-land-y': `${land.y + jitterY * 0.2}vh`,
    '--die-spin': `${fromLeft ? spin : -spin}deg`,
    '--die-delay': `${delay}s`,
    '--die-duration': `${duration}s`,
    '--die-scale': String(scale),
  } as CSSProperties

  return (
    <div
      className={[
        'dice-spectacle__die',
        `dice-spectacle__die--d${die.sides}`,
        die.dropped ? 'dice-spectacle__die--dropped' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-hidden
    >
      <svg className="dice-spectacle__shape" viewBox="0 0 100 100" role="img">
        <defs>
          <linearGradient id={`g-${die.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff6e8" />
            <stop offset="45%" stopColor="#e8c98a" />
            <stop offset="100%" stopColor="#8a5a28" />
          </linearGradient>
          <linearGradient id={`rim-${die.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f3d58a" />
            <stop offset="100%" stopColor="#6b3f16" />
          </linearGradient>
        </defs>
        <path
          d={diePath(die.sides)}
          fill={`url(#g-${die.id})`}
          stroke={`url(#rim-${die.id})`}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y={die.sides === 4 ? '62' : '58'}
          textAnchor="middle"
          className="dice-spectacle__pip"
        >
          {die.value}
        </text>
      </svg>
      <span className="dice-spectacle__die-tag">
        {die.group ? `${die.group} · ` : ''}
        {labelForSides(die.sides)}
      </span>
    </div>
  )
}

export function DiceRollOverlay({
  dice,
  title = 'The dice are cast',
  subtitle,
  durationMs = 6500,
  onComplete,
}: DiceRollOverlayProps) {
  const titleId = useId()
  const completed = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const reduceMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    completed.current = false
    const ms = reduceMotion ? 120 : durationMs
    const t = window.setTimeout(() => {
      if (completed.current) return
      completed.current = true
      onCompleteRef.current()
    }, ms)
    return () => window.clearTimeout(t)
  }, [dice, durationMs, reduceMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (completed.current) return
        completed.current = true
        onCompleteRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const summary = useMemo(() => {
    const kept = dice.filter((d) => !d.dropped)
    if (kept.length === 0) return ''
    const total = kept.reduce((s, d) => s + d.value, 0)
    if (kept.length === 1) return `Result: ${kept[0]!.value}`
    return `Total: ${total}`
  }, [dice])

  return (
    <div
      className="dice-spectacle"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => {
        if (completed.current) return
        completed.current = true
        onCompleteRef.current()
      }}
    >
      <div className="dice-spectacle__veil" />
      <div className="dice-spectacle__stage">
        {dice.map((die, i) => (
          <DieFace key={die.id} die={die} index={i} total={dice.length} />
        ))}
      </div>
      <div className="dice-spectacle__banner">
        <h2 id={titleId} className="dice-spectacle__title">
          {title}
        </h2>
        {subtitle && <p className="dice-spectacle__subtitle">{subtitle}</p>}
        <p className="dice-spectacle__summary">{summary}</p>
        <p className="dice-spectacle__hint">Click or press Esc to continue</p>
      </div>
    </div>
  )
}
