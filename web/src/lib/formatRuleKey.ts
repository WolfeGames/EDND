/** Turn `level1`, `level6` into readable headings for sheet display. */
export function formatRuleKey(key: string): string {
  const m = key.match(/^level(\d+)$/i)
  if (m) return `Level ${m[1]}`
  return key
}
