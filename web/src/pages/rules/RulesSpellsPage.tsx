import { useMemo } from 'react'
import { carnalClasses } from '../../data/registry'
import { SPELLS_SECTION_INTRO } from '../../data/rulesReference'

type SpellLine = {
  className: string
  domain: string
  spellLevel: string
  spellName: string
}

function collectDomainSpells(): SpellLine[] {
  const out: SpellLine[] = []
  for (const c of carnalClasses) {
    const domains = c.domainSpells
    if (!domains) continue
    for (const [domain, byLevel] of Object.entries(domains)) {
      for (const [spellLevel, spellName] of Object.entries(byLevel)) {
        out.push({
          className: c.name,
          domain,
          spellLevel,
          spellName,
        })
      }
    }
  }
  out.sort((a, b) => {
    const byClass = a.className.localeCompare(b.className)
    if (byClass !== 0) return byClass
    const byDomain = a.domain.localeCompare(b.domain)
    if (byDomain !== 0) return byDomain
    return spellLevelOrder(a.spellLevel) - spellLevelOrder(b.spellLevel)
  })
  return out
}

function spellLevelOrder(levelKey: string): number {
  const m = levelKey.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 999
}

function formatSpellLevelKey(key: string): string {
  const m = key.match(/^level(\d+)$/i)
  if (m) return `Level ${m[1]}`
  return key
}

function groupByClass(lines: SpellLine[]) {
  const map = new Map<string, Map<string, SpellLine[]>>()
  for (const row of lines) {
    let domains = map.get(row.className)
    if (!domains) {
      domains = new Map()
      map.set(row.className, domains)
    }
    let spells = domains.get(row.domain)
    if (!spells) {
      spells = []
      domains.set(row.domain, spells)
    }
    spells.push(row)
  }
  return map
}

export function RulesSpellsPage() {
  const lines = useMemo(() => collectDomainSpells(), [])
  const grouped = useMemo(() => groupByClass(lines), [lines])

  return (
    <div className="rules-spells">
      <article className="rules-block">
        <h2>Eromancy &amp; carnal spells</h2>
        <p className="rules-prose">{SPELLS_SECTION_INTRO}</p>
        {lines.length === 0 ? (
          <p className="rules-empty-spells">
            No domain spell lists are defined in carnal class data yet. When spells are added to the
            JSON tables, they will appear here automatically.
          </p>
        ) : (
          <div className="rules-spell-grid">
            {[...grouped.entries()].map(([className, domains]) => (
              <section key={className} className="rules-spell-class">
                <h3>{className}</h3>
                {[...domains.entries()].map(([domain, spells]) => (
                  <div key={domain} className="rules-spell-domain">
                    <strong>{domain} domain</strong>
                    <ul className="rules-spell-list">
                      {[...spells]
                        .sort(
                          (a, b) =>
                            spellLevelOrder(a.spellLevel) - spellLevelOrder(b.spellLevel),
                        )
                        .map((s) => (
                        <li key={`${domain}-${s.spellLevel}-${s.spellName}`}>
                          <strong>{formatSpellLevelKey(s.spellLevel)}:</strong> {s.spellName}
                          <span className="muted"> — description pending</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
