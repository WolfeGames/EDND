import { createEmptyCharacter, type EdndCharacter } from '../types/character'
import { applyDerivedCharacterRules } from './applyCharacterRules'
import { normalizeCharacterBiology } from './biologicalSex'
import { mergeTableProficiencies } from './mergeEroticProficiencies'
import { clearDraft, getFromLibrary, loadDraft } from './characterStorage'

/**
 * Load the character sheet for the editor from the URL and local draft/saves.
 * Call only inside `useState(() => …)` or after a keyed remount so `window.location.search` is correct.
 */
export function hydrateCharacterFromBrowserLocation(): EdndCharacter {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const params = new URLSearchParams(search)

  let raw: EdndCharacter
  if (params.get('new') === '1') {
    clearDraft()
    raw = createEmptyCharacter()
  } else {
    const loadId = params.get('id')
    if (loadId) {
      const fromLib = getFromLibrary(loadId)
      raw = fromLib ? { ...fromLib } : createEmptyCharacter()
    } else {
      const draft = loadDraft()
      raw = draft ? { ...draft } : createEmptyCharacter()
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
