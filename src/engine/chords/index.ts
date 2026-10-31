import type { ScaleQuality } from '../scale'
import { scaleMidi, scaleNoteNames } from '../scale'
import { pitchClassOfKeyName } from '../../data/notes'

/**
 * 和弦引擎：从「调式 + 级数」生成和弦音与拼写（M4 扩展）。
 * 与调无关的通用模板；音名拼写随调号（♭A 大调 IV 写作 Db F Ab，而非 C#…）。
 */

export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'sus4'
  | 'sus2'
  | 'maj7'
  | 'min7'
  | 'dom7'
  | 'halfdim7'
  | 'dim7'

/** 和弦音程模板（半音，0 = 根音） */
export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  halfdim7: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
}

/** 调式音级默认三和弦质量（大调 I ii iii IV V vi vii°；自然小调 i ii° III iv v VI VII） */
export const TRIAD_BY_DEGREE: Record<ScaleQuality, ChordQuality[]> = {
  major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  naturalMinor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
}

/** 调式音级默认七和弦质量（大调 Imaj7 iim7 iiim7 IVmaj7 V7 vim7 viiø7；小调 im7 iiø7 IIImaj7 ivm7 vm7 VImaj7 VII7） */
export const SEVENTH_BY_DEGREE: Record<ScaleQuality, ChordQuality[]> = {
  major: ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'halfdim7'],
  naturalMinor: ['min7', 'halfdim7', 'maj7', 'min7', 'min7', 'maj7', 'dom7'],
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/** 半音音程 → 字母步进（三度跳 2 个字母，如 C→E；五度跳 4 个字母；七度跳 6 个字母） */
const LETTER_STEP: Record<number, number> = {
  0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4, 9: 6, 10: 6, 11: 6,
}

/** 音级默认和弦质量 */
export function chordQualityOfDegree(quality: ScaleQuality, degree: number, seventh = false): ChordQuality {
  const table = seventh ? SEVENTH_BY_DEGREE : TRIAD_BY_DEGREE
  const q = table[quality][degree - 1]
  if (!q) throw new Error(`级数越界: degree=${degree}`)
  return q
}

/** 级数 → 根音音名（如 C 大调 IV → 'F'、♭A 大调 V → 'Eb'） */
export function chordRootName(root: string, quality: ScaleQuality, degree: number): string {
  return scaleNoteNames(root, quality)[degree - 1]
}

/** 和弦名的质量后缀（如 'maj7'、'7'、'ø7'、'm7'、'm'、'°'） */
export function qualitySuffix(q: ChordQuality): string {
  switch (q) {
    case 'maj7': return 'maj7'
    case 'dom7': return '7'
    case 'halfdim7': return 'ø7'
    case 'dim7': return '°7'
    case 'min7': return 'm7'
    case 'min': return 'm'
    case 'dim': return '°'
    case 'aug': return '+'
    case 'sus4': return 'sus4'
    case 'sus2': return 'sus2'
    default: return ''
  }
}

/** 完整和弦名（如 'F'、'G7'、'Bm7'、'Ebmaj7'） */
export function chordName(root: string, quality: ScaleQuality, degree: number, seventh = false): string {
  return chordRootName(root, quality, degree) + qualitySuffix(chordQualityOfDegree(quality, degree, seventh))
}

/** 和弦音的规范音名（随调号拼写，如 ♭A 大调 IV → Db F Ab） */
export function chordNoteNames(
  root: string,
  quality: ScaleQuality,
  degree: number,
  seventh = false,
): string[] {
  const rootName = chordRootName(root, quality, degree)
  const rootLetter = rootName.replace(/[#b]$/, '')
  const startIdx = LETTERS.indexOf(rootLetter as (typeof LETTERS)[number])
  const letters = [...LETTERS.slice(startIdx), ...LETTERS.slice(0, startIdx)]
  const rootPc = pitchClassOfKeyName(rootName)
  return CHORD_INTERVALS[chordQualityOfDegree(quality, degree, seventh)].map((iv) => {
    const pc = (rootPc + iv) % 12
    const letter = letters[LETTER_STEP[iv]]
    const diff = ((pc - NATURAL_PC[letter] + 12) % 12 + 12) % 12
    if (diff === 1) return `${letter}#`
    if (diff === 11) return `${letter}b`
    return letter
  })
}

/** 和弦 MIDI：根音取第 4 八度（如 ♭A 大调 I → [68, 72, 75]） */
export function chordMidis(
  root: string,
  quality: ScaleQuality,
  degree: number,
  seventh = false,
): number[] {
  const rootMidi = scaleMidi(root, quality, 4)[degree - 1]
  if (rootMidi === undefined) throw new Error(`级数越界: degree=${degree}`)
  return CHORD_INTERVALS[chordQualityOfDegree(quality, degree, seventh)].map((iv) => rootMidi + iv)
}

/** 级数罗马数字（大调：I ii iii IV V vi vii°；小调：i ii° III iv v VI VII；maj/aug 大写、min/dim 小写） */
export function romanOf(degree: number, quality: ScaleQuality, seventh = false): string {
  const triad = chordQualityOfDegree(quality, degree, false)
  const upper = triad === 'maj' || triad === 'aug'
  const base = upper ? ROMAN[degree - 1] : ROMAN[degree - 1].toLowerCase()
  let suffix = ''
  if (seventh) suffix = qualitySuffix(chordQualityOfDegree(quality, degree, true))
  else if (triad === 'dim') suffix = '°'
  return base + suffix
}

/** 调内七个音级的和弦表（三和弦或七和弦） */
export interface ScaleChord {
  degree: number
  roman: string
  name: string
  notes: string[]
  midis: number[]
}

export function scaleChords(
  root: string,
  quality: ScaleQuality,
  seventh = false,
): ScaleChord[] {
  return [1, 2, 3, 4, 5, 6, 7].map((degree) => ({
    degree,
    roman: romanOf(degree, quality, seventh),
    name: chordName(root, quality, degree, seventh),
    notes: chordNoteNames(root, quality, degree, seventh),
    midis: chordMidis(root, quality, degree, seventh),
  }))
}
