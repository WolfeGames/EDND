import { NavLink, Outlet } from 'react-router-dom'
import './RulesPages.css'

const RULES_NAV = [
  { to: '/rules', label: 'Overview', end: true as const },
  { to: '/rules/ecstasy', label: 'Ecstasy & orgasm' },
  { to: '/rules/spells', label: 'Spells' },
  { to: '/rules/play', label: 'Sex in play' },
]

export function RulesLayout() {
  return (
    <div className="page rules-root">
      <h1 className="page-title">Rules reference</h1>
      <p className="lede rules-lede">
        Quick-reference summaries for ED&amp;D-style play: climax tables, spell names as they appear in
        data, table-safety norms, and core carnal mechanics. Your group’s house rules always take
        precedence.
      </p>
      <nav aria-label="Rules sections">
        <ul className="rules-nav">
          {RULES_NAV.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
