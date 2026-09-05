/**
 * Convert manually dropped Grok bases (e.g. fem-fit.jpg) into pack PNGs.
 * Usage: node scripts/process-doll-bases.mjs
 */
import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = path.resolve(__dirname, '../public/dolls/base')
const W = 512
const H = 1024
const BODY = ['slim', 'fit', 'soft', 'muscular']
const PRESENTATIONS = ['fem', 'masc', 'andro']

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

function pickDrop(files, presentation, body) {
  const candidates = [
    `${presentation}-${body}.jpg`,
    `${presentation}-${body}.jpeg`,
    `${presentation}-${body}.webp`,
    `${presentation}-${body}.png`,
    `${body}.jpg`,
    `${body}.jpeg`,
    `${body}.webp`,
  ]
  const lowerMap = new Map(files.map((f) => [f.toLowerCase(), f]))
  for (const c of candidates) {
    const hit = lowerMap.get(c)
    if (hit) return hit
  }
  return null
}

async function main() {
  let count = 0
  for (const presentation of PRESENTATIONS) {
    const dir = path.join(BASE, presentation)
    let files
    try {
      files = await readdir(dir)
    } catch {
      continue
    }

    for (const body of BODY) {
      const drop = pickDrop(files, presentation, body)
      if (!drop) {
        console.log(`skip ${presentation}/${body}`)
        continue
      }
      const png = await processBasePng(path.join(dir, drop))
      await writeFile(path.join(dir, `${body}.png`), png)
      count += 1
      console.log(`wrote ${presentation}/${body}.png ← ${drop}`)
    }
  }
  console.log(`\nConverted ${count} bases to 512×1024 pack PNGs.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
