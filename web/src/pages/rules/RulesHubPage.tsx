import { Link } from 'react-router-dom'

export function RulesHubPage() {
  return (
    <section className="rules-hub">
      <h2 className="rules-section-title">Browse by topic</h2>
      <ul className="action-list">
        <li>
          <Link to="/rules/ecstasy" className="card-link">
            <span className="card-link-title">Ecstasy &amp; orgasm</span>
            <span className="card-link-desc">
              Pleasure points, arousal, orgasm saving throws, the post-climax ecstasy table, and
              refractory.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/rules/spells" className="card-link">
            <span className="card-link-title">Spells</span>
            <span className="card-link-desc">
              Domain spell names from carnal class data; full write-ups will land here when
              Eromancy entries are completed.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/rules/play" className="card-link">
            <span className="card-link-title">Sex in play</span>
            <span className="card-link-desc">
              Consent-first table practices, separating mechanics from narration, and condensed
              character-scale rules (conditions, Sexuality bonus, fertility sketch).
            </span>
          </Link>
        </li>
      </ul>
    </section>
  )
}
