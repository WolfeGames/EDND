import { createEmptyCharacter, type EdndCharacter } from '../types/character'
import { applyDerivedCharacterRules } from './applyCharacterRules'
import { normalizeCharacterBiology } from './biologicalSex'
import { mergeTableProficiencies } from './mergeEroticProficiencies'
import { clearDraft, getFromLibrary, loadDraft } from './characterStorage'

/** True when this document load was a browser refresh (not in-app navigation). */
export function isBrowserReload(): boolean {
  if (typeof performance === 'undefined') return false
  const entries = performance.getEntriesByType('navigation')
  const nav = entries[0] as PerformanceNavigationTiming | undefined
  if (nav) return nav.type === 'reload'
  const legacy = (
    performance as unknown as { navigation?: { type?: number } }
  ).navigation
  return legacy?.type === 1
}

/**
 * Load the character sheet for the editor from the URL and local draft/saves.
 * Call only inside `useState(() => …)` or after a keyed remount so `window.location.search` is correct.
 *
 * - `?id=` loads a saved library character
 * - `?new=1` always starts blank
 * - Bare `/create` starts blank on navigation; restores the autosaved draft only on refresh
 */
export function hydrateCharacterFromBrowserLocation(
  options: { isReload?: boolean } = {},
): EdndCharacter {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const params = new URLSearchParams(search)
  const reload = options.isReload ?? isBrowserReload()

  let raw: EdndCharacter
  if (params.get('new') === '1') {
    clearDraft()
    raw = createEmptyCharacter()
  } else {
    const loadId = params.get('id')
    if (loadId) {
      const fromLib = getFromLibrary(loadId)
      raw = fromLib ? { ...fromLib } : createEmptyCharacter()
    } else if (reload) {
      const draft = loadDraft()
      raw = draft ? { ...draft } : createEmptyCharacter()
    } else {
      clearDraft()
      raw = createEmptyCharacter()
    }
  }

  const normalized = normalizeCharacterBiology(raw)
  const mergedTraits = mergeTableProficiencies(
    normalized.species,
    normalized.sexualHistory ?? '',
    normalized.carnalClass,
    normalized.eroticTraits,
  )
  return applyDerivedCharacterRules({
    ...normalized,
    eroticTraits: mergedTraits,
  })
}
