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
          <Link to="/characters" className="card-link">
            <span className="card-link-title">Saved on this device</span>
            <span className="card-link-desc">
              Open, export, or delete characters stored in this browser.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/create" className="card-link">
            <span className="card-link-title">Character creation</span>
            <span className="card-link-desc">
              Step through species, class, background, carnal options, and erotic traits.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/sheet" className="card-link">
            <span className="card-link-title">Printable character sheet</span>
            <span className="card-link-desc">
              5e-inspired one-page layout for print or PDF. Open from Create or Saved with a
              character loaded.
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
        <li>
          <Link to="/rules" className="card-link">
            <span className="card-link-title">Rules reference</span>
            <span className="card-link-desc">
              Ecstasy table after climax, orgasm saves, spell names as data fills in, and
              consent-first guidance for sexual content at the table.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
