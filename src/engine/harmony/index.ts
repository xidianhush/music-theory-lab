import type { Piece } from '../../data/pieces'
import { keyFromFifths, measureOnsets, pieceMeasureToScoreMeasure } from '../score'
import type { ChordQuality } from '../chords'
import { CHORD_INTERVALS } from '../chords'
import { scalePitchClasses, scaleNoteNames } from '../scale'
import { pitchClassOfKeyName } from '../../data/notes'

/**
 * 曲目和声自动识别（M4 扩展，规则引擎）：
 * 1. 调号（fifths）→ 调式（keyFromFifths）；
 * 2. 每小节拍点 0 的音集先按调号校正（JSON 音高不含调号升降）；
 * 3. 与「调内 7 级 × 常用和弦模板」匹配得分，取最高；
 * 4. 相邻小节同和弦合并为进行，供教学标注。
 * 结论仅供参考（真实和声可能含转位/经过音/非和声音）。
 */

/* ---------- 调号校正 ---------- */

/** 升号顺序（pc）：F C G D A E B */
const SHARP_ORDER = [6, 0, 7, 2, 9, 4, 11]
/** 降号顺序（pc）：B E A D G C F */
const FLAT_ORDER = [11, 4, 9, 2, 7, 0, 5]

/** 按调号（fifths）校正一个音级：♭A 大调（-4）下 A(pc9)→Ab(pc8) */
export function fifthsAdjust(fifths: number, pc: number): number {
  if (fifths > 0) {
    for (let i = 0; i < Math.min(fifths, 7); i++) if (pc === SHARP_ORDER[i]) return (pc + 1) % 12
  } else if (fifths < 0) {
    for (let i = 0; i < Math.min(-fifths, 7); i++) if (pc === FLAT_ORDER[i]) return (pc - 1 + 12) % 12
  }
  return pc
}

/* ---------- 和弦匹配 ---------- */

/** 参与匹配的和弦质量模板（三和弦 + 七和弦 + 常用挂留/减七） */
const CANDIDATE_QUALITIES: ChordQuality[] = ['maj', 'min', 'dim', 'aug', 'sus4', 'sus2', 'maj7', 'min7', 'dom7', 'halfdim7', 'dim7']

export interface HarmonyChord {
  degree: number
  quality: ChordQuality
  name: string
  roman: string
  pcs: number[]
}

export interface MeasureHarmony {
  measure: number
  /** 拍点 0 的音集（调号校正后的 pc，升序） */
  pcs: number[]
  /** 无匹配（音太少 / 全休止）时为 null */
  chord: HarmonyChord | null
}

export interface ProgressionSegment {
  degree: number
  quality: ChordQuality
  name: string
  roman: string
  /** 和弦构成音（校正后 pc，升序） */
  pcs: number[]
  /** 合并范围内的小节序号（含首尾） */
  measures: number[]
}

/* ---------- 候选生成与打分 ---------- */

function buildCandidates(root: string): HarmonyChord[] {
  const scalePcs = scalePitchClasses(pitchClassOfKeyName(root), 'major')
  const candidates: HarmonyChord[] = []
  for (let degree = 1; degree <= 7; degree++) {
    for (const q of CANDIDATE_QUALITIES) {
      const pcs = [...new Set(CHORD_INTERVALS[q].map((iv) => (scalePcs[degree - 1] + iv) % 12))]
      // 覆盖音 ≥ 目标音数一半才可能当选（由打分控制，这里先建全量候选）
      candidates.push({ degree, quality: q, name: '', roman: '', pcs })
    }
  }
  return candidates
}

const QUALITY_LABEL: Record<ChordQuality, string> = {
  maj: '', min: 'm', dim: '°', aug: '+', sus4: 'sus4', sus2: 'sus2',
  maj7: 'maj7', min7: 'm7', dom7: '7', halfdim7: 'ø7', dim7: '°7',
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

function romanOfDegree(degree: number, quality: ChordQuality): string {
  const isMajor = quality === 'maj' || quality === 'aug' || quality === 'maj7' || quality === 'dom7'
  const base = isMajor ? ROMAN[degree - 1] : ROMAN[degree - 1].toLowerCase()
  const suffix = quality === 'dim' ? '°' : QUALITY_LABEL[quality]
  return base + suffix
}

/**
 * 打分：覆盖音权重高，根音/三音额外加分，缺失音轻罚；目标音少（≤2）不识别。
 * 返回 { chord, score }，score < 0 视为无匹配。
 */
export function matchChord(pcs: number[], root: string): HarmonyChord | null {
  if (pcs.length < 2) return null
  const target = new Set(pcs)
  let best: { chord: HarmonyChord; score: number } | null = null
  for (const cand of buildCandidates(root)) {
    let score = 0
    let missing = 0
    for (const [i, cpc] of cand.pcs.entries()) {
      if (target.has(cpc)) {
        score += 10
        if (i === 0) score += 5 // 根音
        if (i === 1) score += 3 // 三音
      } else {
        missing++
        score -= 4
      }
    }
    // 目标里非和弦音的杂音：轻微惩罚（每音 -1）
    for (const tpc of target) if (!cand.pcs.includes(tpc)) score -= 1
    // 缺音超过 1 个的候选基本出局（三和弦容忍 1 缺）
    if (missing > 1) score -= 20
    if (best === null || score > best.score) {
      const rootName = scaleNoteNames(root, 'major')[cand.degree - 1]
      best = { chord: { ...cand, name: `${rootName}${QUALITY_LABEL[cand.quality]}`, roman: romanOfDegree(cand.degree, cand.quality) }, score }
    }
  }
  return best && best.score > 0 ? best.chord : null
}

/* ---------- 整曲分析 ---------- */

export interface PieceHarmony {
  key: { root: string; label: string; sharpsFlats: number }
  measures: MeasureHarmony[]
  /** 合并后的和弦进行（相邻小节同和弦合并） */
  progression: ProgressionSegment[]
  /** 每小节拍点 0 的原始 MIDI（调号校正前，供对照） */
  rawMidis: { measure: number; midis: number[] }[]
}

export function analyzePieceHarmony(piece: Piece): PieceHarmony {
  const fifths = piece.measures[0]?.fifths ?? 0
  const key = keyFromFifths(fifths)
  const root = key.root
  const measures: MeasureHarmony[] = []
  const rawMidis: { measure: number; midis: number[] }[] = []
  for (const m of piece.measures) {
    const sm = pieceMeasureToScoreMeasure(m)
    const onsets = measureOnsets(sm, piece.divisions)
    const beat0 = onsets.find((o) => Math.abs(o.quarterPos) < 1e-9) ?? onsets[0]
    const midis = beat0 ? beat0.midis : []
    rawMidis.push({ measure: m.n, midis })
    const pcs = [...new Set(midis.map((mi) => fifthsAdjust(fifths, mi % 12)))].sort((a, b) => a - b)
    measures.push({ measure: m.n, pcs, chord: matchChord(pcs, root) })
  }
  // 相邻小节同和弦合并为进行段
  const progression: ProgressionSegment[] = []
  for (const h of measures) {
    const c = h.chord
    if (!c) continue
    const last = progression[progression.length - 1]
    if (last && last.degree === c.degree && last.quality === c.quality) {
      last.measures.push(h.measure)
    } else {
      progression.push({ degree: c.degree, quality: c.quality, name: c.name, roman: c.roman, pcs: c.pcs, measures: [h.measure] })
    }
  }
  return { key, measures, progression, rawMidis }
}
