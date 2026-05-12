import { useMemo, useRef, useState, type ChangeEventHandler } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parseCharacterJson } from '../lib/characterImport'
import {
  deleteFromLibrary,
  downloadCharacterJson,
  loadLibrary,
  upsertLibrary,
} from '../lib/characterStorage'
import './SavedCharactersPage.css'

export function SavedCharactersPage() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const importRef = useRef<HTMLInputElement>(null)

  const entries = useMemo(
    () => loadLibrary().sort((a, b) => b.updatedAt - a.updatedAt),
    [version],
  )

  const refresh = () => setVersion((v) => v + 1)

  const handleImport: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const c = parseCharacterJson(JSON.parse(text) as unknown)
      upsertLibrary(c)
      refresh()
    } catch {
      window.alert('Could not import that file. Check that it is ED&D character JSON.')
    }
  }

  return (
    <div className="page saved-characters">
      <h1 className="page-title">Saved characters</h1>
      <p className="lede">
        Characters you <strong>Save to this device</strong> from the creator or random generator
        are listed here. Data stays in this browser unless you export a JSON file.
      </p>

      <div className="saved-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => navigate('/create')}>
          New character
        </button>
        <button type="button" className="btn" onClick={() => importRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="saved-file-input-hidden"
          aria-hidden
          onChange={handleImport}
        />
        <Link to="/create" className="btn">
          Open creator
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="muted">No saved characters yet.</p>
      ) : (
        <ul className="saved-list">
          {entries.map(({ updatedAt, character }) => (
            <li key={character.id} className="saved-card">
              <div className="saved-card-head">
                <strong>{character.name.trim() || 'Unnamed'}</strong>
                <span className="muted">
                  Level {character.level} · {character.adventuringClass || '—'} ·{' '}
                  {new Date(updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="saved-card-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/create?id=${encodeURIComponent(character.id)}`)}
                >
                  Open in editor
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    navigate(`/sheet?id=${encodeURIComponent(character.id)}`)
                  }
                >
                  Printable sheet
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => downloadCharacterJson(character)}
                >
                  Download JSON
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (window.confirm(`Remove "${character.name.trim() || 'Unnamed'}" from this device?`)) {
                      deleteFromLibrary(character.id)
                      refresh()
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
