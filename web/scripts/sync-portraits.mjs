import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const defaultSource = path.join(
  process.env.USERPROFILE ?? process.env.HOME ?? '',
  'Documents',
  'ednd',
  'portraits',
)
const sourceDir = path.resolve(process.env.EDND_PORTRAITS_DIR ?? defaultSource)
const destDir = path.join(webRoot, 'public', 'portraits')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

function copyPortraits() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Portrait source not found: ${sourceDir}`)
    console.error('Set EDND_PORTRAITS_DIR to your portraits folder.')
    process.exit(1)
  }
  fs.mkdirSync(destDir, { recursive: true })
  for (const existing of fs.readdirSync(destDir)) {
    fs.rmSync(path.join(destDir, existing), { recursive: true, force: true })
  }
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  let copied = 0
  for (const ent of entries) {
    if (!ent.isFile()) continue
    const ext = path.extname(ent.name).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    const src = path.join(sourceDir, ent.name)
    const dest = path.join(destDir, ent.name)
    fs.copyFileSync(src, dest)
    copied += 1
  }
  console.log(`Copied ${copied} portrait(s) from ${sourceDir} → ${destDir}`)
}

copyPortraits()
