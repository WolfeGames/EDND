import type { EdndCharacter } from '../types/character'
import { parseCharacterJson } from './characterImport'

/** Autosave draft while editing on /create */
export const DRAFT_STORAGE_KEY = 'ednd.characterDraft.v1'

/** Named saves on this browser */
export const LIBRARY_STORAGE_KEY = 'ednd.characterLibrary.v1'

const MAX_LIBRARY_ENTRIES = 40

export type LibraryEntry = {
  updatedAt: number
  character: EdndCharacter
}

function safeParse<T>(raw: string | null): T | null {
  if (raw == null || raw === '') return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadDraft(): EdndCharacter | null {
  try {
    const parsed = safeParse<EdndCharacter>(localStorage.getItem(DRAFT_STORAGE_KEY))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveDraft(character: EdndCharacter): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(character))
  } catch {
    /* quota or private mode */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function loadLibrary(): LibraryEntry[] {
  try {
    const parsed = safeParse<LibraryEntry[]>(localStorage.getItem(LIBRARY_STORAGE_KEY))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e) =>
        e &&
        typeof e === 'object' &&
        typeof e.updatedAt === 'number' &&
        e.character &&
        typeof e.character === 'object' &&
        typeof e.character.id === 'string',
    )
  } catch {
    return []
  }
}

function writeLibrary(entries: LibraryEntry[]): void {
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* ignore */
  }
}

export function upsertLibrary(character: EdndCharacter): void {
  const now = Date.now()
  const prev = loadLibrary().filter((e) => e.character.id !== character.id)
  const out: LibraryEntry[] = [{ updatedAt: now, character }, ...prev].slice(
    0,
    MAX_LIBRARY_ENTRIES,
  )
  writeLibrary(out)
}

export function deleteFromLibrary(characterId: string): void {
  const prev = loadLibrary()
  writeLibrary(prev.filter((e) => e.character.id !== characterId))
}

export function getFromLibrary(characterId: string): EdndCharacter | undefined {
  return loadLibrary().find((e) => e.character.id === characterId)?.character
}

function sanitizeFileBase(name: string): string {
  const t = name.trim().replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80)
  return t || 'character'
}

export function downloadCharacterJson(character: EdndCharacter): void {
  const blob = new Blob([JSON.stringify(character, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileBase(character.name)}-${character.id.slice(0, 8)}.json`
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}

/** Ephemeral payload for the printable sheet (sessionStorage). */
export const SHEET_STASH_KEY = 'ednd.sheetCharacter.v1'

export function stashCharacterForSheet(character: EdndCharacter): void {
  try {
    sessionStorage.setItem(SHEET_STASH_KEY, JSON.stringify(character))
  } catch {
    /* private mode */
  }
}

export function peekCharacterFromSheetStash(): EdndCharacter | null {
  try {
    const raw = sessionStorage.getItem(SHEET_STASH_KEY)
    if (!raw) return null
    return parseCharacterJson(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}
