/** Flat bonus to pleasure dealt (per roll or flat). */
export function parsePleasureDealtBonus(text: string): number {
  let sum = 0
  const patterns = [
    /deal\s+(\d+)\s+additional\s+pleasure/gi,
    /\+\s*(\d+)d(\d+)\s+(?:psychic\s+)?pleasure/gi,
    /\+\s*(\d+)\s+pleasure\s+per\s+(?:die|source)/gi,
    /bonus\s+to\s+pleasure\s+dealt\s+equal\s+to\s+(\d+)/gi,
    /\+\s*(\d+)\s+pleasure\s+when\s+you\s+stimulate/gi,
    /\+\s*(\d+)\s+pleasure\s+if\s+your\s+table/gi,
  ]
  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      if (re.source.includes('d(')) {
        sum += Number(m[1]) * 2
      } else {
        sum += Number(m[1])
      }
    }
  }
  return sum
}

/** Additional pleasure taken per source or flat. */
export function parsePleasureTakenPerSource(text: string): number {
  let sum = 0
  const patterns = [
    /receive\s+(\d+)\s+additional\s+pleasure\s+point\s+per\s+source/gi,
    /(\d+)\s+additional\s+pleasure\s+point\s+per\s+source/gi,
    /\+\s*(\d+)\s+pleasure\s+per\s+source/gi,
    /\+\s*(\d+)\s+pleasure\s+point\s+whenever\s+you\s+would\s+take\s+pleasure/gi,
    /gain\s+\+(\d+)\s+pleasure\s+point\s+whenever/gi,
  ]
  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      sum += Number(m[1])
    }
  }
  return sum
}

/** Flat reduction to pleasure taken (minimum 1 still applies at apply time). */
export function parsePleasureTakenReduction(text: string): number {
  let sum = 0
  const patterns = [
    /reduce\s+pleasure\s+(?:taken|received)\s+by\s+(\d+)/gi,
    /reduce\s+incoming\s+pleasure\s+by\s+(\d+)/gi,
    /reduce\s+pleasure\s+received\s+by\s+(\d+)/gi,
  ]
  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      sum += Number(m[1])
    }
  }
  return sum
}

export function textMentionsResistance(text: string): boolean {
  return /resistance\s+to\s+pleasure/i.test(text) || /immune\s+to\s+pleasure/i.test(text)
}

export function textMentionsNonArousedResistance(text: string): boolean {
  return /not\s+Aroused[\s\S]{0,80}resistance\s+to\s+pleasure/i.test(text)
}
