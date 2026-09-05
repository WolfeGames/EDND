/**
 * Generates the MVP layered paper-doll PNG pack (512×1024, neutral gray for tinting).
 * Usage: node scripts/generate-doll-pack.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../public/dolls')

const W = 512
const H = 1024
const CX = 256
const SKIN = '#9a9a9a'
const SKIN_D = '#6e6e6e'
const SKIN_L = '#b8b8b8'
const HAIR = '#8a8a8a'
const HAIR_D = '#555555'
const ACCENT = '#707070'

function svgDoc(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sg" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="${SKIN_L}"/>
      <stop offset="45%" stop-color="${SKIN}"/>
      <stop offset="100%" stop-color="${SKIN_D}"/>
    </linearGradient>
    <radialGradient id="sr" cx="45%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${SKIN_L}"/>
      <stop offset="100%" stop-color="${SKIN}"/>
    </radialGradient>
    <linearGradient id="hg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${HAIR}"/>
      <stop offset="100%" stop-color="${HAIR_D}"/>
    </linearGradient>
  </defs>
  ${body}
</svg>`
}

async function writePng(relPath, svgInner) {
  const full = path.join(OUT, relPath)
  await mkdir(path.dirname(full), { recursive: true })
  const svg = svgDoc(svgInner)
  await sharp(Buffer.from(svg)).png().toFile(full)
  return relPath
}

function bodyParams(presentation, bodyArt) {
  const isFem = presentation === 'fem'
  const isMasc = presentation === 'masc'
  const width =
    bodyArt === 'slim' ? 0.88 : bodyArt === 'soft' ? 1.12 : bodyArt === 'muscular' ? 1.1 : 1
  const muscle = bodyArt === 'muscular' ? 0.85 : bodyArt === 'slim' ? 0.2 : bodyArt === 'soft' ? 0.2 : 0.45
  const fat = bodyArt === 'soft' ? 0.7 : bodyArt === 'slim' ? 0.1 : bodyArt === 'muscular' ? 0.15 : 0.25
  const shoulder = (isMasc ? 78 : isFem ? 58 : 66) * width
  const waist = (isFem ? 36 : 48) * width * (1 + fat * 0.15)
  const hip = (isFem ? 72 : 56) * width * (1 + fat * 0.25)
  const thigh = (isFem ? 28 : 26) * width * (1 + fat * 0.2 + muscle * 0.15)
  const upperArm = (10 + muscle * 8) * width
  return { isFem, isMasc, width, muscle, fat, shoulder, waist, hip, thigh, upperArm }
}

function baseBodySvg(presentation, bodyArt) {
  const p = bodyParams(presentation, bodyArt)
  const headY = 118
  const headRx = 42 + p.fat * 4
  const headRy = 50
  const neckTop = headY + headRy - 8
  const shoulderY = 198
  const chestY = 250
  const waistY = 340
  const hipY = 390
  const crotchY = 430
  const kneeY = 620
  const ankleY = 820
  const footY = 870

  const abs =
    p.muscle > 0.5
      ? `<g opacity="0.25" stroke="${SKIN_D}" stroke-width="1.2" fill="none">
          <line x1="${CX}" y1="${chestY + 20}" x2="${CX}" y2="${waistY - 10}"/>
          <path d="M${CX - 14} ${chestY + 40} Q${CX} ${chestY + 46} ${CX + 14} ${chestY + 40}"/>
          <path d="M${CX - 12} ${chestY + 70} Q${CX} ${chestY + 76} ${CX + 12} ${chestY + 70}"/>
        </g>`
      : ''

  const pecs =
    p.isMasc && p.muscle > 0.4
      ? `<g opacity="0.2" fill="${SKIN_D}">
          <path d="M${CX - 8} ${shoulderY + 20} Q${CX - p.shoulder * 0.35} ${chestY} ${CX - p.shoulder * 0.38} ${chestY + 20} Q${CX - 20} ${chestY + 28} ${CX - 8} ${chestY + 16}"/>
          <path d="M${CX + 8} ${shoulderY + 20} Q${CX + p.shoulder * 0.35} ${chestY} ${CX + p.shoulder * 0.38} ${chestY + 20} Q${CX + 20} ${chestY + 28} ${CX + 8} ${chestY + 16}"/>
        </g>`
      : ''

  // Flat chest (breasts are separate layers)
  return `
  <!-- legs -->
  ${[-1, 1]
    .map((side) => {
      const hx = CX + side * p.hip * 0.28
      const kx = CX + side * p.hip * 0.26
      const ax = CX + side * p.hip * 0.24
      return `
      <path fill="url(#sg)" d="M${hx - p.thigh * 0.5} ${crotchY}
        C${hx - p.thigh * 0.55} ${(crotchY + kneeY) / 2}, ${kx - 18} ${kneeY - 20}, ${kx - 16} ${kneeY}
        L${kx + 16} ${kneeY}
        C${kx + 18} ${kneeY - 20}, ${hx + p.thigh * 0.55} ${(crotchY + kneeY) / 2}, ${hx + p.thigh * 0.5} ${crotchY} Z"/>
      <ellipse cx="${kx}" cy="${kneeY}" rx="14" ry="8" fill="${SKIN}"/>
      <path fill="url(#sg)" d="M${kx - 16} ${kneeY}
        C${kx - 18} ${kneeY + 40}, ${ax - 12} ${ankleY - 30}, ${ax - 8} ${ankleY}
        L${ax + 8} ${ankleY}
        C${ax + 12} ${ankleY - 30}, ${kx + 18} ${kneeY + 40}, ${kx + 16} ${kneeY} Z"/>
      <path fill="${SKIN_D}" opacity="0.75" d="M${ax - 8} ${ankleY} L${ax - 12} ${footY} Q${ax} ${footY + 8} ${ax + side * 22} ${footY} L${ax + 8} ${ankleY} Z"/>`
    })
    .join('')}

  <!-- pelvis -->
  <path fill="url(#sr)" d="M${CX - p.hip * 0.48} ${waistY + 8}
    C${CX - p.hip * 0.55} ${hipY}, ${CX - p.hip * 0.5} ${hipY + 20}, ${CX - p.hip * 0.28} ${crotchY}
    L${CX + p.hip * 0.28} ${crotchY}
    C${CX + p.hip * 0.5} ${hipY + 20}, ${CX + p.hip * 0.55} ${hipY}, ${CX + p.hip * 0.48} ${waistY + 8} Z"/>

  <!-- torso -->
  <path fill="url(#sr)" d="M${CX - p.shoulder * 0.48} ${shoulderY}
    C${CX - p.shoulder * 0.5} ${shoulderY + 30}, ${CX - p.waist * 0.52} ${waistY - 30}, ${CX - p.waist * 0.48} ${waistY}
    L${CX - p.hip * 0.46} ${waistY + 12}
    L${CX + p.hip * 0.46} ${waistY + 12}
    L${CX + p.waist * 0.48} ${waistY}
    C${CX + p.waist * 0.52} ${waistY - 30}, ${CX + p.shoulder * 0.5} ${shoulderY + 30}, ${CX + p.shoulder * 0.48} ${shoulderY} Z"/>
  ${abs}${pecs}
  <ellipse cx="${CX}" cy="${waistY - 8}" rx="3" ry="4" fill="${SKIN_D}" opacity="0.35"/>

  <!-- arms -->
  ${[-1, 1]
    .map((side) => {
      const sx = CX + side * p.shoulder * 0.46
      const ex = sx + side * 36
      const ey = 380
      const wx = ex + side * 12
      const wy = 520
      return `
      <path fill="url(#sg)" d="M${sx - side * p.upperArm * 0.4} ${shoulderY + 4}
        C${sx - side * 4} ${shoulderY + 50}, ${ex - p.upperArm * 0.45} ${ey - 40}, ${ex - p.upperArm * 0.4} ${ey}
        L${ex + p.upperArm * 0.4} ${ey}
        C${ex + p.upperArm * 0.45} ${ey - 40}, ${sx + side * p.upperArm * 0.7} ${shoulderY + 50}, ${sx + side * p.upperArm * 0.4} ${shoulderY + 4} Z"/>
      <ellipse cx="${ex}" cy="${ey}" rx="${p.upperArm * 0.4}" ry="7" fill="${SKIN}"/>
      <path fill="url(#sg)" d="M${ex - 10} ${ey} C${ex - 12} ${ey + 40}, ${wx - 8} ${wy - 20}, ${wx - 7} ${wy}
        L${wx + 7} ${wy} C${wx + 8} ${wy - 20}, ${ex + 12} ${ey + 40}, ${ex + 10} ${ey} Z"/>
      <path fill="${SKIN}" d="M${wx - 7} ${wy} Q${wx - 9} ${wy + 18} ${wx - 2} ${wy + 28} Q${wx + 2} ${wy + 30} ${wx + 2} ${wy + 28} Q${wx + 9} ${wy + 18} ${wx + 7} ${wy} Z"/>`
    })
    .join('')}

  <!-- neck + head -->
  <path fill="url(#sr)" d="M${CX - 14} ${neckTop} L${CX - 16} ${shoulderY} L${CX + 16} ${shoulderY} L${CX + 14} ${neckTop} Z"/>
  <ellipse cx="${CX}" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="url(#sr)"/>

  <!-- face -->
  ${[-1, 1]
    .map(
      (side) => `
    <ellipse cx="${CX + side * 14}" cy="${headY - 2}" rx="7" ry="5" fill="#ddd" opacity="0.85"/>
    <ellipse cx="${CX + side * 14}" cy="${headY - 1}" rx="3.5" ry="3.5" fill="${HAIR_D}" opacity="0.65"/>
    <circle cx="${CX + side * 14}" cy="${headY - 1}" r="1.6" fill="#222"/>
    <path d="M${CX + side * 6} ${headY - 10} Q${CX + side * 14} ${headY - 14} ${CX + side * 22} ${headY - 8}"
      fill="none" stroke="${HAIR_D}" stroke-width="${p.isFem ? 2 : 1.4}" opacity="0.45"/>`,
    )
    .join('')}
  <path d="M${CX} ${headY + 6} L${CX - 5} ${headY + 16} Q${CX} ${headY + 19} ${CX + 5} ${headY + 16} Z" fill="${SKIN_D}" opacity="0.25"/>
  <path d="M${CX - 10} ${headY + 26} Q${CX} ${headY + 32} ${CX + 10} ${headY + 26}" fill="none" stroke="${SKIN_D}" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
  `
}

function hairSvg(style) {
  if (style === 'short') {
    return `<path fill="url(#hg)" d="M${CX - 44} ${118}
      C${CX - 48} ${60}, ${CX + 48} ${60}, ${CX + 44} ${118}
      C${CX + 40} ${90}, ${CX - 40} ${90}, ${CX - 44} ${118}"/>`
  }
  return `<path fill="url(#hg)" d="M${CX - 48} ${130}
    C${CX - 52} ${50}, ${CX + 52} ${50}, ${CX + 48} ${130}
    C${CX + 58} ${200}, ${CX + 40} ${280}, ${CX + 20} ${260}
    Q${CX} ${290} ${CX - 20} ${260}
    C${CX - 40} ${280}, ${CX - 58} ${200}, ${CX - 48} ${130}"/>`
}

function breastsSvg(tier) {
  const scale =
    { Tiny: 0.45, Small: 0.65, Medium: 0.85, Large: 1.1, Huge: 1.4, Gargantuan: 1.75 }[tier] ?? 1
  const r = 28 * scale
  const cy = 328
  const spacing = 22 + scale * 8
  return [-1, 1]
    .map((side) => {
      const bx = CX + side * spacing
      return `
      <path fill="url(#sr)" d="M${bx - r * 0.7} ${cy - r * 0.25}
        Q${bx - r * 0.85} ${cy + r * 0.6} ${bx} ${cy + r * 0.85}
        Q${bx + r * 0.85} ${cy + r * 0.6} ${bx + r * 0.7} ${cy - r * 0.25}
        Q${bx} ${cy - r * 0.1} ${bx - r * 0.7} ${cy - r * 0.25} Z"/>
      <circle cx="${bx}" cy="${cy + r * 0.3}" r="${Math.max(3, r * 0.18)}" fill="${SKIN_D}" opacity="0.45"/>
      <circle cx="${bx}" cy="${cy + r * 0.3}" r="${Math.max(1.5, r * 0.08)}" fill="${SKIN_D}" opacity="0.75"/>`
    })
    .join('')
}

function phallusSvg(tier) {
  const scale =
    { Tiny: 0.45, Small: 0.65, Medium: 0.9, Large: 1.2, Huge: 1.55, Gargantuan: 2.0 }[tier] ?? 1
  const len = 36 * scale
  const w = 8 * Math.min(1.5, 0.7 + scale * 0.35)
  const y = 430
  return `
  <ellipse cx="${CX}" cy="${y + 4}" rx="${w * 1.35}" ry="${w * 0.95}" fill="url(#sg)" opacity="0.85"/>
  <path fill="url(#sg)" d="M${CX - w * 0.5} ${y - 4}
    L${CX - w * 0.45} ${y - 4 + len}
    Q${CX} ${y - 4 + len + w * 0.55} ${CX + w * 0.45} ${y - 4 + len}
    L${CX + w * 0.5} ${y - 4} Z"/>
  <ellipse cx="${CX}" cy="${y - 4 + len}" rx="${w * 0.52}" ry="${w * 0.38}" fill="${SKIN_D}"/>`
}

function vaginaSvg() {
  return `<path d="M${CX - 6} ${420} Q${CX} ${440} ${CX + 6} ${420}" fill="none" stroke="${SKIN_D}" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
  <ellipse cx="${CX}" cy="${430}" rx="5" ry="8" fill="${SKIN_D}" opacity="0.25"/>`
}

function earsSvg(kind) {
  const tip =
    kind === 'long-pointed' ? 48 : kind === 'droopy' ? 36 : 28
  const angle = kind === 'droopy' ? 25 : -28
  const rad = (angle * Math.PI) / 180
  return [-1, 1]
    .map((side) => {
      const baseX = CX + side * 40
      const tipX = baseX + side * tip * Math.cos(rad)
      const tipY = 118 + tip * Math.sin(rad)
      return `<path fill="url(#sg)" stroke="${SKIN_D}" stroke-width="1" d="M${baseX} ${110} Q${tipX} ${tipY} ${baseX} ${130}"/>`
    })
    .join('')
}

function hornsSvg() {
  return [-1, 1]
    .map(
      (side) =>
        `<path fill="${HAIR_D}" opacity="0.9" d="M${CX + side * 30} ${80}
          Q${CX + side * 48} ${30} ${CX + side * 36} ${18}
          Q${CX + side * 26} ${40} ${CX + side * 22} ${80}"/>`,
    )
    .join('')
}

function tusksSvg() {
  return [-1, 1]
    .map(
      (side) =>
        `<path fill="#d8d8d8" stroke="${ACCENT}" stroke-width="0.8" d="M${CX + side * 12} ${145} L${CX + side * 14} ${132} L${CX + side * 9} ${145}"/>`,
    )
    .join('')
}

function tailSvg(thick) {
  const sw = thick ? 14 : 7
  return `<path d="M${CX + 40} ${400} C${CX + 110} ${420}, ${CX + 140} ${500}, ${CX + 100} ${560}"
    fill="none" stroke="url(#sg)" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
  ${thick ? `<ellipse cx="${CX + 100}" cy="${560}" rx="16" ry="12" fill="${SKIN_D}" opacity="0.7"/>` : ''}`
}

async function main() {
  const written = []
  const presentations = ['masc', 'fem', 'andro']
  const bodies = ['slim', 'fit', 'soft', 'muscular']
  const tiers = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']

  for (const presentation of presentations) {
    for (const bodyArt of bodies) {
      written.push(
        await writePng(
          `base/${presentation}/${bodyArt}.png`,
          baseBodySvg(presentation, bodyArt),
        ),
      )
    }
  }

  written.push(await writePng('hair/short/neutral.png', hairSvg('short')))
  written.push(await writePng('hair/long/neutral.png', hairSvg('long')))

  for (const tier of tiers) {
    written.push(await writePng(`breasts/${tier.toLowerCase()}.png`, breastsSvg(tier)))
    written.push(await writePng(`phallus/${tier.toLowerCase()}.png`, phallusSvg(tier)))
  }

  written.push(await writePng('vagina/present.png', vaginaSvg()))
  written.push(await writePng('features/ears-pointed.png', earsSvg('pointed')))
  written.push(await writePng('features/ears-long-pointed.png', earsSvg('long-pointed')))
  written.push(await writePng('features/ears-droopy.png', earsSvg('droopy')))
  written.push(await writePng('features/horns.png', hornsSvg()))
  written.push(await writePng('features/tusks.png', tusksSvg()))
  written.push(await writePng('features/tail-thin.png', tailSvg(false)))
  written.push(await writePng('features/tail-thick.png', tailSvg(true)))

  console.log(`Wrote ${written.length} doll layers to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
