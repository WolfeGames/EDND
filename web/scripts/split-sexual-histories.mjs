/**
 * Split `{ "sexualHistories": [ ... ] }` into one JSON file per row under
 * `src/data/tables/sexual-histories/<id>.json`.
 *
 * Usage:
 *   node scripts/split-sexual-histories.mjs path/to/aggregate.json
 *   node scripts/split-sexual-histories.mjs path/to/aggregate.json --delete-source
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const src = process.argv[2]
if (!src) {
  console.error(
    'Usage: node scripts/split-sexual-histories.mjs <aggregate.json> [--delete-source]',
  )
  process.exit(1)
}

const deleteSource = process.argv.includes('--delete-source')
const outDir = path.join(root, 'src', 'data', 'tables', 'sexual-histories')

const data = JSON.parse(fs.readFileSync(src, 'utf8'))
if (!Array.isArray(data.sexualHistories)) {
  throw new Error('Expected { sexualHistories: [...] }')
}
fs.mkdirSync(outDir, { recursive: true })
for (const row of data.sexualHistories) {
  if (!row?.id) throw new Error('Row missing id')
  const file = path.join(outDir, `${row.id}.json`)
  fs.writeFileSync(file, JSON.stringify(row, null, 2) + '\n', 'utf8')
}
if (deleteSource) fs.unlinkSync(src)
