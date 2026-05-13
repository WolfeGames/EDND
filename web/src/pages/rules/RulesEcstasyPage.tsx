import {
  AROUSED_RULES,
  ORGASM_SAVE_RULES,
  ORGASM_SPECIAL_RULES,
  ORGASM_TABLE,
  ORGASM_TABLE_ROLL,
  PLEASURE_POINTS_RULES,
  REFRACTORY_RULES,
} from '../../data/rulesReference'

export function RulesEcstasyPage() {
  return (
    <div className="rules-ecstasy">
      <article className="rules-block">
        <h2>Pleasure points</h2>
        <ul className="rules-list">
          {PLEASURE_POINTS_RULES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>

      <article className="rules-block">
        <h2>Aroused</h2>
        <ul className="rules-list">
          {AROUSED_RULES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>

      <article className="rules-block">
        <h2>{ORGASM_SAVE_RULES.title}</h2>
        <ul className="rules-list">
          {ORGASM_SAVE_RULES.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h3>Outcomes</h3>
        <ul className="rules-list">
          {ORGASM_SAVE_RULES.outcomes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="rules-callout">
          <strong>Natural 20.</strong> {ORGASM_SAVE_RULES.natural20}
        </p>
      </article>

      <article className="rules-block">
        <h2>Ecstasy table (after climax)</h2>
        <p className="rules-prose">{ORGASM_TABLE_ROLL}</p>
        <div className="rules-table-wrap">
          <table className="rules-table">
            <thead>
              <tr>
                <th scope="col">d100 result</th>
                <th scope="col">Intensity</th>
                <th scope="col">Effect</th>
              </tr>
            </thead>
            <tbody>
              {ORGASM_TABLE.map((row) => (
                <tr key={row.rangeLabel}>
                  <td>{row.rangeLabel}</td>
                  <td>{row.intensity}</td>
                  <td>{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rules-block">
        <h2>Refractory</h2>
        <ul className="rules-list">
          {REFRACTORY_RULES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>

      <article className="rules-block">
        <h2>Related conditions &amp; options</h2>
        <ul className="rules-list">
          {ORGASM_SPECIAL_RULES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>
    </div>
  )
}
