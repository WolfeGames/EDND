import { formatRuleKey } from './formatRuleKey'

/** If `text` is bundle-shaped (name + Mechanical + Flavor), split title line from body. */
export function splitHistoryFeatureBody(
  text: string,
): { titleLine: string; body: string } | null {
  const parts = text.split('\n\n')
  if (parts.length < 2 || !parts[1]!.startsWith('Mechanical:')) return null
  const titleLine = parts[0]!.trim()
  const body = parts.slice(1).join('\n\n')
  if (!titleLine) return null
  return { titleLine, body }
}

export function historyFeatureSheetLabel(ruleKey: string, text: string): string {
  const split = splitHistoryFeatureBody(text)
  if (split) return `${formatRuleKey(ruleKey)} — ${split.titleLine}`
  return formatRuleKey(ruleKey)
}

export function historyFeatureSheetBody(text: string): string {
  const split = splitHistoryFeatureBody(text)
  return split ? split.body : text
}
