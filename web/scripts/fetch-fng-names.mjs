import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '..', 'src', 'data', 'fngNamePools.json')

/** FNG generator pages → pool key */
const PAGES = {
  elf: 'https://www.fantasynamegenerators.com/elf-names.php',
  dwarf: 'https://www.fantasynamegenerators.com/dwarf-names.php',
  human: 'https://www.fantasynamegenerators.com/human-names.php',
  halfling: 'https://www.fantasynamegenerators.com/halfling-names.php',
  gnome: 'https://www.fantasynamegenerators.com/gnome-names.php',
  dragonborn: 'https://www.fantasynamegenerators.com/dragonborn-names.php',
  orc: 'https://www.fantasynamegenerators.com/orc-names.php',
  angel: 'https://www.fantasynamegenerators.com/angel-names.php',
  tiefling: 'https://www.fantasynamegenerators.com/dnd-tiefling-names.php',
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
}

function splitConcatenatedNames(raw) {
  return raw
    .replace(/([a-z])([A-Z])/g, '$1\n$2')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && /^[A-Za-z][A-Za-z'-]*$/.test(s))
}

function extractNamesFromHtml(html) {
  const names = new Set()
  const spanMatches = [...html.matchAll(/<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</gi)]
  for (const m of spanMatches) {
    for (const n of splitConcatenatedNames(m[1])) names.add(n)
  }
  const resultMatch = html.match(/id="result"[^>]*>([\s\S]*?)<\/div>/i)
  if (resultMatch) {
    const text = resultMatch[1].replace(/<[^>]+>/g, ' ').trim()
    for (const n of splitConcatenatedNames(text)) names.add(n)
  }
  return [...names]
}

async function fetchPool(key, url) {
  const res = await fetch(url, { headers: HEADERS })
  const html = await res.text()
  if (html.length < 10000) {
    console.warn(`${key}: short response (${html.length}b) — Cloudflare may have blocked the fetch`)
    return null
  }
  const names = extractNamesFromHtml(html)
  console.log(`${key}: extracted ${names.length} names`)
  return names.length ? names : null
}

function loadExisting() {
  if (!fs.existsSync(outPath)) return null
  return JSON.parse(fs.readFileSync(outPath, 'utf8'))
}

async function main() {
  const existing = loadExisting()
  if (!existing) {
    console.error('Missing fngNamePools.json — commit the seed file first.')
    process.exit(1)
  }
  const next = structuredClone(existing)
  next.fetchedAt = new Date().toISOString()

  for (const [key, url] of Object.entries(PAGES)) {
    try {
      const names = await fetchPool(key, url)
      if (!names) continue
      if (key === 'tiefling') {
        next.pools.tiefling = { ...next.pools.tiefling, given: names }
      } else {
        next.pools[key] = { ...next.pools[key], given: names }
      }
    } catch (err) {
      console.warn(`${key}: ${err.message}`)
    }
  }

  fs.writeFileSync(outPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  console.log(`Updated ${outPath}`)
}

main()
