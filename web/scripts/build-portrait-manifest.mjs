import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildSpeciesPrefixList,
  parsePortraitStem,
} from './portraitParseShared.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const portraitsDir = path.join(webRoot, 'public', 'portraits')
const speciesJsonPath = path.join(webRoot, 'src', 'data', 'tables', 'species.json')
const outPath = path.join(webRoot, 'src', 'data', 'portraitManifest.json')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

function titleCase(id) {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function genderLabel(token) {
  if (token === 'f') return 'female'
  if (token === 'm') return 'male'
  if (token === 'they') return 'they/them'
  return token
}

function buildLabel(speciesId, genderToken, roleId, variantTags) {
  const bits = [titleCase(speciesId), `(${genderLabel(genderToken)})`]
  if (roleId) bits.push('—', titleCase(roleId))
  else if (variantTags.length) bits.push('—', variantTags.map(titleCase).join(', '))
  return bits.join(' ')
}

function main() {
  if (!fs.existsSync(portraitsDir)) {
    console.error(`Missing ${portraitsDir} — run npm run portraits:sync first.`)
    process.exit(1)
  }
  const speciesData = JSON.parse(fs.readFileSync(speciesJsonPath, 'utf8'))
  const tableIds = speciesData.species.map((s) => s.id)
  const prefixes = buildSpeciesPrefixList(tableIds)

  /** Legacy filenames that do not follow `{species}-{gender}` parsing. */
  const LEGACY_OVERRIDES = {
    'female-aasimar.jpg': { speciesId: 'aasimar', genderToken: 'f', label: 'Aasimar (female alt)' },
    'male-aasimar.jpg': { speciesId: 'aasimar', genderToken: 'm', label: 'Aasimar (male alt)' },
    'female-high-elf.jpg': { speciesId: 'highelf', genderToken: 'f', label: 'High elf (female alt)' },
    'satyr.jpg': { speciesId: 'satyr', genderToken: 'they', label: 'Satyr' },
  }

  const entries = []
  const files = fs.readdirSync(portraitsDir).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))

  for (const filename of files.sort()) {
    const legacy = LEGACY_OVERRIDES[filename]
    if (legacy) {
      entries.push({
        filename,
        src: `/portraits/${filename}`,
        speciesId: legacy.speciesId,
        genderToken: legacy.genderToken,
        variantTags: [],
        label: legacy.label,
      })
      continue
    }
    const stem = path.basename(filename, path.extname(filename)).toLowerCase()
    const parsed = parsePortraitStem(stem, prefixes)
    if (!parsed) {
      console.warn(`Skipped (unparsed): ${filename}`)
      continue
    }
    const { speciesId, genderToken, roleId, variantTags } = parsed
    entries.push({
      filename,
      src: `/portraits/${filename}`,
      speciesId,
      genderToken,
      roleId,
      variantTags,
      label: buildLabel(speciesId, genderToken, roleId, variantTags),
    })
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: portraitsDir,
    count: entries.length,
    entries,
  }
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${entries.length} portrait entries → ${outPath}`)
}

main()
