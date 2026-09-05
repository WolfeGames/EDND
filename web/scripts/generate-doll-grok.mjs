/**
 * Generate painted paper-doll BASE bodies via xAI Grok Imagine.
 * Endowment layers stay procedural (genitals are unreliable from image models).
 *
 * Usage: node scripts/generate-doll-grok.mjs
 * Requires: XAI_API_KEY in web/.env (gitignored)
 *
 * Options:
 *   --only=masc/fit,fem/soft   limit which bases to generate
 *   --dry-run                  print prompts only
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public/dolls')
const W = 512
const H = 1024

async function loadEnv() {
  try {
    const text = await readFile(path.join(ROOT, '.env'), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // optional
  }
}

const SHARED = [
  'Front-facing full-body fantasy character for a modular RPG paper-doll asset.',
  'Painterly digital illustration, soft brush rendering, clean anatomy, realistic human proportions.',
  'Standing A-pose: arms slightly away from torso, legs straight, feet flat, head facing camera.',
  'Centered on a pure white background, full figure from head to toes with margin, vertical 1:2 framing.',
  'Completely bald head (no hair) so a separate hair layer can be composited later. Keep eyebrows and eyes.',
  'Nude body, no clothing, no jewelry, no props, no text, no watermark.',
  'CRITICAL: smooth featureless mannequin-style groin — NO genitals, no nipples detail exaggeration, blank crotch area for separate overlay layers.',
  'Soft even studio lighting from upper left, subtle contact shadow under feet only.',
  'Consistent character sheet style suitable for game UI compositing.',
].join(' ')

const PRESENTATION = {
  masc: 'Masculine adult human presentation: broader shoulders, narrower hips, flat chest, defined jaw.',
  fem: 'Feminine adult human presentation: narrower shoulders, wider hips, soft torso (flat chest — breasts are a separate overlay), softer jaw.',
  andro: 'Androgynous adult human presentation: balanced shoulders and hips, flat chest, soft-angular face.',
}

const BODY = {
  slim: 'Slim/lithe build: lean limbs, visible collarbones, minimal fat, light muscle tone.',
  fit: 'Fit/athletic build: healthy muscle tone, proportional waist, neither skinny nor bulky.',
  soft: 'Soft/curvy build: rounder midsection and thighs, soft belly, less muscle definition.',
  muscular: 'Muscular build: visible pecs/shoulders/arms and quads, V-taper torso, low body fat.',
}

function parseArgs(argv) {
  const only = new Set()
  let dryRun = false
  for (const a of argv) {
    if (a === '--dry-run') dryRun = true
    if (a.startsWith('--only=')) {
      for (const part of a.slice('--only='.length).split(',')) {
        if (part.trim()) only.add(part.trim())
      }
    }
  }
  return { only, dryRun }
}

function jobs() {
  const list = []
  for (const presentation of Object.keys(PRESENTATION)) {
    for (const bodyArt of Object.keys(BODY)) {
      list.push({
        presentation,
        bodyArt,
        rel: `base/${presentation}/${bodyArt}.png`,
        prompt: `${SHARED} ${PRESENTATION[presentation]} ${BODY[bodyArt]}`,
      })
    }
  }
  return list
}

async function generateImage(prompt, apiKey) {
  const res = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-image-quality',
      prompt,
      n: 1,
      aspect_ratio: '1:2',
      resolution: '1k',
      response_format: 'b64_json',
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`xAI image API ${res.status}: ${text.slice(0, 500)}`)
  }
  const json = JSON.parse(text)
  const b64 = json.data?.[0]?.b64_json
  const url = json.data?.[0]?.url
  if (b64) return Buffer.from(b64, 'base64')
  if (url) {
    const img = await fetch(url)
    if (!img.ok) throw new Error(`Failed to download image URL: ${img.status}`)
    return Buffer.from(await img.arrayBuffer())
  }
  throw new Error('No image data in xAI response')
}

/** Resize to doll canvas and punch near-white background to alpha. */
async function processBasePng(input) {
  const resized = await sharp(input)
    .resize(W, H, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = resized
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    // Near-white / light gray studio bg → transparent
    if (min > 242 && max - min < 18) {
      data[i + 3] = 0
    } else if (min > 228 && max - min < 22) {
      const t = (min - 228) / 14
      data[i + 3] = Math.round(data[i + 3] * (1 - t))
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
}

async function main() {
  await loadEnv()
  const { only, dryRun } = parseArgs(process.argv.slice(2))
  const apiKey = process.env.XAI_API_KEY?.trim()
  if (!apiKey && !dryRun) {
    console.error('Missing XAI_API_KEY. Add it to web/.env')
    process.exit(1)
  }

  let list = jobs()
  if (only.size > 0) {
    list = list.filter((j) => only.has(`${j.presentation}/${j.bodyArt}`) || only.has(j.rel))
  }

  console.log(`Generating ${list.length} base bodies via Grok Imagine…`)
  for (const job of list) {
    console.log(`→ ${job.rel}`)
    if (dryRun) {
      console.log(job.prompt.slice(0, 180) + '…')
      continue
    }
    const raw = await generateImage(job.prompt, apiKey)
    const png = await processBasePng(raw)
    const full = path.join(OUT, job.rel)
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, png)
    console.log(`  wrote ${full} (${png.length} bytes)`)
  }
  console.log('Done. Endowment/feature overlays still from: npm run dolls:generate')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
