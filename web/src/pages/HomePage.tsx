import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="page">
      <h1 className="page-title">Erotic Dungeons &amp; Dragons</h1>
      <p className="lede">
        Build characters that use established 5th edition species and classes alongside your
        homebrew backgrounds, carnal classes, sexual history, and erotic traits.
      </p>
      <ul className="action-list">
        <li>
          <Link to="/create" className="card-link">
            <span className="card-link-title">Character creation</span>
            <span className="card-link-desc">
              Step through species, class, background, carnal options, and erotic traits.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/random" className="card-link">
            <span className="card-link-title">Random generator</span>
            <span className="card-link-desc">
              Roll a full character from 5e and homebrew tables, including sexual history and
              carnal profile.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
