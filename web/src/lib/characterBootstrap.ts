import { createEmptyCharacter, type EdndCharacter } from '../types/character'
import { applyDerivedCharacterRules } from './applyCharacterRules'
import { normalizedEndowment } from './endowment'
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

  const mergedTraits = mergeTableProficiencies(
    raw.species,
    raw.sexualHistory ?? '',
    raw.carnalClass,
    raw.eroticTraits,
  )
  return applyDerivedCharacterRules({
    ...raw,
    endowment: normalizedEndowment(raw.genderIdentity, raw.endowment),
    eroticTraits: mergedTraits,
  })
}
