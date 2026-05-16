import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/components/CharacterSummary.tsx')
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)

const startDup = lines.findIndex((l) => l === '      {speciesRow && (') 
// find the LAST occurrence after history
let dupIdx = -1
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '      {speciesRow && (' && i > 500) dupIdx = i
}

const teaserIdx = lines.findIndex((l) => l === '      {teaserOpen && (')
if (dupIdx === -1 || teaserIdx === -1) throw new Error(`dup=${dupIdx} teaser=${teaserIdx}`)

const carnalBlock = `      {carnalClassRow && (
        <section className="immersive-carnal immersive-panel">
          <div className="immersive-carnal__banner">
            <motion.div>
              <p className="immersive-carnal__eyebrow">Carnal class</p>
              <h3 className="immersive-carnal__name">{carnalClassRow.name}</h3>
              <p className="immersive-carnal__tagline muted">{carnalClassRow.description}</p>
            </motion.div>
            <ul className="immersive-carnal__quick muted">
              <li>Hit die d{carnalClassRow.hitDie}</li>
              {carnalClassRow.primarySexualAbility && (
                <li>Primary {carnalClassRow.primarySexualAbility}</li>
              )}
              {carnalClassRow.eroticAptitude && (
                <li>Aptitude {carnalClassRow.eroticAptitude}</li>
              )}
            </ul>
          </motion.div>

          <details className="immersive-carnal__features">
            <summary className="immersive-carnal__summary">
              Level features
              <span className="immersive-carnal__chev" aria-hidden />
            </summary>
            <div className="feature-list immersive-carnal__feature-list">
              {Object.entries(carnalClassRow.features).map(([k, v]) => (
                <FeatureRuleBlock
                  key={k}
                  ruleKey={k}
                  text={typeof v === 'string' ? v : \`\${v.name}: \${v.description}\`}
                  characterLevel={character.level}
                />
              ))}
            </motion.div>
          </details>
          {carnalClassRow.subclasses.length > 0 && (
            <p className="muted">
              Subclasses:{' '}
              {carnalClassRow.subclasses
                .map((s) => (typeof s === 'string' ? s : s.name))
                .join(', ')}
            </p>
          )}
        </section>
      )}
`.split(/\r?\n/)

// Fix carnal block - use proper div tags
const carnalFixed = carnalBlock
  .join('\n')
  .replaceAll('<motion.div>', '<motion.div>')
  .replaceAll('</motion.div>', '</motion.div>')

// build carnal without motion - write inline
const carnal = [
  '      {carnalClassRow && (',
  '        <section className="immersive-carnal immersive-panel">',
  '          <div className="immersive-carnal__banner">',
  '            <div>',
  '              <p className="immersive-carnal__eyebrow">Carnal class</p>',
  '              <h3 className="immersive-carnal__name">{carnalClassRow.name}</h3>',
  '              <p className="immersive-carnal__tagline muted">{carnalClassRow.description}</p>',
  '            </div>',
  '            <ul className="immersive-carnal__quick muted">',
  '              <li>Hit die d{carnalClassRow.hitDie}</li>',
  '              {carnalClassRow.primarySexualAbility && (',
  '                <li>Primary {carnalClassRow.primarySexualAbility}</li>',
  '              )}',
  '              {carnalClassRow.eroticAptitude && (',
  '                <li>Aptitude {carnalClassRow.eroticAptitude}</li>',
  '              )}',
  '            </ul>',
  '          </div>',
  '',
  '          <details className="immersive-carnal__features">',
  '            <summary className="immersive-carnal__summary">',
  '              Level features',
  '              <span className="immersive-carnal__chev" aria-hidden />',
  '            </summary>',
  '            <div className="feature-list immersive-carnal__feature-list">',
  '              {Object.entries(carnalClassRow.features).map(([k, v]) => (',
  '                <FeatureRuleBlock',
  '                  key={k}',
  '                  ruleKey={k}',
  '                  text={typeof v === \'string\' ? v : `${v.name}: ${v.description}`}',
  '                  characterLevel={character.level}',
  '                />',
  '              ))}',
  '            </div>',
  '          </details>',
  '          {carnalClassRow.subclasses.length > 0 && (',
  '            <p className="muted">',
  '              Subclasses:{\' \'}',
  '              {carnalClassRow.subclasses',
  '                .map((s) => (typeof s === \'string\' ? s : s.name))',
  '                .join(\', \')}',
  '            </p>',
  '          )}',
  '        </section>',
  '      )}',
  '',
]

const newLines = [...lines.slice(0, dupIdx), ...carnal, ...lines.slice(teaserIdx)]
fs.writeFileSync(p, newLines.join('\n'))
console.log('removed dup lines', dupIdx, 'to', teaserIdx)
