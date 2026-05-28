import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bestiary } from '../../data/registry'
import { BESTIARY_TIERS, getBestiaryTier } from '../../lib/bestiaryTier'
import './BestiaryPages.css'

type SortKey = 'name' | 'sr' | 'creatureType' | 'tier'

export function BestiaryIndexPage() {
  const [search, setSearch] = useState('')
  const [creatureType, setCreatureType] = useState('all')
  const [carnalType, setCarnalType] = useState('all')
  const [tier, setTier] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')

  const creatureTypes = useMemo(
    () => Array.from(new Set(bestiary.map((b) => b.creatureType))).sort(),
    [],
  )
  const carnalTypes = useMemo(
    () => Array.from(new Set(bestiary.map((b) => b.carnalType))).sort(),
    [],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const list = bestiary.filter((e) => {
      if (creatureType !== 'all' && e.creatureType !== creatureType) return false
      if (carnalType !== 'all' && e.carnalType !== carnalType) return false
      if (tier !== 'all' && getBestiaryTier(e.sr).id !== tier) return false
      if (!needle) return true
      const tierMeta = getBestiaryTier(e.sr)
      const hay = [
        e.name,
        e.creatureType,
        e.carnalType,
        tierMeta.label,
        tierMeta.srRangeLabel,
        e.description,
        ...(e.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
    list.sort((a, b) => {
      if (sortKey === 'sr') return a.sr - b.sr || a.name.localeCompare(b.name)
      if (sortKey === 'tier') {
        const tierA = BESTIARY_TIERS.findIndex((t) => t.id === getBestiaryTier(a.sr).id)
        const tierB = BESTIARY_TIERS.findIndex((t) => t.id === getBestiaryTier(b.sr).id)
        return tierA - tierB || a.sr - b.sr || a.name.localeCompare(b.name)
      }
      if (sortKey === 'creatureType') {
        const t = a.creatureType.localeCompare(b.creatureType)
        return t !== 0 ? t : a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })
    return list
  }, [carnalType, creatureType, search, sortKey, tier])

  const grouped = useMemo(
    () =>
      BESTIARY_TIERS.map((tierMeta) => ({
        tier: tierMeta,
        entries: filtered.filter((entry) => getBestiaryTier(entry.sr).id === tierMeta.id),
      })).filter((group) => group.entries.length > 0),
    [filtered],
  )

  return (
    <div className="page bestiary-root">
      <h1 className="page-title">Bestiary</h1>
      <p className="lede bestiary-lede">
        Catalog of creatures with carnal context — stat block, sexual traits, social norms, and
        encounter hooks for your table. Sexual Rating (SR) parallels CR for tuning scene intensity,
        and each creature is grouped by SR tier.
      </p>

      <div className="bestiary-toolbar" role="search">
        <label htmlFor="bestiary-search">
          Search
          <input
            id="bestiary-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, type, tag…"
          />
        </label>
        <label htmlFor="bestiary-creature-type">
          Creature
          <select
            id="bestiary-creature-type"
            value={creatureType}
            onChange={(e) => setCreatureType(e.target.value)}
          >
            <option value="all">All</option>
            {creatureTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bestiary-carnal-type">
          Carnal
          <select
            id="bestiary-carnal-type"
            value={carnalType}
            onChange={(e) => setCarnalType(e.target.value)}
          >
            <option value="all">All</option>
            {carnalTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bestiary-tier">
          Tier
          <select
            id="bestiary-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            <option value="all">All</option>
            {BESTIARY_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.srRangeLabel})
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bestiary-sort">
          Sort
          <select
            id="bestiary-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="name">Name</option>
            <option value="sr">SR (low → high)</option>
            <option value="tier">Tier</option>
            <option value="creatureType">Creature type</option>
          </select>
        </label>
        <span className="bestiary-toolbar__count" aria-live="polite">
          {filtered.length} of {bestiary.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="bestiary-empty">No creatures match the current filters.</p>
      ) : (
        <div className="bestiary-tier-list">
          {grouped.map((group) => (
            <section key={group.tier.id} className="bestiary-tier-section">
              <header className="bestiary-tier-section__header">
                <div>
                  <h2>{group.tier.label}</h2>
                  <p>{group.tier.description}</p>
                </div>
                <span className="bestiary-tier-section__range">{group.tier.srRangeLabel}</span>
              </header>
              <ul className="bestiary-grid">
                {group.entries.map((entry) => {
                  const tierMeta = getBestiaryTier(entry.sr)
                  return (
                    <li key={entry.id}>
                      <Link to={`/bestiary/${entry.id}`} className="bestiary-card">
                        <div className="bestiary-card__top">
                          <span className="bestiary-card__name">{entry.name}</span>
                          <span className="bestiary-card__sr">SR {entry.sr}</span>
                        </div>
                        <div className="bestiary-card__meta">
                          <span>{tierMeta.label}</span>
                          <span>{entry.size}</span>
                          <span>{entry.creatureType}</span>
                          <span>{entry.carnalType}</span>
                        </div>
                        <p className="bestiary-card__blurb">{entry.description}</p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
