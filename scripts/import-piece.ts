/**
 * 入库脚本：MusicXML → 曲目 JSON（含人工校对修正）
 *
 * 用法：npx tsx scripts/import-piece.ts
 * 输出：src/data/pieces/luv-sic-pt3.json
 *
 * 校对依据（QA.md + 谱首字形目检）：
 *   页1 fifths=-3（♭B 大调，3 降号，裁图确认）
 *   页2 fifths=-4（♭A 大调，4 降号，裁图确认）
 *   页3 fifths=-4（♭A 大调，4 降号，裁图确认）
 *   页4 fifths=-4（♭A 大调，4 降号，OCR 计数确认）
 *   页5 fifths=-3（♭E 大调，3 降号，裁图确认；♭B 为备选）
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseMusicXml } from '../src/engine/score/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCORE_DIR = path.join(__dirname, '..', 'data', 'scores', 'luv-sic-pt3')
const OUT = path.join(__dirname, '..', 'src', 'data', 'pieces', 'luv-sic-pt3.json')

const CORRECTION: Record<number, { fifths: number; label: string; note: string }> = {
  1: { fifths: -3, label: '♭B 大调', note: '起始调：3 个降号' },
  2: { fifths: -4, label: '♭A 大调', note: '转调 ♭B→♭A：下行二度，4 个降号' },
  3: { fifths: -4, label: '♭A 大调', note: '延续 ♭A 大调' },
  4: { fifths: -4, label: '♭A 大调', note: '延续 ♭A 大调' },
  5: { fifths: -3, label: '♭E 大调', note: '转调 ♭A→♭E：下行四度，3 个降号' },
}

function readXml(page: number): string {
  const file = path.join(SCORE_DIR, `pg-${page}-s.mxl`)
  return execSync(`unzip -p '${file}' '*.xml'`, { encoding: 'utf-8' })
}

function toCompact(n: ReturnType<typeof parseMusicXml>['measures'][number]['notes'][number]) {
  return {
    p: n.pitch ? { s: n.pitch.step, o: n.pitch.octave, a: n.pitch.alter } : null,
    d: n.duration,
    t: n.type,
    dot: n.dots,
    v: n.voice,
    st: n.staff,
    c: n.chord,
    ts: n.tieStart,
    tp: n.tieStop,
  }
}

const allMeasures: Record<string, unknown>[] = []
const pages: Record<string, unknown>[] = []
let globalN = 0

for (let page = 1; page <= 5; page++) {
  const xml = readXml(page)
  const score = parseMusicXml(xml)
  const corr = CORRECTION[page]
  const startN = globalN + 1
  for (const m of score.measures) {
    globalN += 1
    allMeasures.push({
      n: globalN,
      fifths: corr.fifths,
      beats: m.beats,
      beatType: m.beatType,
      notes: m.notes.map(toCompact),
    })
  }
  pages.push({
    page,
    label: corr.label,
    fifths: corr.fifths,
    measureStart: startN,
    measureEnd: globalN,
    note: corr.note,
  })
}

const piece = {
  id: 'luv-sic-pt3',
  title: 'Luv(sic.)pt3',
  composer: 'Nujabes',
  lyricist: 'Shing02',
  arranger: '化身无（虫虫钢琴）',
  source: 'data/scores/luv-sic-pt3/luv(sic)pt3.pdf',
  bpm: 95,
  divisions: 4,
  staves: 2,
  pages,
  measures: allMeasures,
}

writeFileSync(OUT, JSON.stringify(piece, null, 1) + '\n')
console.log(
  `✓ 写入 ${OUT}：${pages.length} 页，${globalN} 小节，${allMeasures.reduce((s, m) => s + (m.notes as unknown[]).length, 0)} 音符`,
)
console.log(pages.map((p) => `页${p.page}: ${p.label}（小节 ${p.measureStart}-${p.measureEnd}）`).join('\n'))
