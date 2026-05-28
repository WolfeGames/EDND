#!/usr/bin/env node
/**
 * Validates table JSON under src/data/tables: duplicate ids, sexual-history carnal trait labels.
 * Exit 1 on structural errors; unresolved trait labels are warnings only (stdout).
 */
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tables = path.join(__dirname, '../src/data/tables')

const traits = JSON.parse(readFileSync(path.join(tables, 'carnal-traits.json'), 'utf8'))
  .carnalTraits
const byName = new Map(traits.map((t) => [t.name.toLowerCase(), t]))
const byId = new Map(traits.map((t) => [t.id, t]))

function labelToLikelyId(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function resolveTraitLabel(label) {
  if (typeof label !== 'string') return false
  if (byName.has(label.toLowerCase())) return true
  if (byId.has(label)) return true
  if (byId.has(labelToLikelyId(label))) return true
  return false
}

const shDir = path.join(tables, 'sexual-histories')
const files = readdirSync(shDir).filter((f) => f.endsWith('.json'))
const historyIds = new Set()
let errors = 0
let warnings = 0

for (const f of files) {
  const row = JSON.parse(readFileSync(path.join(shDir, f), 'utf8'))
  if (!row.id || typeof row.id !== 'string') {
    console.error(`[error] ${f}: missing or invalid "id"`)
    errors++
    continue
  }
  if (historyIds.has(row.id)) {
    console.error(`[error] duplicate sexual history id: ${row.id}`)
    errors++
  }
  historyIds.add(row.id)
  for (const label of row.carnalTraits ?? []) {
    if (!resolveTraitLabel(label)) {
      console.warn(`[warn] ${f} (${row.id}): unresolved carnal trait "${label}"`)
      warnings++
    }
  }
}

const species = JSON.parse(readFileSync(path.join(tables, 'species.json'), 'utf8')).species
const speciesIds = new Set()
for (const s of species) {
  if (!s.id) {
    console.error('[error] species entry missing id')
    errors++
    continue
  }
  if (speciesIds.has(s.id)) {
    console.error(`[error] duplicate species id: ${s.id}`)
    errors++
  }
  speciesIds.add(s.id)
}

const bestiaryPath = path.join(tables, 'bestiary.json')
let bestiaryCount = 0
try {
  const bestiary = JSON.parse(readFileSync(bestiaryPath, 'utf8')).bestiary
  bestiaryCount = bestiary.length
  const bestiaryIds = new Set()
  const REQUIRED_KEYS = [
    'id',
    'name',
    'sr',
    'creatureType',
    'carnalType',
    'size',
    'description',
    'abilityScores',
    'sexualTraits',
    'sexualNorms',
    'recreationalPractices',
    'breedingPractices',
    'encounterHooks',
  ]
  const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  for (const entry of bestiary) {
    if (!entry.id || typeof entry.id !== 'string') {
      console.error('[error] bestiary entry missing or invalid id')
      errors++
      continue
    }
    if (bestiaryIds.has(entry.id)) {
      console.error(`[error] duplicate bestiary id: ${entry.id}`)
      errors++
    }
    bestiaryIds.add(entry.id)
    for (const k of REQUIRED_KEYS) {
      if (!(k in entry)) {
        console.error(`[error] bestiary ${entry.id}: missing required key "${k}"`)
        errors++
      }
    }
    if (typeof entry.sr !== 'number') {
      console.error(`[error] bestiary ${entry.id}: "sr" must be a number`)
      errors++
    }
    if (entry.abilityScores && typeof entry.abilityScores === 'object') {
      for (const ab of ABILITY_KEYS) {
        if (typeof entry.abilityScores[ab] !== 'number') {
          console.error(`[error] bestiary ${entry.id}: abilityScores.${ab} must be a number`)
          errors++
        }
      }
    }
    if (!Array.isArray(entry.sexualTraits)) {
      console.error(`[error] bestiary ${entry.id}: "sexualTraits" must be an array`)
      errors++
    } else {
      for (const trait of entry.sexualTraits) {
        if (!trait || typeof trait.name !== 'string' || typeof trait.mechanical !== 'string') {
          console.error(
            `[error] bestiary ${entry.id}: each sexualTrait needs string "name" and "mechanical"`,
          )
          errors++
        }
      }
    }
  }
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log('[info] bestiary.json not found — skipping bestiary validation.')
  } else {
    console.error(`[error] failed to parse bestiary.json: ${e.message}`)
    errors++
  }
}

console.log(
  `Table ref check: ${files.length} sexual history files, ${species.length} species, ${traits.length} carnal traits, ${bestiaryCount} bestiary entries.`,
)
if (warnings) console.log(`Warnings: ${warnings} (trait label not matched by id or name)`)
if (errors) {
  console.log(`Errors: ${errors}`)
  process.exit(1)
}
console.log('No structural errors.')
