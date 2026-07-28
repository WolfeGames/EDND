import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../types/character'
import { hydrateCharacterFromBrowserLocation } from './characterBootstrap'
import { DRAFT_STORAGE_KEY, saveDraft } from './characterStorage'

function installMemoryLocalStorage() {
  const store = new Map<string, string>()
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  })
  return store
}

describe('hydrateCharacterFromBrowserLocation', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: { search: '', pathname: '/create', href: 'http://localhost/create', hash: '' },
        history: { replaceState: () => undefined },
      },
      configurable: true,
    })
  })

  it('starts a blank character when navigating to Create', () => {
    const prior = createEmptyCharacter()
    prior.name = 'Old Draft'
    saveDraft(prior)

    const next = hydrateCharacterFromBrowserLocation({ isReload: false })
    expect(next.name).toBe('')
    expect(next.id).not.toBe(prior.id)
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
  })

  it('restores the autosaved draft on browser refresh', () => {
    const prior = createEmptyCharacter()
    prior.name = 'In Progress'
    saveDraft(prior)

    const next = hydrateCharacterFromBrowserLocation({ isReload: true })
    expect(next.name).toBe('In Progress')
    expect(next.id).toBe(prior.id)
  })

  it('starts blank when ?new=1 even on refresh', () => {
    const prior = createEmptyCharacter()
    prior.name = 'Old Draft'
    saveDraft(prior)
    window.location.search = '?new=1'

    const next = hydrateCharacterFromBrowserLocation({ isReload: true })
    expect(next.name).toBe('')
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
  })
})
