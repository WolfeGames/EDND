import {
  ABILITY_CARNAL_INTERPRETATION,
  FERTILITY_SUMMARY,
  KEY_CONDITIONS,
  SEXUALITY_BONUS_BY_LEVEL,
  SEXUALITY_BONUS_USES,
  TABLE_SAFETY_GUIDELINES,
} from '../../data/rulesReference'

export function RulesSexInPlayPage() {
  return (
    <div className="rules-play">
      {TABLE_SAFETY_GUIDELINES.map((section) => (
        <article key={section.heading} className="rules-block">
          <h2>{section.heading}</h2>
          <ul className="rules-list">
            {section.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </article>
      ))}

      <article className="rules-block">
        <h2>Sexuality bonus by level</h2>
        <p className="rules-prose">
          Your Sexuality bonus scales like proficiency bonus and plugs into many carnal checks.
        </p>
        <div className="rules-table-wrap">
          <table className="rules-table">
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">Sexuality bonus</th>
              </tr>
            </thead>
            <tbody>
              {SEXUALITY_BONUS_BY_LEVEL.map((row) => (
                <tr key={row.levelRange}>
                  <td>{row.levelRange}</td>
                  <td>{row.bonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Commonly added to</h3>
        <ul className="rules-list">
          {SEXUALITY_BONUS_USES.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </article>

      <article className="rules-block">
        <h2>Ability scores (carnal read)</h2>
        <ul className="rules-list">
          {ABILITY_CARNAL_INTERPRETATION.map((row) => (
            <li key={row.ability}>
              <strong>{row.ability}:</strong> {row.text}
            </li>
          ))}
        </ul>
      </article>

      <article className="rules-block">
        <h2>Key conditions (short)</h2>
        <ul className="rules-list">
          {KEY_CONDITIONS.map((c) => (
            <li key={c.name}>
              <strong>{c.name}:</strong> {c.text}
            </li>
          ))}
        </ul>
        <p className="rules-callout">
          For full orgasm save steps, PP recovery timing, and the ecstasy table, use the{' '}
          <strong>Ecstasy &amp; orgasm</strong> section.
        </p>
      </article>

      <article className="rules-block">
        <h2>Fertility &amp; conception (sketch)</h2>
        <ul className="rules-list">
          {FERTILITY_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>
    </div>
  )
}
